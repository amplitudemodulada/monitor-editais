import { scrapeEstrategia } from './estrategia'
import { scrapeGran }       from './gran'
import { scrapeDirecao }    from './direcao'
import type { Edital }      from '../supabase'

export interface ResultadoScraping {
  fonte: string
  editais: Edital[]
  erro?: string
  duracaoMs: number
}

export async function scrapeTodasFontes(): Promise<ResultadoScraping[]> {
  const fontes = [
    { nome: 'Estratégia Concursos', fn: scrapeEstrategia },
    { nome: 'Gran Cursos Online',   fn: scrapeGran       },
    { nome: 'Direção Concursos',    fn: scrapeDirecao    },
  ]

  const resultados = await Promise.allSettled(
    fontes.map(async f => {
      const inicio = Date.now()
      const editais = await f.fn()
      return { fonte: f.nome, editais, duracaoMs: Date.now() - inicio } as ResultadoScraping
    })
  )

  return resultados.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { fonte: fontes[i].nome, editais: [], erro: (r.reason as Error).message, duracaoMs: 0 }
  )
}
