"use client"

import { useState, useEffect } from "react"
import { FileText, Star, ExternalLink, Calendar, Building2, Search, BookmarkPlus, BookmarkCheck } from "lucide-react"

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

const STATUS_STYLE: Record<string, string> = {
  aberto: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  em_andamento: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  previsto: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  encerrado: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
}

export default function MeusEditaisPage() {
  const [editais, setEditais] = useState<EditalDB[]>([])
  const [loading, setLoading] = useState(true)
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")

  useEffect(() => {
    fetch("/api/editais?limit=100")
      .then((r) => r.json())
      .then((data) => setEditais(data.editais || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleFav = (id: string) => {
    setFavoritos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtrados = editais.filter((e) => {
    if (filtroStatus && e.status !== filtroStatus) return false
    if (busca.trim()) {
      const q = busca.toLowerCase()
      if (!e.titulo.toLowerCase().includes(q) && !e.orgao?.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Meus Editais</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {favoritos.size} editais salvos · {editais.length} disponíveis
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nos editais..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Todos os Status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="previsto">Previsto</option>
          <option value="encerrado">Encerrado</option>
        </select>
        <button onClick={() => setFiltroStatus("")} className="text-xs text-red-500 font-medium">Limpar</button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mr-2" />
          Carregando...
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((edital) => {
            const st = STATUS_STYLE[edital.status] || STATUS_STYLE.encerrado
            const isFav = favoritos.has(edital.id)
            return (
              <div key={edital.id}
                className={`rounded-xl border bg-white dark:bg-slate-950 p-4 transition-all hover:shadow-sm ${
                  isFav ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-slate-800"
                }`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleFav(edital.id)}
                    className={`mt-1 p-1 rounded transition-colors ${isFav ? "text-indigo-500" : "text-slate-300 dark:text-slate-600 hover:text-amber-400"}`}>
                    {isFav ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <a href={edital.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {edital.titulo}
                      </a>
                      <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st}`}>
                        {edital.status === "em_andamento" ? "Em Andamento" : edital.status.charAt(0).toUpperCase() + edital.status.slice(1)}
                      </span>
                      {edital.banca && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {edital.banca}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{edital.categoria}</span>
                      <span className="text-[10px] text-slate-400">{edital.fonte}</span>
                    </div>
                    {edital.orgao && edital.orgao !== "Não identificado" && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">🏛️ {edital.orgao}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(edital.data_publicacao).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="text-center py-16 text-sm text-slate-400">
              Nenhum edital encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
