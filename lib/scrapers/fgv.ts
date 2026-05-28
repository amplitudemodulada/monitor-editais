import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

async function scrapePaginaFGV(page: number, vistos: Set<string>): Promise<Edital[]> {
  const { data } = await axios.get('https://conhecimento.fgv.br/concursos', {
    timeout: 5000,
    headers: HEADERS,
    params: { page },
  })

  const $ = load(data)
  const resultado: Edital[] = []

  $('a').each((_, el) => {
    const href   = $(el).attr('href') || ''
    const titulo = $(el).text().trim()

    if (!titulo || titulo.length < 10) return
    if (!/concurso|edital|seleção|processo seletivo/i.test(titulo) && !/concurso|edital/i.test(href)) return

    const url = href.startsWith('http') ? href : `https://conhecimento.fgv.br${href}`
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
      banca:           'FGV',
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'FGV Concursos',
      status,
    })
  })

  return resultado
}

export async function scrapeFGV(): Promise<Edital[]> {
  const vistos = new Set<string>()
  const todos: Edital[] = []

  // Páginas em paralelo (0-12), deduplica por URL
  const pages = Array.from({ length: 20 }, (_, i) => i)
  const results = await Promise.allSettled(
    pages.map(page => scrapePaginaFGV(page, vistos))
  )

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      todos.push(...r.value)
    }
  }

  return todos
}
