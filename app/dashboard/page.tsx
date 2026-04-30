'use client'

import { useEffect, useState } from 'react'

interface Edital {
  id: string
  titulo: string
  orgao: string
  data_publicacao: string
  url: string
  categoria: string
  resumo: string
  nivel: string
  fonte: string
  status: 'aberto' | 'previsto' | 'encerrado'
}

const CATEGORIAS = ['Todas', 'TI / Tecnologia', 'Saúde', 'Educação', 'Administrativo', 'Jurídico', 'Engenharia', 'Segurança Pública', 'Fiscal / Receita', 'Concurso Militar', 'Geral']
const NIVEIS     = ['Todos', 'federal', 'estadual', 'municipal']
const FONTES     = ['Todas', 'DOU / LexML', 'Estratégia Concursos', 'Gran Cursos Online', 'Direção Concursos']

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  aberto:    { bg: '#dcfce7', color: '#166534', label: '🟢 Aberto'   },
  previsto:  { bg: '#fef9c3', color: '#713f12', label: '🟡 Previsto' },
  encerrado: { bg: '#f3f4f6', color: '#6b7280', label: '⚪ Encerrado' },
}

const FONTE_ICONE: Record<string, string> = {
  'DOU / LexML':          '📰',
  'Estratégia Concursos': '📚',
  'Gran Cursos Online':   '🎓',
  'Direção Concursos':    '🎯',
}

function badge(categoria: string) {
  const cores: Record<string, { bg: string; color: string }> = {
    'TI / Tecnologia':   { bg: '#dbeafe', color: '#1e40af' },
    'Saúde':             { bg: '#dcfce7', color: '#166534' },
    'Educação':          { bg: '#ede9fe', color: '#5b21b6' },
    'Administrativo':    { bg: '#fef9c3', color: '#713f12' },
    'Jurídico':          { bg: '#fee2e2', color: '#991b1b' },
    'Engenharia':        { bg: '#ffedd5', color: '#c2410c' },
    'Segurança Pública': { bg: '#f0f9ff', color: '#0369a1' },
    'Fiscal / Receita':  { bg: '#fdf4ff', color: '#7e22ce' },
    'Concurso Militar':  { bg: '#fff1f2', color: '#be123c' },
    'Geral':             { bg: '#f3f4f6', color: '#374151' },
  }
  const c = cores[categoria] || cores['Geral']
  return <span style={{ background: c.bg, color: c.color, padding: '0.15rem 0.65rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{categoria}</span>
}

function TabBtn({ label, ativo, count, onClick }: { label: string; ativo: boolean; count?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontWeight: 700, fontSize: '0.875rem',
      background: ativo ? '#1e1b4b' : '#e2e8f0',
      color: ativo ? '#fff' : '#374151',
    }}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  )
}

