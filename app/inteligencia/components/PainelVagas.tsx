"use client"

import { Users, CheckCircle, Clock, AlertTriangle, Award, ChevronRight } from "lucide-react"
import type { ConcursoHomologado } from "../data"

interface PainelVagasProps {
  concurso: ConcursoHomologado
}

function TermometroVagas({ ocupadas, totais }: { ocupadas: number; totais: number }) {
  const pct = Math.min((ocupadas / totais) * 100, 100)
  const restantes = totais - ocupadas

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400 font-medium">Vagas ocupadas</span>
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {ocupadas} / {totais}
        </span>
      </div>

      {/* Barra termômetro */}
      <div className="relative h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        {/* Marker de ocupação */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white dark:bg-slate-300"
          style={{ left: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${restantes > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {restantes > 0 ? `${restantes} vagas restantes` : "Todas preenchidas"}
        </span>
        <span className="text-slate-400">{Math.round(pct)}% ocupadas</span>
      </div>
    </div>
  )
}

export default function PainelVagas({ concurso }: PainelVagasProps) {
  return (
    <div className="space-y-4">
      {/* Card principal do concurso homologado */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{concurso.titulo}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{concurso.orgao}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              <CheckCircle className="w-3 h-3" />
              Homologado em {new Date(concurso.dataHomologacao).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        {/* Termômetro de convocações */}
        <TermometroVagas ocupadas={concurso.vagasOcupadas} totais={concurso.vagasTotais} />

        {/* Última convocação */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Última: <strong className="text-slate-700 dark:text-slate-200">{concurso.ultimaConvocacao}</strong>
          </span>
        </div>
      </div>

      {/* Feed de movimentações DOU */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Movimentações DOU</h4>
          <span className="text-[10px] text-slate-400 ml-auto">Atualizado há 2h</span>
        </div>

        <div className="space-y-0">
          {concurso.movimentacoes.map((mov, i) => (
            <div
              key={i}
              className={`flex gap-3 py-2.5 text-xs ${
                i === 0
                  ? "bg-indigo-50 dark:bg-indigo-950/30 -mx-4 px-4 rounded-md"
                  : "border-t border-slate-100 dark:border-slate-800/50"
              }`}
            >
              <span
                className={`font-medium whitespace-nowrap flex-shrink-0 ${
                  i === 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                }`}
              >
                {mov.data}
              </span>
              <span className={`${i === 0 ? "text-indigo-700 dark:text-indigo-300 font-medium" : "text-slate-600 dark:text-slate-300"}`}>
                {mov.texto}
              </span>
            </div>
          ))}
        </div>

        <button className="flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Ver todas as movimentações
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
