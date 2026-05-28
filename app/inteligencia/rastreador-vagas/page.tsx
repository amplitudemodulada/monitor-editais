"use client"

import { Users, Award, CheckCircle, Clock, XCircle, TrendingUp, ChevronRight, Filter, Search, BarChart3 } from "lucide-react"
import { useState, useMemo } from "react"

const dadosConcursos = [
  {
    id: "1",
    titulo: "PPSA — Pré-Sal Petróleo S.A.",
    orgao: "Empresa Brasileira de Administração de Petróleo",
    vagasTotais: 50,
    vagasOcupadas: 15,
    ultimaConvocacao: "3ª Convocação",
    dataHomologacao: "2026-04-10",
    status: "em_andamento",
  },
  {
    id: "2",
    titulo: "Tribunal Regional Federal da 3ª Região",
    orgao: "TRF-3",
    vagasTotais: 30,
    vagasOcupadas: 22,
    ultimaConvocacao: "5ª Convocação",
    dataHomologacao: "2026-02-15",
    status: "em_andamento",
  },
  {
    id: "3",
    titulo: "Banco do Brasil — Escriturário",
    orgao: "Banco do Brasil S.A.",
    vagasTotais: 4000,
    vagasOcupadas: 4000,
    ultimaConvocacao: "Convocação Final",
    dataHomologacao: "2025-12-01",
    status: "finalizado",
  },
  {
    id: "4",
    titulo: "Secretaria da Fazenda do Estado de São Paulo",
    orgao: "SEFAZ-SP",
    vagasTotais: 100,
    vagasOcupadas: 67,
    ultimaConvocacao: "4ª Convocação",
    dataHomologacao: "2026-01-20",
    status: "em_andamento",
  },
]

function Termometro({ ocupadas, totais }: { ocupadas: number; totais: number }) {
  const pct = Math.min((ocupadas / totais) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{ocupadas}/{totais} vagas</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function RastreadorVagasPage() {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  const filtrados = useMemo(() => {
    return dadosConcursos.filter((c) => {
      if (filtroStatus && c.status !== filtroStatus) return false
      if (busca.trim() && !c.titulo.toLowerCase().includes(busca.toLowerCase()) && !c.orgao.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
  }, [busca, filtroStatus])

  const totalVagas = dadosConcursos.reduce((s, c) => s + c.vagasTotais, 0)
  const totalOcupadas = dadosConcursos.reduce((s, c) => s + c.vagasOcupadas, 0)
  const ativos = dadosConcursos.filter((c) => c.status === "em_andamento").length

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Rastreador de Vagas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhamento de convocações e ocupação de vagas pós-homologação
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Concursos Ativos", value: ativos, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          { label: "Total de Vagas", value: totalVagas, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Vagas Ocupadas", value: totalOcupadas, icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Vagas Restantes", value: totalVagas - totalOcupadas, icon: BarChart3, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40" },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{kpi.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar concurso..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Todos</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {/* Cards de concurso */}
      <div className="space-y-3">
        {filtrados.map((concurso) => (
          <div key={concurso.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{concurso.titulo}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{concurso.orgao}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Clock className="w-3 h-3" />
                  Homologado em {new Date(concurso.dataHomologacao).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                concurso.status === "em_andamento"
                  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>
                {concurso.status === "em_andamento" ? "Em Andamento" : "Finalizado"}
              </span>
            </div>

            <Termometro ocupadas={concurso.vagasOcupadas} totais={concurso.vagasTotais} />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Última: {concurso.ultimaConvocacao}
              </span>
              <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                Ver detalhes <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-400">Nenhum concurso encontrado.</div>
        )}
      </div>
    </div>
  )
}
