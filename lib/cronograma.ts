import axios from 'axios'
import { load } from 'cheerio'

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0' }
const IBAM_BASE = 'https://www.ibam-concursos.org.br'

export interface EventoCronograma {
  evento: string
  data?: string
  tipo: 'evento' | 'publicacao' | 'prazo'
  url?: string
}

export interface ResultadoCronograma {
  status: string
  eventoAtual?: string
  proximosEventos: EventoCronograma[]
  publicacoes: EventoCronograma[]
  erro?: string
}

function parseDate(text: string): string | undefined {
  const padraoBR = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (padraoBR) return `${padraoBR[3]}-${padraoBR[2]}-${padraoBR[1]}`
  const padraoISO = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (padraoISO) return padraoISO[0]
  return undefined
}

function inferirStatus(publicacoes: EventoCronograma[]): string {
  const textos = publicacoes.map(p => p.evento.toLowerCase()).join(' ')

  const temHomologacao = /\bhomologação\b/.test(textos)
  const temResultadoFinal = /\bresultado final\b/.test(textos)

  const temGabaritoDefinitivo = /\bgabarito definitivo\b/.test(textos)
  const temResultado = /\bresultado\b/.test(textos)
  const temLocalProva = /\blocal de prova\b/.test(textos)
  const temGabaritoPreliminar = /\bgabarito preliminar\b/.test(textos)
  const temRecurso = /\brecurso\b/.test(textos)

  const temEditalAbertura = /\bedital de abertura\b/.test(textos)
  const temInscricao = /\binscriç[ãa]o\b/.test(textos)

  const temErrata = /\berrata\b/.test(textos)
  const temAnexo = /\banexo\b/.test(textos)

  if (temHomologacao || temResultadoFinal) return 'encerrado'

  if (temGabaritoDefinitivo || temResultado || temLocalProva || temGabaritoPreliminar || temRecurso) return 'em_andamento'

  if (temEditalAbertura || temInscricao || temAnexo || temErrata) return 'aberto'

  if (publicacoes.length === 0) return 'previsto'

  return 'aberto'
}

async function parseIdcap(url: string): Promise<ResultadoCronograma> {
  const { data } = await axios.get(url, { timeout: 8000, headers: HEADERS })
  const $ = load(data)

  const publicacoes: EventoCronograma[] = []

  $('div#publicacoes table tbody').each((_, tbody) => {
    $(tbody).find('tr').each((_, tr) => {
      const link = $(tr).find('a')
      const href = link.attr('href') || ''
      const texto = link.text().trim()
      const small = $(tr).find('small').text().trim()
      const data = parseDate(small)

      if (!texto) return

      publicacoes.push({
        evento: texto,
        data,
        tipo: /inscriç[ãa]o|isenção|recurso|resultado|homologação/i.test(texto) ? 'prazo' : 'publicacao',
        url: href,
      })
    })
  })

  const status = inferirStatus(publicacoes)

  return { status, proximosEventos: [], publicacoes }
}

async function parseIbam(url: string): Promise<ResultadoCronograma> {
  // IBAM cards are on listing pages — fetch status=2 (andamento) and status=1 (abertos)
  // If the URL has "documento/" it's a direct doc link — try the listing
  const { data } = await axios.get(`${IBAM_BASE}/?status=2`, { timeout: 8000, headers: HEADERS })
  const $ = load(data)

  const publicacoes: EventoCronograma[] = []
  let docUrl = url

  // Find which card matches our document URL
  let cardEncontrado: any = null
  $('div.concurso-card').each((_, card) => {
    const temDoc = $(card).find(`a[href^="${url.replace(IBAM_BASE, '')}"], a[href="${url}"]`).length > 0
    if (temDoc) cardEncontrado = card
  })

  // If no match on status=2, try status=1 and status=3
  if (!cardEncontrado) {
    for (const s of ['1', '3']) {
      const resp = await axios.get(`${IBAM_BASE}/?status=${s}`, { timeout: 8000, headers: HEADERS })
      const $s = load(resp.data)
      $s('div.concurso-card').each((_, card) => {
        const temDoc = $s(card).find(`a[href="${url.replace(IBAM_BASE, '')}"], a[href="${url}"]`).length > 0
        if (temDoc) cardEncontrado = card
      })
      if (cardEncontrado) break
    }
  }

  // Fallback: use the title passed in URL to find the card
  const titulo = decodeURIComponent(url.split('?titulo=')[1] || '')
  if (!cardEncontrado && titulo) {
    for (const s of ['1', '2', '3']) {
      const resp = await axios.get(`${IBAM_BASE}/?status=${s}`, { timeout: 8000, headers: HEADERS })
      const $s = load(resp.data)
      $s('div.concurso-card').each((_, card) => {
        const text = $s(card).find('div.fs-16').text().trim()
        if (text.includes(titulo.slice(0, 30))) cardEncontrado = card
      })
      if (cardEncontrado) {
        docUrl = `${IBAM_BASE}/?status=${s}&titulo=${encodeURIComponent(titulo)}`
        break
      }
    }
  }

  // Extract documents from the card
  if (cardEncontrado) {
    const $card = load($(cardEncontrado).html() || '')
    $card('a[href*="documento/"]').each((_, el) => {
      const href = $card(el).attr('href') || ''
      const texto = $card(el).text().trim()
      if (!texto || texto.length < 3) return
      publicacoes.push({
        evento: texto,
        tipo: /inscriç[ãa]o|isenção|recurso|resultado|homologação/i.test(texto) ? 'prazo' : 'publicacao',
        url: href.startsWith('http') ? href : `${IBAM_BASE}/${href}`,
      })
    })
  }

  // Try to get the card status text from the original page
  let statusOverride: string | undefined
  if (cardEncontrado) {
    const statusText = $(cardEncontrado).find('strong.status').text().trim().toLowerCase()
    if (/encerrado|homologação|resultado final/i.test(statusText)) statusOverride = 'encerrado'
    else if (/andamento|prova|gabarito|resultado/i.test(statusText)) statusOverride = 'em_andamento'
    else if (/inscriç[ãa]o|aberto|edital/i.test(statusText)) statusOverride = 'aberto'
    else if (/em breve|previsto/i.test(statusText)) statusOverride = 'previsto'
  }

  const status = statusOverride || inferirStatus(publicacoes)

  return { status, proximosEventos: [], publicacoes }
}

