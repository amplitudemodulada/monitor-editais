import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml } from '@/lib/lexml'
import { supabase }          from '@/lib/supabase'

// Importa o histórico completo de um ano do DOU via LexML
// Chamada única: GET /api/historico?ano=2026&paginas=20
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const ano    = Number(searchParams.get('ano')    || new Date().getFullYear())
  const paginas = Number(searchParams.get('paginas') || 10)

  let totalInseridos = 0, totalDuplic = 0, totalErros = 0

  // Busca todas as páginas em paralelo (lotes de 5)
  for (let lote = 0; lote < paginas; lote += 5) {
    const nums = Array.from({ length: Math.min(5, paginas - lote) }, (_, i) => lote + i + 1)

    const results = await Promise.allSettled(nums.map(p => buscarEditalLexml(p, ano)))

    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      for (const edital of r.value) {
        const { data, error } = await supabase
          .from('editais')
          .upsert(edital, { onConflict: 'url', ignoreDuplicates: true })
          .select('id')
        if (error)        totalErros++
        else if (data?.length) totalInseridos++
        else              totalDuplic++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    ano,
    paginas,
    totalInseridos,
    totalDuplic,
    totalErros,
    executadoEm: new Date().toISOString(),
  })
}