export default function Dashboard() {
  const [editais, setEditais]     = useState<Edital[]>([])
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<'abertos' | 'previstos' | 'todos'>('abertos')
  const [categoria, setCategoria] = useState('Todas')
  const [nivel, setNivel]         = useState('Todos')
  const [fonte, setFonte]         = useState('Todas')
  const [busca, setBusca]         = useState('')
  const [rodando, setRodando]     = useState(false)
  const [ultimaExec, setUltimaExec] = useState('')

  const carregar = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (categoria !== 'Todas') params.set('categoria', categoria)
    if (nivel !== 'Todos')     params.set('nivel', nivel)
    if (fonte !== 'Todas')     params.set('fonte', fonte)
    if (busca.trim())          params.set('q', busca.trim())
    if (tab !== 'todos')       params.set('status', tab === 'abertos' ? 'aberto' : 'previsto')
    params.set('limit', '200')

    const res  = await fetch(`/api/editais?${params}`)
    const data = await res.json()
    setEditais(data.editais || [])
    setLoading(false)
  }

  const executarScraper = async () => {
    setRodando(true)
    const res  = await fetch('/api/scraper', {
      method: 'POST',
      headers: { 'x-cron-secret': 'monitor_editais_2026' },
    })
    const data = await res.json()
    if (!data.ok) {
      setUltimaExec(`❌ Erro: ${data.erro || 'falha na coleta'} · ${new Date().toLocaleTimeString('pt-BR')}`)
    } else {
      const fontes = (data.relatorio || []).map((r: any) => `${r.fonte}: ${r.inseridos ?? 0} novos`).join(' · ')
      setUltimaExec(`${data.totalInseridos} novos · ${data.totalDuplic} duplicados · ${new Date().toLocaleTimeString('pt-BR')}${fontes ? ' — ' + fontes : ''}`)
    }
    setRodando(false)
    carregar()
  }

  useEffect(() => { carregar() }, [tab, categoria, nivel, fonte])

  const abertos   = editais.filter(e => e.status === 'aberto')
  const previstos = editais.filter(e => e.status === 'previsto')
  const exibidos  = tab === 'abertos' ? abertos : tab === 'previstos' ? previstos : editais

  // Agrupar previstos por categoria para a seção de tendências
  const tendencias = previstos.reduce((acc, e) => {
    acc[e.categoria] = (acc[e.categoria] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const tendenciasOrdenadas = Object.entries(tendencias).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ fontFamily: 'Segoe UI, system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: '#1e1b4b', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>📋 Monitor de Concursos 2026</h1>
          <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0.1rem 0 0' }}>DOU · Estratégia · Gran Cursos · Direção Concursos</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/alertas" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            🔔 Meus Alertas
          </a>
          <button onClick={executarScraper} disabled={rodando}
            style={{ background: rodando ? '#6b7280' : '#16a34a', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: rodando ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
            {rodando ? '⏳ Coletando...' : '🔄 Coletar Agora'}
          </button>
        </div>
      </header>

      {ultimaExec && (
        <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', padding: '0.4rem 2rem', fontSize: '0.8rem', color: '#166534' }}>
          ✅ Última coleta: {ultimaExec}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Cards de resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Editais Abertos',  valor: abertos.length,   cor: '#166534', bg: '#dcfce7', icon: '🟢' },
            { label: 'Previstos 2026',   valor: previstos.length, cor: '#713f12', bg: '#fef9c3', icon: '🟡' },
            { label: 'Total Coletado',   valor: editais.length,   cor: '#1e40af', bg: '#dbeafe', icon: '📊' },
            { label: 'Fontes Ativas',    valor: 4,                cor: '#5b21b6', bg: '#ede9fe', icon: '📡' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.cor}33`, borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '1.5rem' }}>{c.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
              <div style={{ fontSize: '0.8rem', color: c.cor, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Tendências de previstos */}
        {tendenciasOrdenadas.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem', color: '#374151' }}>
              🔮 Tendências — Concursos Previstos por Área
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tendenciasOrdenadas.map(([cat, qtd]) => (
                <button key={cat} onClick={() => { setCategoria(cat); setTab('previstos') }}
                  style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 20, padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                  {cat} <strong style={{ color: '#1e1b4b' }}>{qtd}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <TabBtn label="🟢 Abertos"      ativo={tab === 'abertos'}   count={abertos.length}   onClick={() => setTab('abertos')} />
          <TabBtn label="🟡 Previstos"    ativo={tab === 'previstos'} count={previstos.length} onClick={() => setTab('previstos')} />
          <TabBtn label="📋 Todos"        ativo={tab === 'todos'}                              onClick={() => setTab('todos')} />
        </div>

        {/* Filtros */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', color: '#374151', marginBottom: '0.3rem' }}>Buscar</label>
            <input value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === 'Enter' && carregar()}
              placeholder="Palavra-chave..."
              style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
          </div>
          {[
            { label: 'Categoria', value: categoria, set: setCategoria, opts: CATEGORIAS },
            { label: 'Nível',     value: nivel,     set: setNivel,     opts: NIVEIS     },
            { label: 'Fonte',     value: fonte,     set: setFonte,     opts: FONTES     },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', color: '#374151', marginBottom: '0.3rem' }}>{f.label}</label>
              <select value={f.value} onChange={e => f.set(e.target.value)}
                style={{ padding: '0.55rem 0.85rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.875rem', background: '#fff' }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={carregar}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
            Filtrar
          </button>
          {(categoria !== 'Todas' || nivel !== 'Todos' || fonte !== 'Todas' || busca) && (
            <button onClick={() => { setCategoria('Todas'); setNivel('Todos'); setFonte('Todas'); setBusca('') }}
              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.55rem 0.85rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              ✕ Limpar
            </button>
          )}
        </div>

        <p style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          {loading ? 'Carregando...' : `${exibidos.length} resultado(s)`}
        </p>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {exibidos.map(e => {
            const st = STATUS_STYLE[e.status] || STATUS_STYLE.encerrado
            return (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.9rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {badge(e.categoria)}
                      <span style={{ background: st.bg, color: st.color, padding: '0.1rem 0.55rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>{st.label}</span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{FONTE_ICONE[e.fonte] || '🌐'} {e.fonte}</span>
                    </div>
                    <a href={e.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e1b4b', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}>
                      {e.titulo}
                    </a>
                    {e.orgao && e.orgao !== 'Não identificado' && (
                      <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0.2rem 0 0' }}>🏛️ {e.orgao} · {e.nivel}</p>
                    )}
                    {e.resumo && (
                      <p style={{ fontSize: '0.78rem', color: '#374151', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                        {e.resumo.slice(0, 180)}{e.resumo.length > 180 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#9ca3af' }}>
                    {new Date(e.data_publicacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            )
          })}

          {!loading && exibidos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <p style={{ fontSize: '2rem' }}>📭</p>
              <p>Nenhum resultado. Clique em <strong>Coletar Agora</strong> para buscar.</p>
            </div>
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.72rem', color: '#9ca3af', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
        © {new Date().getFullYear()} Msdos Informática Ltda — Monitor de Editais &nbsp;·&nbsp; LGPD Lei nº 13.709/2018
      </footer>
    </div>
  )
}
