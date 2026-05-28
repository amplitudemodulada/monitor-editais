import { enviarAlertaEmail } from './email'
import { carregarAlertasConfig, salvarAlertasEnviados } from './storage'
import type { Edital, AlertaConfig } from './storage'

function editalMatchConfig(edital: Edital, config: AlertaConfig): boolean {
  if (!config.ativo) return false

  const textoEdital = (edital.titulo + ' ' + edital.resumo + ' ' + edital.categoria).toLowerCase()

  const matchArea = config.areas.length === 0
    || config.areas.some(a => textoEdital.includes(a.toLowerCase()) || edital.categoria === a)

  const matchNivel = config.nivel.length === 0
    || config.nivel.includes(edital.nivel)

  const matchExtra = config.palavras_extras.length === 0
    || config.palavras_extras.some(p => textoEdital.includes(p.toLowerCase()))

  return matchArea && matchNivel
}

export async function processarAlertas(editaisNovos: Edital[]): Promise<number> {
  if (!editaisNovos.length) return 0

  const configs = carregarAlertasConfig().filter(c => c.ativo)

  if (!configs.length) return 0

  let enviados = 0

  for (const config of configs) {
    const compatíveis = editaisNovos.filter(e => editalMatchConfig(e, config))
    if (!compatíveis.length) continue

    const ok = await enviarAlertaEmail(config.email, config.nome || 'Usuário', compatíveis)
    if (ok) {
      enviados++
      salvarAlertasEnviados(
        compatíveis.map(e => ({
          edital_id: e.id,
          email:     config.email,
          enviado_em: new Date().toISOString(),
        }))
      )
    }
  }

  return enviados
}
