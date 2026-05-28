'use client'

import { useEffect, useState } from 'react'

const AREAS = ['TI / Tecnologia', 'Saúde', 'Educação', 'Administrativo', 'Jurídico', 'Engenharia', 'Segurança Pública', 'Fiscal / Receita', 'Concurso Militar', 'Geral']
const NIVEIS = ['federal', 'estadual', 'municipal']

interface AlertaConfig {
  id: string
  email: string
  nome: string
  areas: string[]
  nivel: string[]
  palavras_extras: string[]
  ativo: boolean
}

export default function AlertasPage() {
  const [alertas, setAlertas]         = useState<AlertaConfig[]>([])
  const [nome, setNome]               = useState('')
  const [email, setEmail]             = useState('')
  const [areas, setAreas]             = useState<string[]>([])
  const [nivel, setNivel]             = useState<string[]>(['federal'])
  const [extras, setExtras]           = useState('')
  const [salvando, setSalvando]       = useState(false)
  const [msg, setMsg]                 = useState('')

  const carregar = async () => {
    const res  = await fetch('/api/alertas')
    const data = await res.json()
    setAlertas(data.alertas || [])
  }

  useEffect(() => { carregar() }, [])

  const toggleArea  = (a: string) => setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  const toggleNivel = (n: string) => setNivel(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    const res = await fetch('/api/alertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome, email, areas, nivel,
        palavras_extras: extras.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    const data = await res.json()
    setSalvando(false)
    if (data.ok) {
      setMsg('✅ Alerta cadastrado com sucesso!')
      setNome(''); setEmail(''); setAreas([]); setNivel(['federal']); setExtras('')
      carregar()
    } else {
      setMsg(`❌ ${data.erro}`)
    }
  }

  const excluir = async (id: string) => {
    if (!confirm('Remover este alerta?')) return
    await fetch(`/api/alertas?id=${id}`, { method: 'DELETE' })
    carregar()
  }

  const chip = (label: string, ativo: boolean, onClick: () => void) => (
    <button key={label} type="button" onClick={onClick}
      style={{
        padding: '0.35rem 0.85rem', borderRadius: 20, border: '2px solid',
        borderColor: ativo ? '#3b82f6' : '#e5e7eb',
        background:  ativo ? '#eff6ff' : '#fff',
        color:       ativo ? '#1d4ed8' : '#374151',
        fontWeight:  ativo ? 700 : 500,
        cursor: 'pointer', fontSize: '0.8rem',
      }}>
      {label}
    </button>
  )

  return (
    <div style={{ fontFamily: 'Segoe UI, system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ background: '#1e1b4b', color: '#fff', padding: '1rem 2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>🔔 Alertas de Editais</h1>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textDecoration: 'none' }}>← Dashboard</a>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Formulário */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Cadastrar Alerta</h2>

          {msg && (
            <div style={{ background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: msg.startsWith('✅') ? '#166534' : '#991b1b', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {msg}
            </div>
          )}

          <form onSubmit={salvar}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.35rem' }}>Nome *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Seu nome"
                style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.35rem' }}>E-mail *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="seu@email.com"
                style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Áreas de interesse</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {AREAS.map(a => chip(a, areas.includes(a), () => toggleArea(a)))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Nível</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {NIVEIS.map(n => chip(n.charAt(0).toUpperCase() + n.slice(1), nivel.includes(n), () => toggleNivel(n)))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.35rem' }}>Palavras extras (separadas por vírgula)</label>
              <input value={extras} onChange={e => setExtras(e.target.value)} placeholder="Ex: analista, fiscal, auditor"
                style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
            </div>

            <button type="submit" disabled={salvando}
              style={{ width: '100%', background: salvando ? '#6b7280' : '#3b82f6', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: 8, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer' }}>
              {salvando ? 'Salvando...' : 'Cadastrar Alerta'}
            </button>
          </form>
        </div>

        {/* Lista de alertas cadastrados */}
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Alertas Cadastrados ({alertas.length})</h2>
          {alertas.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              Nenhum alerta cadastrado ainda.
            </div>
          ) : alertas.map(a => (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.15rem' }}>{a.nome}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{a.email}</p>
                </div>
                <button onClick={() => excluir(a.id)}
                  style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
                  Remover
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {a.areas.map(ar => (
                  <span key={ar} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.1rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>{ar}</span>
                ))}
                {a.nivel.map(n => (
                  <span key={n} style={{ background: '#f3f4f6', color: '#374151', padding: '0.1rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
