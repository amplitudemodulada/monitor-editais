import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const nivel     = searchParams.get('nivel')
  const status    = searchParams.get('status')
  const fonte     = searchParams.get('fonte')
  const q         = searchParams.get('q')
  const limit     = Number(searchParams.get('limit') || 100)

  let query = supabase
    .from('editais')
    .select('*')
    .order('data_publicacao', { ascending: false })
    .limit(limit)

  if (categoria) query = query.eq('categoria', categoria)
  if (nivel)     query = query.eq('nivel', nivel)
  if (status)    query = query.eq('status', status)
  if (fonte)     query = query.eq('fonte', fonte)
  if (q)         query = query.ilike('titulo', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ editais: data, total: data?.length ?? 0 })
}
