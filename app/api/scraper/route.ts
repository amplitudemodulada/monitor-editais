import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml }  from '@/lib/lexml'
import { scrapeTodasFontes } from '@/lib/scrapers'
import { supabase }          from '@/lib/supabase'
import { processarAlertas }  from '@/lib/alertas'
import { atualizarStatusEditais } from '@/lib/atualizar-status'
import type { Edital }       from '@/lib/supabase'

export const maxDuration = 60 // Vercel Pro; no Hobby limita em 10s

async function salvarLote(lista: Edital[]) {
  let inseridos = 0, duplicados = 0, erros = 0
  const novos: Edital[] = []
  let colunaBancaFaltando = false

  for (const edital of lista) {
    const { data, error } = await supabase
      .from('editais')
      .upsert(edital, { onConflict: 'url', ignoreDuplicates: true })
      .select('id')
    if (error) {
      // Se for erro de coluna banca não existir, tenta sem o campo
      if (!colunaBancaFaltando && (error.message?.includes('banca') || error.code === '42703')) {
        colunaBancaFaltando = true
        const { banca: _, ...semBanca } = edital
        const { data: d2, error: e2 } = await supabase
          .from('editais')
          .upsert(semBanca as any, { onConflict: 'url', ignoreDuplicates: true })
          .select('id')
        if (e2) { erros++; continue }
        if (d2?.length) { inseridos++; novos.push({ ...edital, id: d2[0].id }) }
        else { duplicados++ }
      } else {
        erros++; continue
      }
      continue
    }
    if (data?.length) { inseridos++; novos.push({ ...edital, id: data[0].id }) }
    else              { duplicados++ }
  }
  return { inseridos, duplicados, erros, novos }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    // Tudo em paralelo — LexML (3 páginas simultâneas) + 3 sites ao mesmo tempo
    const [lexmlResults, sitesResults] = await Promise.all([
      Promise.allSettled([
        buscarEditalLexml(1),
        buscarEditalLexml(2),
        buscarEditalLexml(3),
      ]),
      scrapeTodasFontes(),
    ])

    const lexmlEditais: Edital[] = lexmlResults.flatMap(r =>
      r.status === 'fulfilled' ? r.value : []
    )

    // Salva tudo em paralelo por fonte
    const [lexmlSalvo, ...sitesSalvos] = await Promise.all([
      salvarLote(lexmlEditais),
      ...sitesResults.map(r => salvarLote(r.editais)),
    ])

    const relatorio = [
      { fonte: 'DOU / LexML', coletados: lexmlEditais.length, inseridos: lexmlSalvo.inseridos, duplicados: lexmlSalvo.duplicados, erros: lexmlSalvo.erros },
      ...sitesResults.map((r, i) => ({
        fonte: r.fonte,
        coletados: r.editais.length,
        inseridos: sitesSalvos[i].inseridos,
        duplicados: sitesSalvos[i].duplicados,
        erros: sitesSalvos[i].erros,
        ...(r.erro ? { erro: r.erro } : {}),
      })),
    ]

    const totalInseridos  = relatorio.reduce((s, r) => s + (r.inseridos  ?? 0), 0)
    const totalDuplic     = relatorio.reduce((s, r) => s + (r.duplicados ?? 0), 0)
    const totalErros      = relatorio.reduce((s, r) => s + (r.erros      ?? 0), 0)
    const editaisNovos    = [lexmlSalvo, ...sitesSalvos].flatMap(r => r.novos)
    const alertasEnviados = await processarAlertas(editaisNovos).catch(() => 0)

    // Atualiza status dos editais analisando as páginas das bancas
    const { atualizados: statusAtualizados } = await atualizarStatusEditais(20).catch(() => ({ atualizados: 0 }))

    try {
      await supabase.from('scraper_log').insert({
        inseridos: totalInseridos, duplicados: totalDuplic,
        erros: totalErros, status: 'ok', fonte: 'multi',
      })
    } catch { /* silencia erro de log */ }

    return NextResponse.json({
      ok: true,
      totalInseridos,
      totalDuplic,
      totalErros,
      alertasEnviados,
      statusAtualizados,
      relatorio,
      duracaoMs:   Date.now() - inicio,
      executadoEm: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
