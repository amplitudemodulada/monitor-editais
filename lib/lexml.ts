import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import type { Edital } from './supabase'

const LEXML_URL = 'https://www.lexml.gov.br/busca/SRU'

const PALAVRAS_EDITAL = [
  'edital', 'concurso público', 'processo seletivo',
  'abertura de inscrição', 'seleção pública', 'certame',
]

const CATEGORIAS: Record<string, string[]> = {
  'TI / Tecnologia':   ['tecnologia', 'informática', 'ti ', 'sistemas', 'analista de sistemas', 'desenvolvedor'],
  'Saúde':             ['saúde', 'enfermagem', 'médico', 'farmácia', 'odontologia', 'psicólogo'],
  'Educação':          ['educação', 'professor', 'pedagogo', 'docente', 'ensino'],
  'Administrativo':    ['administração', 'administrativo', 'secretário', 'assistente'],
  'Jurídico':          ['advogado', 'jurídico', 'procurador', 'defensor'],
  'Engenharia':        ['engenheiro', 'engenharia', 'arquiteto', 'arquitetura'],
  'Segurança Pública': ['policial', 'delegado', 'bombeiro', 'guarda municipal'],
  'Geral':             [],
}

function detectarCategoria(titulo: string, resumo: string): string {
  const texto = (titulo + ' ' + resumo).toLowerCase()
  for (const [cat, palavras] of Object.entries(CATEGORIAS)) {
    if (cat === 'Geral') continue
    if (palavras.some(p => texto.includes(p))) return cat
  }
  return 'Geral'
}

function extrairOrgao(titulo: string): string {
  const padroes = [
    /(?:prefeitura(?:\s+municipal)?\s+(?:de|do|da)\s+[\w\s]+)/i,
    /(?:governo\s+(?:do\s+estado|federal|estadual)\s+(?:de|do|da)?\s*[\w\s]*)/i,
    /(?:ministério\s+(?:da|do|de)\s+[\w\s]+)/i,
    /(?:secretaria\s+(?:de|da|do|municipal|estadual)\s+[\w\s]+)/i,
    /(?:tribunal\s+[\w\s]+)/i,
    /(?:câmara\s+(?:municipal|federal|dos deputados)\s*[\w\s]*)/i,
  ]
  for (const re of padroes) {
    const m = titulo.match(re)
    if (m) return m[0].trim()
  }
  return 'Órgão não identificado'
}

export async function buscarEditalLexml(pagina = 1): Promise<Edital[]> {
  const startRecord = (pagina - 1) * 10 + 1
  const query = PALAVRAS_EDITAL.map(p => `"${p}"`).join(' or ')

  const { data: xml } = await axios.get(LEXML_URL, {
    params: {
      operation:      'searchRetrieve',
      version:        '1.1',
      query:          `dc.type="edital" or (${query})`,
      maximumRecords: 20,
      startRecord,
      recordSchema:   'oai_dc',
    },
    timeout: 15000,
  })

  const parsed = await parseStringPromise(xml, { explicitArray: false })
  const records = parsed?.['zs:searchRetrieveResponse']?.['zs:records']?.['zs:record']

  if (!records) return []
  const lista = Array.isArray(records) ? records : [records]

  return lista.map((rec: any) => {
    const dc = rec?.['zs:recordData']?.['oai_dc:dc'] || {}
    const titulo   = dc['dc:title']   || 'Sem título'
    const resumo   = dc['dc:description'] || ''
    const url      = dc['dc:identifier'] || ''
    const dataRaw  = dc['dc:date'] || new Date().toISOString().split('T')[0]

    return {
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao: dataRaw,
      url,
      categoria:       detectarCategoria(titulo, resumo),
      resumo:          resumo.slice(0, 500),
      palavras_chave:  PALAVRAS_EDITAL.filter(p => (titulo + resumo).toLowerCase().includes(p)),
      nivel:           'federal',
      fonte:           'LexML',
    } satisfies Edital
  })
}
