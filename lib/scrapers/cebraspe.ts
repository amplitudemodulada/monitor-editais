import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

// CEBRASPE is a React SPA — try their WordPress-based REST API
async function tryWordpressApi(): Promise<Edital[]> {
  const { data } = await axios.get('https://www.cebraspe.org.br/wp-json/wp/v2/concursos', {
    timeout: 6000,
    headers: HEADERS,
    params: { per_page: 30, orderby: 'date', order: 'desc' },
  })

  if (!Array.isArray(data)) return []

  return data.map((post: any) => {
    const titulo = post.title?.rendered
      ? load(post.title.rendered).root().text()
      : 'Concurso CEBRASPE'
    const resumo = post.excerpt?.rendered
      ? load(post.excerpt.rendered).root().text().slice(0, 500)
      : ''
    const url  = post.link || 'https://www.cebraspe.org.br'
    const data_publicacao = (post.date || new Date().toISOString()).split('T')[0]

    const textoCompleto = (titulo + ' ' + resumo).toLowerCase()
    const status: Edital['status'] = /encerrado|resultado|homologação/i.test(textoCompleto)
      ? 'encerrado'
      : /previsto|em breve/i.test(textoCompleto)
        ? 'previsto'
        : /andamento|prova|gabarito|inscriç[ãa]o/i.test(textoCompleto)
          ? 'em_andamento'
          : 'aberto'

    return {
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao,
      url,
      categoria:       detectarCategoria(titulo, resumo),
      banca:           'CEBRASPE',
      resumo,
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'CEBRASPE',
      status,
    }
  })
}

// Fallback: scrape concursos page directly
async function tryDirectScrape(): Promise<Edital[]> {
  const { data } = await axios.get('https://www.cebraspe.org.br/concursos', {
    timeout: 6000,
    headers: HEADERS,
  })

  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('a[href*="concurso"], a[href*="/concursos/"]').each((_, el) => {
    const href  = $(el).attr('href') || ''
    const titulo = $(el).text().trim()
    if (!titulo || titulo.length < 5) return

    const url = href.startsWith('http') ? href : `https://www.cebraspe.org.br${href}`
    if (vistos.has(url)) return
    vistos.add(url)

    const textoVizinho = $(el).closest('tr, li, div, td').text()
    const status: Edital['status'] = /encerrado|resultado|homologação/i.test(textoVizinho)
      ? 'encerrado'
      : /previsto|em breve/i.test(textoVizinho)
        ? 'previsto'
        : /andamento|prova|gabarito|inscriç[ãa]o/i.test(textoVizinho)
          ? 'em_andamento'
          : 'aberto'

    resultado.push({
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao: new Date().toISOString().split('T')[0],
      url,
      categoria:       detectarCategoria(titulo, ''),
      banca:           'CEBRASPE',
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'CEBRASPE',
      status,
    })
  })

  return resultado
}

export async function scrapeCebraspe(): Promise<Edital[]> {
  try {
    const apiResult = await tryWordpressApi()
    if (apiResult.length > 0) return apiResult
  } catch {
    // API not available, try direct scrape
  }

  return tryDirectScrape()
}
