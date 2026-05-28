import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml }        from '@/lib/lexml'
import { scrapeTodasFontes }        from '@/lib/scrapers'
import { supabase }                 from '@/lib/supabase'
import { processarAlertas }         from '@/lib/alertas'
import { atualizarStatusEditais }   from '@/lib/atualizar-status'
import type { Edital }              from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? ''
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const inicio       = Date.now()
  let totalInseridos = 0
  let totalDuplic    = 0
  let totalErros     = 0
  const editaisNovos: Edital[] = []
  const relatorio: any[]       = []

  async function salvarEditais(lista: Edital[], fonte: string) {
    let ins = 0, dup = 0, err = 0
    for (const edital of lista) {
      const { data, error } = await supabase
        .from('editais')
        .upsert(edital, { onConflict: 'url', ignoreDuplicates: true })
        .select('id')
      if (error)        { err++; continue }
      if (data?.length) { ins++; editaisNovos.push({ ...edital, id: data[0].id }) }
      else              { dup++ }
    }
    totalInseridos += ins; totalDuplic += dup; totalErros += err
    relatorio.push({ fonte, coletados: lista.length, inseridos: ins, duplicados: dup, erros: err })
  }

  try {
    // 1 — DOU via LexML (3 páginas)
    const lexmlEditais: Edital[] = []
    for (let p = 1; p <= 3; p++) {
      const pag = await buscarEditalLexml(p).catch(() => [])
      lexmlEditais.push(...pag)
    }
    await salvarEditais(lexmlEditais, 'DOU / LexML')

    // 2 — Sites de cursos (Estratégia, Gran, Direção)
    const resultados = await scrapeTodasFontes()
    for (const r of resultados) {
      if (r.erro) { relatorio.push({ fonte: r.fonte, erro: r.erro }); continue }
      await salvarEditais(r.editais, r.fonte)
    }

    // 3 — Atualiza status dos editais com banca
    const { atualizados: statusAtualizados } = await atualizarStatusEditais(20).catch(() => ({ atualizados: 0 }))

    // 4 — Alertas por e-mail
    const alertasEnviados = await processarAlertas(editaisNovos)

    // 4 — Log
    await supabase.from('scraper_log').insert({
      inseridos: totalInseridos,
      duplicados: totalDuplic,
      erros: totalErros,
      status: 'ok',
      fonte: 'multi',
    })

    return NextResponse.json({
      ok: true,
      totalInseridos,
      totalDuplic,
      totalErros,
      alertasEnviados,
      duracaoMs: Date.now() - inicio,
      relatorio,
      executadoEm: new Date().toISOString(),
    })
  } catch (err: any) {
    await supabase.from('scraper_log').insert({ inseridos: totalInseridos, duplicados: totalDuplic, erros: totalErros + 1, status: 'erro', fonte: 'multi' })
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