async function parsePaginaGenerica(url: string): Promise<ResultadoCronograma> {
  let html: string
  try {
    const resp = await axios.get(url, { timeout: 8000, headers: HEADERS, responseType: 'arraybuffer' })
    html = Buffer.from(resp.data).toString('latin1')
  } catch {
    return { status: 'desconhecido', proximosEventos: [], publicacoes: [], erro: 'Página não acessível' }
  }

  const $ = load(html)
  const publicacoes: EventoCronograma[] = []
  const proximosEventos: EventoCronograma[] = []

  const palavrasChave = ['inscriç', 'prova', 'resultado', 'homologação', 'recurso', 'isenção', 'edital', 'cronograma', 'anexo']

  // Extract tables that look like cronogramas
  $('table').each((_, table) => {
    const texto = $(table).text()
    const temData = /\d{2}\/\d{2}\/\d{4}/.test(texto)
    const temEvento = palavrasChave.some(p => texto.toLowerCase().includes(p))
    if (!temData || !temEvento) return

    $(table).find('tr').each((_, tr) => {
      const cells = $(tr).find('td, th')
      if (cells.length < 2) return

      const texts = cells.map((_, el) => $(el).text().trim()).get()
      const data = texts.find(t => parseDate(t))
      const evento = texts.find(t => !parseDate(t) && t.length > 3)

      if (evento) {
        proximosEventos.push({
          evento,
          data: data ? parseDate(data) : undefined,
          tipo: /inscriç[ãa]o|recurso|prazo/i.test(evento) ? 'prazo' : 'evento',
        })
      }
    })
  })

  // Extract links to PDFs that look like publicações
  $('a[href$=".pdf"], a[href*="anexo"], a[href*="edital"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const texto = $(el).text().trim()
    if (!texto || texto.length < 5) return

    const pagina = $(el).closest('div, td, li').text()
    const data = parseDate(pagina) || parseDate($(el).next('small').text()) || parseDate($(el).parent().text())

    const jaExiste = publicacoes.some(p => p.evento === texto)
    if (!jaExiste) {
      publicacoes.push({
        evento: texto,
        data,
        tipo: /inscriç[ãa]o|isenção|recurso|resultado|homologação/i.test(texto) ? 'prazo' : 'publicacao',
        url: href.startsWith('http') ? href : new URL(href, url).href,
      })
    }
  })

  const status = inferirStatus(publicacoes)
  return { status, proximosEventos, publicacoes }
}

const PARSERS: Record<string, (url: string) => Promise<ResultadoCronograma>> = {
  'IDCAP': parseIdcap,
  'IBAM': parseIbam,
}

export async function buscarCronograma(url: string, banca: string): Promise<ResultadoCronograma> {
  const parser = PARSERS[banca]
  if (parser) {
    try {
      return await parser(url)
    } catch (err) {
      return { status: 'erro', proximosEventos: [], publicacoes: [], erro: `Erro ao acessar ${banca}: ${err instanceof Error ? err.message : 'erro desconhecido'}` }
    }
  }

  return parsePaginaGenerica(url)
}
