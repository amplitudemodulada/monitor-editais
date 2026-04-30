import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml } from '@/lib/lexml'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  try {
    const editais = await buscarEditalLexml(1)

    let inseridos = 0
    let duplicados = 0

    for (const edital of editais) {
      const { error } = await supabase
        .from('editais')
        .upsert(edital, { onConflict: 'url', ignoreDuplicates: true })

      if (error) {
        console.error('Erro ao inserir edital:', error.message)
      } else {
        inseridos++
      }
    }

    duplicados = editais.length - inseridos

    return NextResponse.json({
      ok: true,
      total: editais.length,
      inseridos,
      duplicados,
      executadoEm: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Erro scraper:', err.message)
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
