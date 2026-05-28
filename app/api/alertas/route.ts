import { NextRequest, NextResponse } from 'next/server'
import { carregarAlertasConfig, salvarAlertaConfig, deletarAlertaConfig } from '@/lib/storage'

export async function GET() {
  const alertas = carregarAlertasConfig()
  return NextResponse.json({ alertas })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, nome, areas, nivel, palavras_extras } = body

  if (!email || !nome) return NextResponse.json({ erro: 'E-mail e nome são obrigatórios.' }, { status: 400 })

  const alerta = salvarAlertaConfig({
    email, nome,
    areas: areas || [],
    nivel: nivel || ['federal'],
    palavras_extras: palavras_extras || [],
    ativo: true,
  })

  return NextResponse.json({ ok: true, alerta })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ erro: 'ID obrigatório.' }, { status: 400 })
  const ok = deletarAlertaConfig(id)
  if (!ok) return NextResponse.json({ erro: 'Alerta não encontrado.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
