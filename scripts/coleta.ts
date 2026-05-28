import { scrapeTodasFontes } from '../lib/scrapers'
import { buscarEditalLexml } from '../lib/lexml'
import { atualizarStatusEditais } from '../lib/atualizar-status'
import { processarAlertas } from '../lib/alertas'
import { getSupabase } from '../lib/supabase'

const supabase = getSupabase()

async function salvarLote(lista: any[], fonte: string) {
  if (!lista.length) return { fonte, coletados: 0, inseridos: 0, duplicados: 0, erros: 0 }

  try {
    const { data, error } = await supabase
      .from('editais')
      .upsert(lista, { onConflict: 'url', ignoreDuplicates: true })
      .select('id')

    if (error) {
      if (error.message?.includes('banca') || (error as any).code === '42703') {
        const semBanca = lista.map(({ banca: _, ...rest }) => rest)
        const { data: d2, error: e2 } = await supabase
          .from('editais')
          .upsert(semBanca, { onConflict: 'url', ignoreDuplicates: true })
          .select('id')
        if (e2) return { fonte, coletados: lista.length, inseridos: 0, duplicados: 0, erros: lista.length }
        const inseridos = d2?.length ?? 0
        return { fonte, coletados: lista.length, inseridos, duplicados: lista.length - inseridos, erros: 0 }
      }
      return { fonte, coletados: lista.length, inseridos: 0, duplicados: 0, erros: lista.length }
    }

    const inseridos = data?.length ?? 0
    return { fonte, coletados: lista.length, inseridos, duplicados: lista.length - inseridos, erros: 0 }
  } catch (e: any) {
    if (process.env.LOG_ERRORS) console.log(`ERRO salvarLote (${fonte}):`, e.message)
    return { fonte, coletados: lista.length, inseridos: 0, duplicados: 0, erros: lista.length }
  }
}

async function main() {
  const inicio = Date.now()
  const relatorio: any[] = []
  const todosNovos: any[] = []

  // Teste de conexão Supabase
  try {
    const { error: testErr } = await supabase.from('editais').select('id').limit(1)
    if (testErr) console.log('ERRO Supabase:', testErr.message)
    else console.log('Supabase OK')
  } catch (e: any) {
    console.log('ERRO Supabase conexao:', e.message)
  }

  for (let p = 1; p <= 3; p++) {
    try {
      const pag = await buscarEditalLexml(p)
      if (pag.length) {
        todosNovos.push(...pag)
        relatorio.push(await salvarLote(pag, 'DOU / LexML'))
      }
    } catch { /* skip */ }
  }

  try {
    const resultados = await scrapeTodasFontes()
    for (const r of resultados) {
      if (r.erro) { relatorio.push({ fonte: r.fonte, erro: r.erro }); continue }
      if (r.editais.length) {
        todosNovos.push(...r.editais)
        try {
          relatorio.push(await salvarLote(r.editais, r.fonte))
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }

  try {
    const { atualizados } = await atualizarStatusEditais(20)
    try {
      const alertas = await processarAlertas(todosNovos)
      console.log('Alertas enviados:', alertas)
    } catch (e: any) {
      console.log('Erro alertas (ignorado):', e.message)
    }
    console.log('Status atualizados:', atualizados)
  } catch { /* skip */ }

  const totalIns = relatorio.reduce((s, r) => s + (r.inseridos ?? 0), 0)
  const totalDup = relatorio.reduce((s, r) => s + (r.duplicados ?? 0), 0)
  const totalErr = relatorio.reduce((s, r) => s + (r.erros ?? 0), 0)

  try {
    await supabase.from('scraper_log').insert({
      inseridos: totalIns, duplicados: totalDup, erros: totalErr,
      status: 'ok', fonte: 'multi',
    })
  } catch (e: any) {
    console.log('Erro ao salvar log:', e.message)
  }

  const duracao = Date.now() - inicio
  console.log('Duração total:', duracao, 'ms')
  console.log('Relatório final:', JSON.stringify({ totalInseridos: totalIns, totalDuplic: totalDup, totalErros: totalErr }))
}

main().catch((err: any) => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})
