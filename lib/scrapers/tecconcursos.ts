import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
}
const BASE = 'https://www.tecconcursos.com.br'

function extrairStatus(texto: string): Edital['status'] {
  if (/encerrado|resultado|homologação|realizado/i.test(texto)) return 'encerrado'
  if (/previsto|em breve|previs/i.test(texto)) return 'previsto'
  if (/andamento|aberto|inscriç[ãa]o|prova|gabarito/i.test(texto)) return 'em_andamento'
  return 'aberto'
}

function extrairBanca(texto: string): string {
  const match = texto.match(/Banca\s+([A-ZÀ-Ú\s]+?)(?:\s*\(|,|$|Inscrições|Salário)/i)
  if (match) return match[1].trim()
  return 'Tec Concursos'
}

function extrairSalario(texto: string): string {
  const match = texto.match(/Sal[áa]rio\s+R?\$?\s*[\d.,]+/)
  if (match) return match[0]
  return ''
}

function extrairVagas(texto: string): number {
  const match = texto.match(/Vagas?\s+(\d+)/i)
  if (match) return parseInt(match[1], 10)
  return 0
}

function extrairDataInscricao(texto: string): string {
  const match = texto.match(/Inscriç[ão]+\w*\s+at[ée]\s+(\d{2}\/\d{2}\/\d{4})/i)
  if (match) return match[1]
  return ''
}

function extrairDataProva(texto: string): string {
  const match = texto.match(/Data\s+da\s+prova[:\s]+(\d{2}\/\d{2}\/\d{4})/i)
  if (match) return match[1]
  return ''
}

async function scrapeGuia(url: string): Promise<Edital | null> {
  try {
    const { data } = await axios.get(url, { timeout: 7000, headers: HEADERS })
    const $ = load(data)

    const tituloEl = $('.detalhes-cabecalho-informacoes-texto').first()
    let titulo = tituloEl.text().trim()
    if (!titulo) {
      const h1 = $('h1').first().text().trim()
      if (h1) titulo = h1
    }
    if (!titulo || titulo.length < 5) return null

    const orgaoEl = $('.detalhes-cabecalho-informacoes-orgao').first()
    const orgao = orgaoEl.text().trim() || extrairOrgao(titulo)

    const dataCriacaoEl = $('.detalhes-cabecalho-informacoes-data').first()
    const dataCriacao = dataCriacaoEl.text().trim()
    const data_publicacao = dataCriacao
      ? dataCriacao.replace('Criado em ', '').split('/').reverse().join('-')
      : new Date().toISOString().split('T')[0]

    // Extract info box
    const infoBox = $('.agrupador-detalhes-informacoes').first().text().trim()
    const infoRight = $('.agrupador-detalhes-direito').first().text().trim()
    const textoCompleto = infoBox + ' ' + infoRight

    const banca = extrairBanca(textoCompleto)
    const status = (() => {
      if (/encerrado|resultado|homologação/i.test(textoCompleto)) return 'encerrado' as const
      if (/previsto|em breve/i.test(textoCompleto)) return 'previsto' as const
      if (/aberto|inscriç[ãa]o/i.test(textoCompleto)) return 'aberto' as const
      if (/andamento|prova|gabarito/i.test(textoCompleto)) return 'em_andamento' as const
      return 'aberto'
    })()

    const resumoParts = [infoBox, infoRight].filter(Boolean)

    return {
      titulo,
      orgao,
      data_publicacao,
      url,
      categoria: detectarCategoria(titulo, textoCompleto),
      banca,
      resumo: resumoParts.join(' · ').slice(0, 500),
      palavras_chave: [],
      nivel: inferirNivel(titulo),
      fonte: 'Tec Concursos',
      status,
    }
  } catch {
    return null
  }
}

export async function scrapeTecConcursos(): Promise<Edital[]> {
  const vistos = new Set<string>()
  const resultados: Edital[] = []

  try {
    // 1. Buscar homepage para coletar URLs dos guias
    const { data } = await axios.get(BASE, { timeout: 7000, headers: HEADERS })
    const $ = load(data)

    const guiaUrls: string[] = []
    $('a[href*="/guias/"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (href.includes('/guias/') && href !== '/guias/' && !href.includes('?')) {
        const url = href.startsWith('http') ? href : `${BASE}${href}`
        if (!vistos.has(url)) {
          vistos.add(url)
          guiaUrls.push(url)
        }
      }
    })

    // 2. Scrape cada guia em paralelo
    const promises = guiaUrls.map(url => scrapeGuia(url))
    const results = await Promise.allSettled(promises)

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        resultados.push(r.value)
      }
    }
  } catch {
    // fallback silencioso
  }

  return resultados
}
