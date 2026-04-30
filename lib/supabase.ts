import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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
