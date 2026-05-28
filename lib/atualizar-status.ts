import { supabase } from './supabase'
import { buscarCronograma } from './cronograma'

export async function atualizarStatusEditais(limite = 30): Promise<{ atualizados: number }> {
  let { data: editais } = await supabase
    .from('editais')
    .select('id, url, banca, titulo')
    .neq('banca', '')
    .not('banca', 'is', null)
    .limit(limite)

  // Se a coluna banca não existir, sai sem erro
  if (!editais) return { atualizados: 0 }

  if (!editais || editais.length === 0) return { atualizados: 0 }

  let atualizados = 0
  const updates: { id: string; status: string }[] = []

  for (const edital of editais) {
    if (!edital.url || !edital.banca) continue
    try {
      const resultado = await buscarCronograma(edital.url, edital.banca)
      if (resultado.status && resultado.status !== 'desconhecido' && resultado.status !== 'erro') {
        updates.push({ id: edital.id, status: resultado.status })
      }
    } catch {
      // silencia erro individual
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(r => setTimeout(r, 300))
  }

  // Atualiza em lote
  for (const upd of updates) {
    const { error } = await supabase
      .from('editais')
      .update({ status: upd.status })
      .eq('id', upd.id)

    if (!error) atualizados++
  }

  return { atualizados }
}
