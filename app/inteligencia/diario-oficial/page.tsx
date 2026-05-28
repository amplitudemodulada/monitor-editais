"use client"

import { useState } from "react"
import { Newspaper, ExternalLink, Calendar, Search, Filter, ChevronRight, BookmarkPlus, BookmarkCheck } from "lucide-react"

const publicacoes = [
  { data: "2026-05-27", orgao: "Ministério da Gestão e Inovação", titulo: "Edital nº 45/2026 — Concurso para Analista de TI", secao: "Seção 3", tipo: "Edital" },
  { data: "2026-05-27", orgao: "Tribunal de Contas da União", titulo: "Resultado Final — Concurso para Auditor", secao: "Seção 1", tipo: "Resultado" },
  { data: "2026-05-26", orgao: "Prefeitura de São Paulo", titulo: "Abertura de Inscrições — Concurso Desenvolvedor", secao: "Seção 2", tipo: "Edital" },
  { data: "2026-05-26", orgao: "Banco Central do Brasil", titulo: "Convocação para Perícia Médica — Analista", secao: "Seção 3", tipo: "Convocação" },
  { data: "2026-05-25", orgao: "Ministério da Educação", titulo: "Homologação — Concurso Professor EBTT", secao: "Seção 1", tipo: "Homologação" },
  { data: "2026-05-25", orgao: "FGV", titulo: "Publicação de Gabarito — Concurso ALERJ", secao: "Seção 3", tipo: "Gabarito" },
  { data: "2026-05-24", orgao: "CEBRASPE", titulo: "Edital de Convocação — 3ª chamada", secao: "Seção 3", tipo: "Convocação" },
  { data: "2026-05-24", orgao: "Ministério da Defesa", titulo: "Resultado Preliminar — Concurso de Admissão", secao: "Seção 1", tipo: "Resultado" },
  { data: "2026-05-23", orgao: "Secretaria da Fazenda SP", titulo: "Abertura — Concurso Fiscal de Rendas", secao: "Seção 2", tipo: "Edital" },
  { data: "2026-05-23", orgao: "IDECAN", titulo: "Edital nº 12/2026 — Concurso Prefeitura de Vila Velha", secao: "Seção 3", tipo: "Edital" },
  { data: "2026-05-22", orgao: "FCC", titulo: "Gabarito Definitivo — Concurso TRE-SP", secao: "Seção 3", tipo: "Gabarito" },
  { data: "2026-05-22", orgao: "Ministério da Saúde", titulo: "Convocação — 2ª chamada Técnico Administrativo", secao: "Seção 3", tipo: "Convocação" },
]

const TIPO_CORES: Record<string, string> = {
  Edital: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
  Resultado: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  Convocação: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  Homologação: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  Gabarito: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
}

export default function DiarioOficialPage() {
  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set())

  const toggleFav = (i: number) => {
    setFavoritos((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const tipos = [...new Set(publicacoes.map((p) => p.tipo))].sort()

  const filtradas = publicacoes.filter((p) => {
    if (filtroTipo && p.tipo !== filtroTipo) return false
    if (busca.trim()) {
      const q = busca.toLowerCase()
      if (!p.titulo.toLowerCase().includes(q) && !p.orgao.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Agrupa por data
  const grupos = filtradas.reduce((acc, p) => {
    if (!acc[p.data]) acc[p.data] = []
    acc[p.data].push(p)
    return acc
  }, {} as Record<string, typeof publicacoes>)

  const datas = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Diário Oficial da União</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Publicações oficiais extraídas do DOU e páginas de bancas organizadoras
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar publicações..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">Todos os Tipos</option>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtradas.length} publicações</span>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {datas.map((data) => (
          <div key={data}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {new Date(data).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h3>
            </div>
            <div className="space-y-1">
              {grupos[data].map((pub, i) => {
                const tc = TIPO_CORES[pub.tipo] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                const isFav = favoritos.has(i)
                return (
                  <div key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isFav
                        ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20"
                        : "border-transparent bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }`}>
                    <button onClick={() => toggleFav(i)}
                      className={`mt-0.5 p-0.5 rounded transition-colors ${isFav ? "text-indigo-500" : "text-slate-300 dark:text-slate-600 hover:text-amber-400"}`}>
                      {isFav ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{pub.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{pub.orgao}</span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] text-slate-400">{pub.secao}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc} flex-shrink-0`}>
                      {pub.tipo}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
