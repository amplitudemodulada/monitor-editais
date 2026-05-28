import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml } from '@/lib/lexml'
import { salvarEditaisLote } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const ano    = Number(searchParams.get('ano')    || new Date().getFullYear())
  const paginas = Number(searchParams.get('paginas') || 10)

  let totalInseridos = 0, totalDuplic = 0, totalErros = 0

  for (let lote = 0; lote < paginas; lote += 5) {
    const nums = Array.from({ length: Math.min(5, paginas - lote) }, (_, i) => lote + i + 1)
    const results = await Promise.allSettled(nums.map(p => buscarEditalLexml(p, ano)))

    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      const salvo = await salvarEditaisLote(r.value, 'DOU / LexML')
      totalInseridos += salvo.inseridos
      totalDuplic    += salvo.duplicados
      totalErros     += salvo.erros
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
