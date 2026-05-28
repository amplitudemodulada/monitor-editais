import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

async function scrapePagina(url: string, status: Edital['status']): Promise<Edital[]> {
  const { data } = await axios.get(url, { timeout: 8000, headers: HEADERS })
  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('div.list__item').each((_, el) => {
    const link = $(el).find('a').first()
    const href = link.attr('href') || ''
    const titulo = link.find('div.content__title').text().trim()
    if (!titulo || titulo.length < 5) return

    const urlCompleta = href.startsWith('http') ? href : `https://www.idcap.org.br${href}`
    if (vistos.has(urlCompleta)) return
    vistos.add(urlCompleta)

    const resumo = link.find('div.content__infos').text().trim()

    resultado.push({
      titulo,
      orgao: extrairOrgao(titulo),
      data_publicacao: new Date().toISOString().split('T')[0],
      url: urlCompleta,
      categoria: detectarCategoria(titulo, resumo),
      banca: 'IDCAP',
      resumo: resumo.slice(0, 500),
      palavras_chave: [],
      nivel: inferirNivel(titulo),
      fonte: 'IDCAP',
      status,
    })
  })

  return resultado
}

export async function scrapeIdcap(): Promise<Edital[]> {
  const [abertos, andamento] = await Promise.allSettled([
    scrapePagina('https://www.idcap.org.br/index/abertos', 'aberto'),
    scrapePagina('https://www.idcap.org.br/index/1', 'em_andamento'),
  ])

  return [
    ...(abertos.status   === 'fulfilled' ? abertos.value   : []),
    ...(andamento.status === 'fulfilled' ? andamento.value : []),
  ]
}
