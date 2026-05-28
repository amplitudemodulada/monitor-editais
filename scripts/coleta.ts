import { scrapeTodasFontes } from '../lib/scrapers'
import { buscarEditalLexml } from '../lib/lexml'
import { atualizarStatusEditais } from '../lib/atualizar-status'
import { processarAlertas } from '../lib/alertas'
import { supabase } from '../lib/supabase'

async function salvarLote(lista: any[], fonte: string) {
  let ins = 0, dup = 0, err = 0
  for (const edital of lista) {
    const { data, error } = await supabase
      .from('editais')
      .upsert(edital, { onConflict: 'url', ignoreDuplicates: true })
      .select('id')
    if (error) { err++; continue }
    if (data?.length) ins++
    else dup++
  }
  return { fonte, coletados: lista.length, inseridos: ins, duplicados: dup, erros: err }
}

async function main() {
  const inicio = Date.now()
  const relatorio: any[] = []
  const todosNovos: any[] = []

  for (let p = 1; p <= 3; p++) {
    const pag = await buscarEditalLexml(p).catch(() => [])
    if (pag.length) {
      todosNovos.push(...pag)
      relatorio.push(await salvarLote(pag, 'DOU / LexML'))
    }
  }

  const resultados = await scrapeTodasFontes()
  for (const r of resultados) {
    if (r.erro) { relatorio.push({ fonte: r.fonte, erro: r.erro }); continue }
    if (r.editais.length) {
      todosNovos.push(...r.editais)
      relatorio.push(await salvarLote(r.editais, r.fonte))
    }
  }

  const { atualizados } = await atualizarStatusEditais(20).catch(() => ({ atualizados: 0 }))
  const alertas = await processarAlertas(todosNovos).catch(() => 0)

  const totalIns = relatorio.reduce((s, r) => s + (r.inseridos ?? 0), 0)
  const totalDup = relatorio.reduce((s, r) => s + (r.duplicados ?? 0), 0)
  const totalErr = relatorio.reduce((s, r) => s + (r.erros ?? 0), 0)

  await supabase.from('scraper_log').insert({
    inseridos: totalIns, duplicados: totalDup, erros: totalErr,
    status: 'ok', fonte: 'multi',
  }).catch(() => {})

  console.log(JSON.stringify({
    ok: true, totalInseridos: totalIns, totalDuplic: totalDup, totalErros: totalErr,
    alertasEnviados: alertas, statusAtualizados: atualizados,
    duracaoMs: Date.now() - inicio, relatorio,
  }, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, erro: err.message }))
  process.exit(1)
})
