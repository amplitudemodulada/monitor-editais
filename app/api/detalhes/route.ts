import { NextRequest, NextResponse } from 'next/server'
import { buscarCronograma } from '@/lib/cronograma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url    = searchParams.get('url')
  const banca  = searchParams.get('banca')
  const titulo = searchParams.get('titulo')

  if (!url) {
    return NextResponse.json({ erro: 'Parâmetro url é obrigatório' }, { status: 400 })
  }

  const urlComTitulo = titulo ? `${url}&titulo=${encodeURIComponent(titulo)}` : url
  const result = await buscarCronograma(urlComTitulo, banca || '')
  return NextResponse.json(result)
}
