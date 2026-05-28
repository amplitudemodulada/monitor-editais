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

  // Direção usa links com /artigos/ ou /noticias/ no path
  $('a[href*="concurso"], a[href*="edital"]').each((_, el) => {
    const titulo = $(el).text().trim()
    const href   = $(el).attr('href') || ''
    if (!titulo || titulo.length < 10 || vistos.has(href)) return
    if (href.includes('assinatura') || href.includes('lp.') || href.includes('utm_')) return
    vistos.add(href)

    resultado.push({
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao: new Date().toISOString().split('T')[0],
      url:             href.startsWith('http') ? href : `https://www.direcaoconcursos.com.br${href}`,
      categoria:       detectarCategoria(titulo, ''),
      banca:           '',
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'Direção Concursos',
      status,
    })
  })

  return resultado.slice(0, 60)
}

export async function scrapeDirecao(): Promise<Edital[]> {
  const [abertos, previstos, noticias] = await Promise.allSettled([
    scrapePagina('https://www.direcaoconcursos.com.br/artigos/concursos-abertos/', 'aberto'),
    scrapePagina('https://www.direcaoconcursos.com.br/artigos/concursos-previstos-2026/', 'previsto'),
    scrapePagina('https://www.direcaoconcursos.com.br/noticias', 'aberto'),
  ])

  return [
    ...(abertos.status   === 'fulfilled' ? abertos.value   : []),
    ...(previstos.status === 'fulfilled' ? previstos.value : []),
    ...(noticias.status  === 'fulfilled' ? noticias.value  : []),
  ]
}
