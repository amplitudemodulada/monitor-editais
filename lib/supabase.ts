import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getSupabase() as any)[prop]
  },
})

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
