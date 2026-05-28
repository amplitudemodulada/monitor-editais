"use client"

import { useState, useEffect } from "react"
import { TrendingUp, FileText, Users, Activity, Building2, Globe, Layers } from "lucide-react"
import EditaisReais from "./components/EditaisReais"
import PainelVagas from "./components/PainelVagas"
import TabelaCandidatos from "./components/TabelaCandidatos"
import { concursoHomologado, candidatos } from "./data"

interface EditalDB {
  id: string
  titulo: string
  orgao: string
  data_publicacao: string
  url: string
  categoria: string
  banca: string
  resumo: string
  nivel: string
  fonte: string
  status: string
}

export default function InicioPage() {
  const [editais, setEditais] = useState<EditalDB[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroBanca, setFiltroBanca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  useEffect(() => {
    setLoading(true)
    fetch("/api/editais?limit=100")
      .then((r) => r.json())
      .then((data) => setEditais(data.editais || []))
      .catch(() => setEditais([]))
      .finally(() => setLoading(false))
  }, [])

  const bancas = [...new Set(editais.map((e) => e.banca).filter(Boolean))].sort()

  const filtrados = editais.filter((e) => {
    if (filtroBanca && e.banca !== filtroBanca) return false
    if (filtroStatus && e.status !== filtroStatus) return false
    return true
  })

  const totalEditais = editais.length
  const comBanca = editais.filter((e) => e.banca).length
  const abertos = editais.filter((e) => e.status === "aberto").length
  const andamento = editais.filter((e) => e.status === "em_andamento").length
  const previstos = editais.filter((e) => e.status === "previsto").length

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Painel de Inteligência</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Monitoramento de editais, bancas organizadoras e concursos públicos
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Editais Coletados", value: totalEditais, icon: FileText, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          { label: "Com Banca Definida", value: comBanca, icon: Building2, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Abertos", value: abertos, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Em Andamento", value: andamento, icon: Activity, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Previstos", value: previstos, icon: Layers, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40" },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transition-shadow hover:shadow-sm">
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
        <Globe className="w-4 h-4 text-slate-400" />
        <select value={filtroBanca} onChange={(e) => setFiltroBanca(e.target.value)}
          className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Todas as Bancas</option>
          {bancas.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Todos os Status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="previsto">Previsto</option>
          <option value="encerrado">Encerrado</option>
        </select>
        {(filtroBanca || filtroStatus) && (
          <button onClick={() => { setFiltroBanca(""); setFiltroStatus("") }}
            className="text-xs text-red-500 hover:text-red-600 font-medium">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Editais por Banca
            </h2>
            <span className="text-xs text-slate-400">{filtrados.length} de {totalEditais}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
              Carregando editais...
            </div>
          ) : (
            <EditaisReais editais={filtrados} />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Vagas e Convocações
          </h2>
          <PainelVagas concurso={concursoHomologado} />
        </div>
      </div>

      {/* Tabela */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" />
          Lista de Aprovados e Cruzamento
        </h2>
        <TabelaCandidatos candidatos={candidatos} />
      </div>
    </div>
  )
}
