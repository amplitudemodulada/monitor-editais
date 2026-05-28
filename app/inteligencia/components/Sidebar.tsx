"use client"

import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  Newspaper,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
}

const navItems: NavItem[] = [
  { label: "Início", icon: LayoutDashboard, href: "/inteligencia" },
  { label: "Meus Editais", icon: FileText, href: "/inteligencia/meus-editais" },
  { label: "Rastreador de Vagas", icon: Users, href: "/inteligencia/rastreador-vagas" },
  { label: "Diário Oficial", icon: Newspaper, href: "/inteligencia/diario-oficial" },
  { label: "Espaço da Comissão", icon: UserCircle, href: "/inteligencia/espaco-comissao" },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-base text-slate-900 dark:text-white whitespace-nowrap">
            IntelEdital
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </a>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
