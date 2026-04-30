import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

async function scrapePagina(url: string, status: Edital['status']): Promise<Edital[]> {
  const { data } = await axios.get(url, { timeout: 15000, headers: HEADERS })
  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('h3 a').each((_, el) => {
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
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'Estratégia Concursos',
      status,
    })
  })

  return resultado
}

function inferirNivel(titulo: string): 'federal' | 'estadual' | 'municipal' {
  const t = titulo.toLowerCase()
  if (/federal|inss|receita|tcu|stj|stf|mpu|dpu|cgu|agu|pf|prf/.test(t)) return 'federal'
  if (/municipal|câmara|prefeitura|gcm|guarda municipal/.test(t)) return 'municipal'
  return 'estadual'
}

export async function scrapeEstrategia(): Promise<Edital[]> {
  const [abertos, previstos] = await Promise.allSettled([
    scrapePagina('https://www.estrategiaconcursos.com.br/blog/concursos-abertos/', 'aberto'),
    scrapePagina('https://www.estrategiaconcursos.com.br/blog/concursos-previstos/', 'previsto'),
  ])

  return [
    ...(abertos.status   === 'fulfilled' ? abertos.value   : []),
    ...(previstos.status === 'fulfilled' ? previstos.value : []),
  ]
}
