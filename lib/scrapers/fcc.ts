import axios from 'axios'
import { load } from 'cheerio'
import type { Edital } from '../supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from '../classificador'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }

export async function scrapeFCC(): Promise<Edital[]> {
  // FCC uses ISO-8859-1 — request as arraybuffer and decode manually
  const resp = await axios.get('https://www.fcc.org.br/fcc/concursos-e-selecoes/', {
    timeout: 8000,
    headers: HEADERS,
    responseType: 'arraybuffer',
  })

  const decoded = Buffer.from(resp.data).toString('latin1')
  const $ = load(decoded)
  const resultado: Edital[] = []
  const vistos = new Set<string>()

  $('a').each((_, el) => {
    const href  = $(el).attr('href') || ''
    const titulo = $(el).text().trim()

    if (!titulo || titulo.length < 8) return
    if (!/concurso|edital|seleção|processo seletivo/i.test(titulo)) return

    const url = href.startsWith('http') ? href : `https://www.fcc.org.br${href}`
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
      banca:           'FCC',
      resumo:          '',
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'FCC',
      status,
    })
  })

  return resultado
}
