"use client"

import { useState } from "react"
import { BookOpen, ChevronRight, Calendar, TrendingUp, BarChart3, type LucideIcon } from "lucide-react"
import type { EditalAtivo } from "../data"

const statusConfig: Record<
  EditalAtivo["status"],
  { label: string; bg: string; dot: string }
> = {
  aberto: { label: "Edital Aberto", bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  inscricoes: { label: "Inscrições Abertas", bg: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  "pos-prova": { label: "Pós-Prova", bg: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
}

function ProgressBar({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" }
  const color =
    value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-indigo-500" : value >= 25 ? "bg-amber-500" : "bg-slate-400"

  return (
    <div className={`${heights[size]} w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden`}>
      <div className={`${heights[size]} ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  )
}

function MiniChart({ disciplinas }: { disciplinas: EditalAtivo["disciplinas"] }) {
  const maxPeso = Math.max(...disciplinas.map((d) => d.peso), 1)
  const top3 = disciplinas.sort((a, b) => b.peso - a.peso).slice(0, 5)

  return (
    <div className="space-y-1.5">
      {top3.map((d) => (
        <div key={d.nome} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 w-24 truncate flex-shrink-0" title={d.nome}>
            {d.nome}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
              style={{ width: `${(d.peso / maxPeso) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-6 text-right">{d.peso}%</span>
        </div>
      ))}
    </div>
  )
}

interface EditaisAtivosProps {
  editais: EditalAtivo[]
}

export default function EditaisAtivos({ editais }: EditaisAtivosProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {editais.map((edital) => {
        const status = statusConfig[edital.status]
        const isOpen = expanded === edital.id

        return (
          <div
            key={edital.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden transition-shadow hover:shadow-sm"
          >
            {/* Card header */}
            <button
              onClick={() => setExpanded(isOpen ? null : edital.id)}
              className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{edital.titulo}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-1 align-middle`} />
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {edital.orgao} · {edital.cargo} · {edital.vagas} vagas
                </p>

                {/* Progress row */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1">
                    <ProgressBar value={edital.progressoEstudo} size="sm" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {edital.progressoEstudo}%
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                </div>
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800/50">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {/* Info column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Prova:{" "}
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {new Date(edital.dataProva).toLocaleDateString("pt-BR")}
                        </span>
                      </span>
                    </div>
                    {edital.status === "inscricoes" && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                          Inscrições até{" "}
                          {new Date(edital.inscricaoAte).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Raio-X de Relevância */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Raio-X de Relevância
                      </span>
                    </div>
                    <MiniChart disciplinas={edital.disciplinas} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
