import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const nivel     = searchParams.get('nivel')
  const status    = searchParams.get('status')
  const fonte     = searchParams.get('fonte')
  const banca     = searchParams.get('banca')
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

  // Tenta com filtro de banca; se falhar, tenta sem e faz o filtro em memória
  const montarQuery = (comBanca: boolean) => {
    let q2 = supabase.from('editais').select('*')
    if (comBanca && banca) q2 = q2.eq('banca', banca)
    if (categoria) q2 = q2.eq('categoria', categoria)
    if (nivel)     q2 = q2.eq('nivel', nivel)
    if (status)    q2 = q2.eq('status', status)
    if (fonte)     q2 = q2.eq('fonte', fonte)
    if (q)         q2 = q2.ilike('titulo', `%${q}%`)
    return q2.order('data_publicacao', { ascending: false }).limit(limit)
  }

  let { data, error } = await montarQuery(true)
  if (error && banca) {
    // Coluna banca não existe → busca sem ela e filtra em memória
    const r2   = await montarQuery(false)
    error = r2.error
    data  = r2.data ? r2.data.filter((e: any) => e.banca === banca) : null
  }

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ editais: data, total: data?.length ?? 0 })
}
