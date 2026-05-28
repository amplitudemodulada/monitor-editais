import { randomUUID } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface Edital {
  id?: string
  titulo: string
  orgao: string
  data_publicacao: string
  url: string
  categoria: string
  resumo: string
  palavras_chave: string[]
  nivel: 'federal' | 'estadual' | 'municipal'
  fonte: string
  banca: string
  status: 'aberto' | 'previsto' | 'em_andamento' | 'encerrado'
  created_at?: string
}

export interface AlertaConfig {
  id?: string
  email: string
  nome: string
  areas: string[]
  nivel: string[]
  palavras_extras: string[]
  ativo: boolean
  created_at?: string
}

interface AlertaEnviado {
  edital_id?: string
  email: string
  enviado_em: string
}

interface ScraperLog {
  inseridos: number
  duplicados: number
  erros: number
  status: string
  fonte: string
  executado_em?: string
}

const DATA_DIR = join(process.cwd(), 'public', 'data')

function filePath(name: string) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  return join(DATA_DIR, name)
}

function lerJson<T>(name: string, fallback: T): T {
  try {
    const raw = readFileSync(filePath(name), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function escreverJson<T>(name: string, data: T) {
  writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf-8')
}

// ----- Editais -----

export function carregarEditais(): Edital[] {
  return lerJson<Edital[]>('editais.json', [])
}

export function salvarEditaisLote(lista: Edital[], fonte: string) {
  if (!lista.length) return { fonte, coletados: 0, inseridos: 0, duplicados: 0, erros: 0, novos: [] as Edital[] }
  const existentes = carregarEditais()
  const urlsExistentes = new Set(existentes.map(e => e.url))
  let inseridos = 0
  const novos: Edital[] = []
  for (const edital of lista) {
    if (urlsExistentes.has(edital.url)) continue
    const novo: Edital = { ...edital, id: edital.id || randomUUID(), created_at: new Date().toISOString() }
    novos.push(novo)
    existentes.push(novo)
    urlsExistentes.add(edital.url)
    inseridos++
  }
  escreverJson('editais.json', existentes)
  return {
    fonte,
    coletados: lista.length,
    inseridos,
    duplicados: lista.length - inseridos,
    erros: 0,
    novos,
  }
}

export function atualizarEdital(id: string, campos: Partial<Edital>) {
  const editais = carregarEditais()
  const idx = editais.findIndex(e => e.id === id)
  if (idx === -1) return false
  editais[idx] = { ...editais[idx], ...campos }
  escreverJson('editais.json', editais)
  return true
}

// ----- Alertas Config -----

export function carregarAlertasConfig(): AlertaConfig[] {
  return lerJson<AlertaConfig[]>('alertas_config.json', [])
}

export function salvarAlertaConfig(config: AlertaConfig) {
  const configs = carregarAlertasConfig()
  const idx = configs.findIndex(c => c.email === config.email)
  const novo: AlertaConfig = {
    ...config,
    id: config.id || randomUUID(),
    created_at: new Date().toISOString(),
  }
  if (idx >= 0) {
    configs[idx] = { ...configs[idx], ...novo }
  } else {
    configs.push(novo)
  }
  escreverJson('alertas_config.json', configs)
  return novo
}

export function deletarAlertaConfig(id: string) {
  const configs = carregarAlertasConfig()
  const filtrados = configs.filter(c => c.id !== id)
  if (filtrados.length === configs.length) return false
  escreverJson('alertas_config.json', filtrados)
  return true
}

// ----- Alertas Enviados -----

export function salvarAlertasEnviados(lista: AlertaEnviado[]) {
  const registros = lerJson<AlertaEnviado[]>('alertas_enviados.json', [])
  registros.push(...lista)
  escreverJson('alertas_enviados.json', registros)
}

// ----- Scraper Log -----

export function salvarScraperLog(log: ScraperLog) {
  const logs = lerJson<ScraperLog[]>('scraper_log.json', [])
  logs.push({ ...log, executado_em: new Date().toISOString() })
  escreverJson('scraper_log.json', logs)
}
