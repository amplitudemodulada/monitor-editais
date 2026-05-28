import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

async function scrapePagina(url: string, status: Edital['status']): Promise<Edital[]> {
  const { data } = await axios.get(url, { timeout: 5000, headers: HEADERS })
  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('article a[href*="concurso"], article a[href*="edital"]').each((_, el) => {
    const titulo = $(el).text().trim()
    const href   = $(el).attr('href') || ''
    if (!titulo || vistos.has(href) || titulo.length < 5) return
    vistos.add(href)

    resultado.push({
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao: new Date().toISOString().split('T')[0],
      url:             href.startsWith('http') ? href : `https://www.estrategiaconcursos.com.br${href}`,
      categoria:       detectarCategoria(titulo, ''),
      banca:           '',
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'Estratégia Concursos',
      status,
    })
  })

  return resultado
}


export async function scrapeEstrategia(): Promise<Edital[]> {
  const [abertos, previstos, blog] = await Promise.allSettled([
    scrapePagina('https://www.estrategiaconcursos.com.br/blog/concursos-abertos/', 'aberto'),
    scrapePagina('https://www.estrategiaconcursos.com.br/blog/concursos-previstos/', 'previsto'),
    scrapePagina('https://www.estrategiaconcursos.com.br/blog/', 'aberto'),
  ])

  return [
    ...(abertos.status   === 'fulfilled' ? abertos.value   : []),
    ...(previstos.status === 'fulfilled' ? previstos.value : []),
    ...(blog.status      === 'fulfilled' ? blog.value      : []),
  ]
}
