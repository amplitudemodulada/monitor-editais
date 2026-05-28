import { carregarEditais, atualizarEdital } from './storage'
import { buscarCronograma } from './cronograma'

export async function atualizarStatusEditais(limite = 30): Promise<{ atualizados: number }> {
  const editais = carregarEditais()
    .filter(e => e.banca && e.banca !== '' && e.id)
    .slice(0, limite)

  if (!editais.length) return { atualizados: 0 }

  let atualizados = 0

  for (const edital of editais) {
    if (!edital.url || !edital.banca || !edital.id) continue
    try {
      const resultado = await buscarCronograma(edital.url, edital.banca)
      if (resultado.status && resultado.status !== 'desconhecido' && resultado.status !== 'erro') {
        const ok = atualizarEdital(edital.id, { status: resultado.status as any })
        if (ok) atualizados++
      }
    } catch {
      // silencia erro individual
    }

    await new Promise(r => setTimeout(r, 300))
  }

  return { atualizados }
}
