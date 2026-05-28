"use client"

import { useState, useMemo } from "react"
import { Filter, Users, Search, CheckCircle, Clock, XCircle } from "lucide-react"
import type { Candidato } from "../data"

type FiltroLista = "todas" | "AC" | "PPP" | "PCD"

const statusBadge: Record<Candidato["status"], { label: string; bg: string; icon: typeof CheckCircle }> = {
  convocado: { label: "Convocado", bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300", icon: CheckCircle },
  aguardando: { label: "Aguardando", bg: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300", icon: Clock },
  finalizado: { label: "Finalizado", bg: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400", icon: XCircle },
}

const listaLabel: Record<FiltroLista, string> = {
  todas: "Lista Geral Unificada",
  AC: "Ampla Concorrência",
  PPP: "PPP",
  PCD: "PCD",
}

interface TabelaCandidatosProps {
  candidatos: Candidato[]
}

export default function TabelaCandidatos({ candidatos }: TabelaCandidatosProps) {
  const [filtro, setFiltro] = useState<FiltroLista>("todas")
  const [search, setSearch] = useState("")
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    let lista = filtro === "todas" ? candidatos : candidatos.filter((c) => c.lista === filtro)
    if (search.trim()) {
      const q = search.toLowerCase()
      lista = lista.filter((c) => c.nome.toLowerCase().includes(q))
    }
    return lista
  }, [candidatos, filtro, search])

  const contagens = useMemo(() => {
    return {
      AC: candidatos.filter((c) => c.lista === "AC").length,
      PPP: candidatos.filter((c) => c.lista === "PPP").length,
      PCD: candidatos.filter((c) => c.lista === "PCD").length,
      convocados: candidatos.filter((c) => c.status === "convocado").length,
    }
  }, [candidatos])

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lista de Aprovados</h3>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {candidatos.length} candidatos
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{contagens.convocados} convocados</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">AC: {contagens.AC}</span>
            <span className="text-slate-500 dark:text-slate-400">PPP: {contagens.PPP}</span>
            <span className="text-slate-500 dark:text-slate-400">PCD: {contagens.PCD}</span>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["todas", "AC", "PPP", "PCD"] as FiltroLista[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                filtro === f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              {listaLabel[f]}
            </button>
          ))}

          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar candidato..."
              className="w-44 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 w-16">#</th>
              <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Nome</th>
              <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 w-20">Nota</th>
              <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 w-28">Lista</th>
              <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 w-28">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhum candidato encontrado
                </td>
              </tr>
            ) : (
              filtrados.map((c) => {
                const sb = statusBadge[c.status]
                const StatusIcon = sb.icon
                const isAC = c.lista === "AC"
                return (
                  <tr
                    key={c.posicao}
                    onMouseEnter={() => setHighlighted(c.posicao.toString())}
                    onMouseLeave={() => setHighlighted(null)}
                    className={`transition-colors ${
                      highlighted === c.posicao.toString()
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                        : c.posicao % 2 === 0
                          ? "bg-white dark:bg-slate-950"
                          : "bg-slate-50/50 dark:bg-slate-900/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-400">
                      {c.posicao}º
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {c.nome}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {c.nota.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isAC
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {c.lista === "AC" ? "Ampla Concorrência" : c.lista}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sb.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sb.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé da tabela */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          * Candidatos de ações afirmativas (PPP e PCD) aparecem na lista geral unificada e nos filtros específicos para garantir visibilidade no fluxo de convocações.
        </p>
      </div>
    </div>
  )
}
