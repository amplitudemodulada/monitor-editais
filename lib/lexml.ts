import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import type { Edital } from './supabase'
import { detectarCategoria, extrairOrgao, inferirNivel } from './classificador'

const LEXML_URL = 'https://www.lexml.gov.br/busca/SRU'

export async function buscarEditalLexml(pagina = 1): Promise<Edital[]> {
  const startRecord = (pagina - 1) * 20 + 1

  const { data: xml } = await axios.get(LEXML_URL, {
    params: {
      operation:      'searchRetrieve',
      version:        '1.1',
      query:          'dc.type="edital"',
      maximumRecords: 20,
      startRecord,
      recordSchema:   'oai_dc',
    },
    timeout: 15000,
  })

  const parsed  = await parseStringPromise(xml, { explicitArray: false })
  const records = parsed?.['zs:searchRetrieveResponse']?.['zs:records']?.['zs:record']
  if (!records) return []

  const lista = Array.isArray(records) ? records : [records]

  return lista.map((rec: any) => {
    const dc      = rec?.['zs:recordData']?.['oai_dc:dc'] || {}
    const titulo  = dc['dc:title']       || 'Sem título'
    const resumo  = dc['dc:description'] || ''
    const url     = dc['dc:identifier']  || ''
    const dataRaw = dc['dc:date']        || new Date().toISOString().split('T')[0]

    return {
      titulo,
      orgao:           extrairOrgao(titulo),
      data_publicacao: dataRaw,
      url,
      categoria:       detectarCategoria(titulo, resumo),
      resumo:          resumo.slice(0, 500),
      palavras_chave:  [],
      nivel:           inferirNivel(titulo),
      fonte:           'DOU / LexML',
      status:          'aberto',
    } satisfies Edital
  })
}
