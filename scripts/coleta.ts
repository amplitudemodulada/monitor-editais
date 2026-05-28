import { scrapeTodasFontes } from '../lib/scrapers'
import { buscarEditalLexml } from '../lib/lexml'
import { atualizarStatusEditais } from '../lib/atualizar-status'
import { processarAlertas } from '../lib/alertas'
import { salvarEditaisLote, salvarScraperLog } from '../lib/storage'

async function main() {
  const inicio = Date.now()
  const relatorio: any[] = []
  const todosNovos: any[] = []

  console.log('Storage: JSON (public/data/)')

  for (let p = 1; p <= 3; p++) {
    try {
      const pag = await buscarEditalLexml(p)
      if (pag.length) {
        todosNovos.push(...pag)
        relatorio.push(salvarEditaisLote(pag, 'DOU / LexML'))
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
          relatorio.push(salvarEditaisLote(r.editais, r.fonte))
        } catch (e: any) {
          relatorio.push({ fonte: r.fonte, erro: e.message })
        }
      }
    }
  } catch (e: any) {
    console.log('ERRO scrapeTodasFontes:', e.message)
  }

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

  salvarScraperLog({
    inseridos: totalIns, duplicados: totalDup, erros: totalErr,
    status: 'ok', fonte: 'multi',
  })

  const duracao = Date.now() - inicio
  console.log('Duração total:', duracao, 'ms')
  console.log('Relatório final:', JSON.stringify({ totalInseridos: totalIns, totalDuplic: totalDup, totalErros: totalErr }))
}

main().catch((err: any) => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})
