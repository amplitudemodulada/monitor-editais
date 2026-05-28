import { scrapeEstrategia }   from './estrategia'
import { scrapeGran }         from './gran'
import { scrapeDirecao }      from './direcao'
import { scrapeFGV }          from './fgv'
import { scrapeFCC }          from './fcc'
import { scrapeCebraspe }     from './cebraspe'
import { scrapeVunesp }       from './vunesp'
import { scrapeIdcap }        from './idcap'
import { scrapeIdecan }       from './idecan'
import { scrapeIbam }         from './ibam'
import { scrapeTecConcursos } from './tecconcursos'
import type { Edital }        from '../supabase'

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
    { nome: 'Tec Concursos',        fn: scrapeTecConcursos },
    { nome: 'FGV Concursos',        fn: scrapeFGV        },
    { nome: 'FCC',                  fn: scrapeFCC        },
    { nome: 'CEBRASPE',             fn: scrapeCebraspe   },
    { nome: 'VUNESP',               fn: scrapeVunesp     },
    { nome: 'IDCAP',                fn: scrapeIdcap      },
    { nome: 'IDECAN',               fn: scrapeIdecan     },
    { nome: 'IBAM Concursos',       fn: scrapeIbam       },
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
