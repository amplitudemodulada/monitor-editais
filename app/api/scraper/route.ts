import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml }     from '@/lib/lexml'
import { scrapeTodasFontes }     from '@/lib/scrapers'
import { supabase }              from '@/lib/supabase'
import { processarAlertas }      from '@/lib/alertas'
import type { Edital }           from '@/lib/supabase'

async function executarColeta() {
  let totalInseridos = 0
  let totalDuplic    = 0
  let totalErros     = 0
  const editaisNovos: Edital[] = []
  const relatorio: any[]       = []

  async function salvar(lista: Edital[], fonte: string) {
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

  // DOU via LexML
  const lexmlEditais: Edital[] = []
  for (let p = 1; p <= 3; p++) {
    const pag = await buscarEditalLexml(p).catch(() => [])
    lexmlEditais.push(...pag)
  }
  await salvar(lexmlEditais, 'DOU / LexML')

  // Estratégia, Gran, Direção
  const resultados = await scrapeTodasFontes()
  for (const r of resultados) {
    if (r.erro) { relatorio.push({ fonte: r.fonte, erro: r.erro }); continue }
    await salvar(r.editais, r.fonte)
  }

  const alertasEnviados = await processarAlertas(editaisNovos).catch(() => 0)

  try {
    await supabase.from('scraper_log').insert({
      inseridos: totalInseridos, duplicados: totalDuplic, erros: totalErros,
      status: 'ok', fonte: 'multi',
    })
  } catch { /* ignora erro de log */ }

  return { totalInseridos, totalDuplic, totalErros, alertasEnviados, relatorio }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  try {
    const inicio = Date.now()
    const result = await executarColeta()
    return NextResponse.json({ ok: true, ...result, duracaoMs: Date.now() - inicio, executadoEm: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
