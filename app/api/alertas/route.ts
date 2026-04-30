import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('alertas_config').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ alertas: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, nome, areas, nivel, palavras_extras } = body

  if (!email || !nome) return NextResponse.json({ erro: 'E-mail e nome são obrigatórios.' }, { status: 400 })

  const { data, error } = await supabase
    .from('alertas_config')
    .upsert({ email, nome, areas: areas || [], nivel: nivel || ['federal'], palavras_extras: palavras_extras || [], ativo: true }, { onConflict: 'email' })
    .select()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, alerta: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ erro: 'ID obrigatório.' }, { status: 400 })
  const { error } = await supabase.from('alertas_config').delete().eq('id', id)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
