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
}

const CATEGORIAS = ['Todas', 'TI / Tecnologia', 'Saúde', 'Educação', 'Administrativo', 'Jurídico', 'Engenharia', 'Segurança Pública', 'Geral']
const NIVEIS     = ['Todos', 'federal', 'estadual', 'municipal']

function badge(categoria: string) {
  const cores: Record<string, { bg: string; color: string }> = {
    'TI / Tecnologia':   { bg: '#dbeafe', color: '#1e40af' },
    'Saúde':             { bg: '#dcfce7', color: '#166534' },
    'Educação':          { bg: '#ede9fe', color: '#5b21b6' },
    'Administrativo':    { bg: '#fef9c3', color: '#713f12' },
    'Jurídico':          { bg: '#fee2e2', color: '#991b1b' },
    'Engenharia':        { bg: '#ffedd5', color: '#c2410c' },
    'Segurança Pública': { bg: '#f0f9ff', color: '#0369a1' },
    'Geral':             { bg: '#f3f4f6', color: '#374151' },
  }
  const c = cores[categoria] || cores['Geral']
  return (
    <span style={{ background: c.bg, color: c.color, padding: '0.15rem 0.65rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
      {categoria}
    </span>
  )
}

export default function Dashboard() {
  const [editais, setEditais]       = useState<Edital[]>([])
  const [loading, setLoading]       = useState(false)
  const [categoria, setCategoria]   = useState('Todas')
  const [nivel, setNivel]           = useState('Todos')
  const [busca, setBusca]           = useState('')
  const [rodando, setRodando]       = useState(false)
  const [ultimaExec, setUltimaExec] = useState('')

  const carregar = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (categoria !== 'Todas') params.set('categoria', categoria)
    if (nivel !== 'Todos')     params.set('nivel', nivel)
    if (busca.trim())          params.set('q', busca.trim())
    params.set('limit', '100')

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
    setUltimaExec(`${data.inseridos} novos · ${data.duplicados} duplicados · ${new Date().toLocaleTimeString('pt-BR')}`)
    setRodando(false)
    carregar()
  }

  useEffect(() => { carregar() }, [categoria, nivel])

  return (
    <div style={{ fontFamily: 'Segoe UI, system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: '#1e1b4b', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>📋 Monitor de Editais</h1>
          <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0.1rem 0 0' }}>Diário Oficial da União via LexML</p>
        </div>
        <button onClick={executarScraper} disabled={rodando}
          style={{ background: rodando ? '#6b7280' : '#16a34a', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: rodando ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
          {rodando ? '⏳ Coletando...' : '🔄 Coletar Agora'}
        </button>
      </header>

      {ultimaExec && (
        <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', padding: '0.4rem 2rem', fontSize: '0.8rem', color: '#166534' }}>
          ✅ Última coleta: {ultimaExec}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Filtros */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: '0.35rem' }}>Buscar</label>
            <input value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === 'Enter' && carregar()}
              placeholder="Palavra-chave no título..."
              style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: '0.35rem' }}>Categoria</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#fff' }}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: '0.35rem' }}>Nível</label>
            <select value={nivel} onChange={e => setNivel(e.target.value)}
              style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', background: '#fff' }}>
              {NIVEIS.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={carregar}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
            Filtrar
          </button>
        </div>

        {/* Contador */}
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {loading ? 'Carregando...' : `${editais.length} edital(is) encontrado(s)`}
        </p>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {editais.map(e => (
            <div key={e.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {badge(e.categoria)}
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{e.nivel} · {e.fonte}</span>
                  </div>
                  <a href={e.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e1b4b', textDecoration: 'none' }}>
                    {e.titulo}
                  </a>
                  {e.orgao && <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>🏛️ {e.orgao}</p>}
                  {e.resumo && <p style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.35rem', lineHeight: 1.5 }}>{e.resumo.slice(0, 200)}{e.resumo.length > 200 ? '...' : ''}</p>}
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {new Date(e.data_publicacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!loading && editais.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <p style={{ fontSize: '2rem' }}>📭</p>
              <p>Nenhum edital encontrado. Clique em &quot;Coletar Agora&quot; para buscar.</p>
            </div>
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.72rem', color: '#9ca3af', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
        © {new Date().getFullYear()} Msdos Informática Ltda — Monitor de Editais
      </footer>
    </div>
  )
}
