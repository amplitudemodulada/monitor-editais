import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml }        from '@/lib/lexml'
import { scrapeTodasFontes }        from '@/lib/scrapers'
import { salvarEditaisLote, salvarScraperLog } from '@/lib/storage'
import { processarAlertas }         from '@/lib/alertas'
import { atualizarStatusEditais }   from '@/lib/atualizar-status'
import type { Edital } from '@/lib/storage'

const TEMPO_LIMITE_MS = 8000

async function salvarEditais(lista: Edital[], fonte: string) {
  const r = salvarEditaisLote(lista, fonte)
  return { fonte, coletados: lista.length, inseridos: r.inseridos, duplicados: r.duplicados, erros: r.erros }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? ''
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()
  const relatorio: any[] = []
  const todosNovos: Edital[] = []
  let statusFinal: 'ok' | 'parcial' | 'erro' = 'ok'

  async function dentroDoLimite(): Promise<boolean> {
    return Date.now() - inicio < TEMPO_LIMITE_MS
  }

  try {
    const lexmlEditais: Edital[] = []
    for (let p = 1; p <= 3; p++) {
      if (!(await dentroDoLimite())) { statusFinal = 'parcial'; break }
      const pag = await buscarEditalLexml(p).catch(() => [] as Edital[])
      lexmlEditais.push(...pag)
    }
    if (lexmlEditais.length > 0) {
      const r = await salvarEditais(lexmlEditais, 'DOU / LexML')
      todosNovos.push(...lexmlEditais)
      relatorio.push(r)
    }

    if (await dentroDoLimite()) {
      const resultados = await scrapeTodasFontes()
      for (const r of resultados) {
        if (!(await dentroDoLimite())) { statusFinal = 'parcial'; break }
        if (r.erro) { relatorio.push({ fonte: r.fonte, erro: r.erro }); continue }
        const salvo = await salvarEditais(r.editais, r.fonte)
        todosNovos.push(...r.editais)
        relatorio.push(salvo)
      }
    } else {
      statusFinal = 'parcial'
    }

    let statusAtualizados = 0
    if (await dentroDoLimite()) {
      const r = await atualizarStatusEditais(20).catch(() => ({ atualizados: 0 }))
      statusAtualizados = r.atualizados
    }

    let alertasEnviados = 0
    if (await dentroDoLimite() && todosNovos.length > 0) {
      alertasEnviados = await processarAlertas(todosNovos).catch(() => 0)
    }

    const totalInseridos = relatorio.reduce((s, r) => s + (r.inseridos ?? 0), 0)
    const totalDuplic    = relatorio.reduce((s, r) => s + (r.duplicados ?? 0), 0)
    const totalErros     = relatorio.reduce((s, r) => s + (r.erros ?? 0), 0)

    salvarScraperLog({
      inseridos: totalInseridos, duplicados: totalDuplic,
      erros: totalErros, status: statusFinal, fonte: 'multi',
    })

    return NextResponse.json({
      ok: true,
      status: statusFinal,
      totalInseridos, totalDuplic, totalErros,
      alertasEnviados, statusAtualizados,
      relatorio,
      duracaoMs: Date.now() - inicio,
      executadoEm: new Date().toISOString(),
    })
  } catch (err: any) {
    salvarScraperLog({
      inseridos: relatorio.reduce((s, r) => s + (r.inseridos ?? 0), 0),
      duplicados: relatorio.reduce((s, r) => s + (r.duplicados ?? 0), 0),
      erros: relatorio.reduce((s, r) => s + (r.erros ?? 0), 0) + 1,
      status: 'erro', fonte: 'multi',
    })
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
