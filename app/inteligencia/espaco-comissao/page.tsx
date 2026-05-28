"use client"

import { useState } from "react"
import { UserCircle, ClipboardList, CheckSquare, Clock, AlertCircle, Plus, ChevronRight, Calendar, Users, FileText } from "lucide-react"

interface Membro {
  nome: string
  cargo: string
  funcao: string
}

interface Etapa {
  nome: string
  data: string
  status: "concluido" | "andamento" | "pendente"
  responsavel: string
}

interface ConcursoComissao {
  id: string
  titulo: string
  orgao: string
  banca: string
  membros: Membro[]
  etapas: Etapa[]
  observacoes: string
}

const dados: ConcursoComissao[] = [
  {
    id: "1",
    titulo: "Concurso Público para Analista de TI",
    orgao: "Ministério da Gestão e Inovação",
    banca: "FGV",
    membros: [
      { nome: "Dra. Maria Helena Costa", cargo: "Presidente", funcao: "Coordenação geral" },
      { nome: "Dr. Ricardo Oliveira Silva", cargo: "Membro Titular", funcao: "Elaboração de provas" },
      { nome: "Dra. Patrícia Almeida Rocha", cargo: "Membro Titular", funcao: "Avaliação de recursos" },
      { nome: "Dr. Fernando Luiz Santos", cargo: "Suplente", funcao: "Apoio administrativo" },
    ],
    etapas: [
      { nome: "Publicação do Edital", data: "2026-04-15", status: "concluido", responsavel: "Presidência" },
      { nome: "Período de Inscrições", data: "2026-04-20 a 2026-05-20", status: "concluido", responsavel: "Banca FGV" },
      { nome: "Elaboração das Provas", data: "2026-05-01 a 2026-06-15", status: "concluido", responsavel: "Comissão" },
      { nome: "Aplicação das Provas", data: "2026-06-30", status: "andamento", responsavel: "Banca FGV" },
      { nome: "Divulgação do Gabarito", data: "2026-07-05", status: "pendente", responsavel: "Banca FGV" },
      { nome: "Análise de Recursos", data: "2026-07-06 a 2026-07-20", status: "pendente", responsavel: "Comissão" },
      { nome: "Resultado Final", data: "2026-08-10", status: "pendente", responsavel: "Presidência" },
    ],
    observacoes: "Concurso com 150 vagas. Previsão de cadastro reserva de 300 candidatos."
  },
  {
    id: "2",
    titulo: "Concurso para Analista de Infraestrutura",
    orgao: "Tribunal de Contas da União",
    banca: "CEBRASPE",
    membros: [
      { nome: "Dr. André Luiz Pereira", cargo: "Presidente", funcao: "Coordenação geral" },
      { nome: "Dra. Sandra Vieira Campos", cargo: "Membro Titular", funcao: "Logística" },
      { nome: "Dr. Marcos Aurélio Neto", cargo: "Membro Titular", funcao: "Conteúdo técnico" },
    ],
    etapas: [
      { nome: "Publicação do Edital", data: "2026-05-01", status: "concluido", responsavel: "Presidência" },
      { nome: "Período de Inscrições", data: "2026-05-05 a 2026-06-05", status: "andamento", responsavel: "CEBRASPE" },
      { nome: "Elaboração das Provas", data: "2026-06-01 a 2026-07-15", status: "pendente", responsavel: "Comissão" },
      { nome: "Aplicação das Provas", data: "2026-08-01", status: "pendente", responsavel: "CEBRASPE" },
      { nome: "Resultado Final", data: "2026-09-15", status: "pendente", responsavel: "Presidência" },
    ],
    observacoes: "80 vagas. Prova objetiva + discursiva. Pesos diferenciados para área de infraestrutura."
  },
]

const STATUS_ETAPA: Record<string, { bg: string; icon: typeof CheckSquare; label: string }> = {
  concluido: { bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300", icon: CheckSquare, label: "Concluído" },
  andamento: { bg: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300", icon: Clock, label: "Em Andamento" },
  pendente: { bg: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400", icon: AlertCircle, label: "Pendente" },
}

export default function EspacoComissaoPage() {
  const [expandido, setExpandido] = useState<string | null>(null)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Espaço da Comissão</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Organização e acompanhamento de comissões organizadoras de concursos
        </p>
      </div>

      <div className="space-y-4">
        {dados.map((concurso) => {
          const aberto = expandido === concurso.id
          const concluidas = concurso.etapas.filter((e) => e.status === "concluido").length
          const totalEtapas = concurso.etapas.length

          return (
            <div key={concurso.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              {/* Header */}
              <button onClick={() => setExpandido(aberto ? null : concurso.id)}
                className="w-full text-left p-5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{concurso.titulo}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{concurso.orgao} · Banca: {concurso.banca}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${(concluidas / totalEtapas) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {concluidas}/{totalEtapas} etapas
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${aberto ? "rotate-90" : ""}`} />
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {aberto && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800/50 space-y-5">
                  {/* Membros */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5" /> Membros da Comissão
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {concurso.membros.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            {m.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{m.nome}</p>
                            <p className="text-[10px] text-slate-400">{m.cargo} · {m.funcao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Etapas / Cronograma */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                      <ClipboardList className="w-3.5 h-3.5" /> Cronograma de Etapas
                    </h4>
                    <div className="space-y-1">
                      {concurso.etapas.map((etapa, i) => {
                        const se = STATUS_ETAPA[etapa.status]
                        const Icon = se.icon
                        return (
                          <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                            <Icon className={`w-4 h-4 flex-shrink-0 ${
                              etapa.status === "concluido" ? "text-emerald-500" :
                              etapa.status === "andamento" ? "text-blue-500" : "text-slate-300 dark:text-slate-600"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{etapa.nome}</p>
                              <p className="text-[10px] text-slate-400">{etapa.responsavel}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-right">{etapa.data}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${se.bg}`}>{se.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">{concurso.observacoes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
