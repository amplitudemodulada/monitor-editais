import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

// Try the main WordPress site for concurso-related content
async function tryWordpress(): Promise<Edital[]> {
  const { data } = await axios.get('https://idecan.org.br/wp-json/wp/v2/posts', {
    timeout: 6000,
    headers: HEADERS,
    params: { per_page: 20, search: 'concurso', orderby: 'date', order: 'desc' },
  })

  if (!Array.isArray(data)) return []

  return data.map((post: any) => {
    const titulo = post.title?.rendered
      ? load(post.title.rendered).root().text()
      : 'Concurso IDECAN'
    const resumo = post.excerpt?.rendered
      ? load(post.excerpt.rendered).root().text().slice(0, 500)
      : ''
    const url = post.link || 'https://idecan.org.br'
    const data_publicacao = (post.date || new Date().toISOString()).split('T')[0]

    return {
      titulo,
      orgao: extrairOrgao(titulo),
      data_publicacao,
      url,
      categoria: detectarCategoria(titulo, resumo),
      banca: 'IDECAN',
      resumo,
      palavras_chave: [],
      nivel: inferirNivel(titulo),
      fonte: 'IDECAN',
      status: 'aberto' as const,
    }
  })
}

// Try the concurso subdomain (behind Cloudflare — may fail)
async function tryConcursoSite(): Promise<Edital[]> {
  const { data } = await axios.get('https://concurso.idecan.org.br', {
    timeout: 6000,
    headers: HEADERS,
  })

  const $ = load(data)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('a[href*="Concurso.aspx"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const titulo = $(el).text().trim()
    if (!titulo || titulo.length < 5) return

    const url = href.startsWith('http') ? href : `https://concurso.idecan.org.br${href}`
    if (vistos.has(url)) return
    vistos.add(url)

    resultado.push({
      titulo,
      orgao: extrairOrgao(titulo),
      data_publicacao: new Date().toISOString().split('T')[0],
      url,
      categoria: detectarCategoria(titulo, ''),
      banca: 'IDECAN',
      resumo: '',
      palavras_chave: [],
      nivel: inferirNivel(titulo),
      fonte: 'IDECAN',
      status: 'aberto',
    })
  })

  return resultado
}

export async function scrapeIdecan(): Promise<Edital[]> {
  try {
    const result = await tryConcursoSite()
    if (result.length > 0) return result
  } catch {
    // concurso subdomain blocked by Cloudflare, fallback to WordPress
  }

  try {
    return await tryWordpress()
  } catch {
    return []
  }
}
