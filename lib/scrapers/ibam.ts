import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }
const BASE = 'https://www.ibam-concursos.org.br'

const STATUS_MAP: Record<string, Edital['status']> = {
  '1': 'aberto',
  '2': 'em_andamento',
  '3': 'encerrado',
  '8': 'encerrado',
  '9': 'previsto',
}

async function scrapePagina(statusParam: string): Promise<Edital[]> {
  const { data } = await axios.get(`${BASE}/?status=${statusParam}`, { timeout: 10000, headers: HEADERS })
  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('div.concurso-card').each((_, card) => {
    const cardDiv = $(card).find('div.card')
    const statusClass = cardDiv.attr('class')?.match(/card-status-(\d+)/)?.[1] || statusParam
    const status = STATUS_MAP[statusClass] || 'aberto'

    const tituloEl = cardDiv.find('div.card-body div.fs-16')
    let titulo = tituloEl.text().trim()
    if (!titulo || titulo.length < 5) return

    const statusText = cardDiv.find('strong.status').text().trim()

    // Extract document links for the URL
    const docLinks: string[] = []
    cardDiv.find('a[href*="documento/"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (href) docLinks.push(href.startsWith('http') ? href : `${BASE}/${href}`)
    })

    const url = docLinks.length > 0
      ? docLinks[0]
      : `${BASE}/?status=${statusParam}`

    if (vistos.has(url)) return
    vistos.add(url)

    // Build resumo from status text and document count
    const resumo = [statusText, `${docLinks.length} documento(s) disponíve(is)`].filter(Boolean).join(' · ')

    resultado.push({
      titulo,
      orgao: extrairOrgao(titulo),
      data_publicacao: new Date().toISOString().split('T')[0],
      url,
      categoria: detectarCategoria(titulo, ''),
      banca: 'IBAM',
      resumo,
      palavras_chave: [],
      nivel: inferirNivel(titulo),
      fonte: 'IBAM Concursos',
      status,
    })
  })

  return resultado
}

export async function scrapeIbam(): Promise<Edital[]> {
  const [abertos, andamento, encerrados] = await Promise.allSettled([
    scrapePagina('1'),
    scrapePagina('2'),
    scrapePagina('3'),
  ])

  return [
    ...(abertos.status    === 'fulfilled' ? abertos.value    : []),
    ...(andamento.status  === 'fulfilled' ? andamento.value  : []),
    ...(encerrados.status === 'fulfilled' ? encerrados.value : []),
  ]
}
