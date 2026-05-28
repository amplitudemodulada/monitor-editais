import { NextRequest, NextResponse } from 'next/server'
import { carregarEditais } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const nivel     = searchParams.get('nivel')
  const status    = searchParams.get('status')
  const fonte     = searchParams.get('fonte')
  const banca     = searchParams.get('banca')
  const q         = searchParams.get('q')
  const limit     = Number(searchParams.get('limit') || 200)

  let editais = carregarEditais()

  if (categoria) editais = editais.filter(e => e.categoria === categoria)
  if (nivel)     editais = editais.filter(e => e.nivel === nivel)
  if (status)    editais = editais.filter(e => e.status === status)
  if (fonte)     editais = editais.filter(e => e.fonte === fonte)
  if (banca)     editais = editais.filter(e => e.banca === banca)
  if (q)         editais = editais.filter(e => e.titulo.toLowerCase().includes(q.toLowerCase()))

  editais.sort((a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime())

  return NextResponse.json({ editais: editais.slice(0, limit), total: editais.length })
}
