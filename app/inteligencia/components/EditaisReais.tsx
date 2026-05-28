"use client"

import { ExternalLink, Building2, Calendar, Hash } from "lucide-react"

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

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  aberto: { bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300", label: "Aberto" },
  em_andamento: { bg: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300", label: "Em Andamento" },
  previsto: { bg: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300", label: "Previsto" },
  encerrado: { bg: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400", label: "Encerrado" },
}

const CATEGORIA_CORES: Record<string, string> = {
  "TI / Tecnologia": "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300",
  "Saúde": "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300",
  "Educação": "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300",
  "Administrativo": "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300",
  "Jurídico": "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300",
  "Engenharia": "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300",
  "Segurança Pública": "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300",
  "Fiscal / Receita": "bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300",
  "Concurso Militar": "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300",
}

function badgeCategoria(cat: string) {
  const c = CATEGORIA_CORES[cat] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c}`}>{cat}</span>
}

function badgeBanca(banca: string) {
  if (!banca) return null
  const cores: Record<string, string> = {
    FGV: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
    CEBRASPE: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
    FCC: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300",
    VUNESP: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300",
    IDCAP: "bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300",
    IDECAN: "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300",
    IBAM: "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300",
  }
  const c = cores[banca] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c}`}>{banca}</span>
}

interface EditaisReaisProps {
  editais: EditalDB[]
}

export default function EditaisReais({ editais }: EditaisReaisProps) {
  if (editais.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center">
        <p className="text-sm text-slate-400">Nenhum edital encontrado com os filtros atuais.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {editais.map((edital) => {
        const st = STATUS_STYLE[edital.status] || STATUS_STYLE.encerrado
        return (
          <div
            key={edital.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Título + link */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <a
                    href={edital.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                  >
                    {edital.titulo}
                  </a>
                  <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                </div>

                {/* Badges: status + banca + categoria + fonte + nível */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg}`}>{st.label}</span>
                  {badgeBanca(edital.banca)}
                  {badgeCategoria(edital.categoria)}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">{edital.fonte}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{edital.nivel}</span>
                </div>

                {/* Órgão */}
                {edital.orgao && edital.orgao !== "Não identificado" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                    🏛️ {edital.orgao}
                  </p>
                )}

                {/* Rodapé */}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(edital.data_publicacao).toLocaleDateString("pt-BR")}
                  </span>
                  {edital.resumo && (
                    <span className="truncate max-w-xs">{edital.resumo.slice(0, 80)}{edital.resumo.length > 80 ? "..." : ""}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
