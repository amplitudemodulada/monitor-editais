import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}

// VUNESP is blocked by Akamai CDN — try their concursos page with realistic headers
async function tryVunespDirect(): Promise<Edital[]> {
  const { data } = await axios.get('https://www.vunesp.com.br/concursos', {
    timeout: 10000,
    headers: HEADERS,
  })

  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('a').each((_, el) => {
    const href  = $(el).attr('href') || ''
    const titulo = $(el).text().trim()

    if (!titulo || titulo.length < 8) return
    if (!/concurso|edital|seleção|processo/i.test(titulo) && !/concurso|vunesp/i.test(href)) return

    const url = href.startsWith('http') ? href : `https://www.vunesp.com.br${href}`
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
      banca:           'VUNESP',
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'VUNESP',
      status,
    })
  })

  return resultado
}

// Fallback: VUNESP RSS feed (if available)
async function tryVunespRss(): Promise<Edital[]> {
  const { data: xml } = await axios.get('https://www.vunesp.com.br/feed', {
    timeout: 8000,
    headers: HEADERS,
  })

  const $ = load(xml, { xmlMode: true })
  const resultado: Edital[] = []

  $('item').each((_, el) => {
    const titulo = $('title', el).text().trim()
    const url    = $('link', el).text().trim()
    const desc   = $('description', el).text().trim()
    const pubDate = $('pubDate', el).text().trim()

    if (!titulo || !url) return

    const data_publicacao = pubDate
      ? new Date(pubDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    resultado.push({
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao,
      url,
      categoria:       detectarCategoria(titulo, desc),
      banca:           'VUNESP',
      resumo:          desc.slice(0, 500),
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'VUNESP',
      status:          'aberto' as const,
    })
  })

  return resultado
}

export async function scrapeVunesp(): Promise<Edital[]> {
  try {
    const rss = await tryVunespRss()
    if (rss.length > 0) return rss
  } catch {
    // RSS not available
  }

  return tryVunespDirect()
}
