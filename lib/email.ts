import { Resend } from 'resend'
import type { Edital } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = 'Monitor de Editais <alertas@msdosinformatica.com.br>'

function corCategoria(cat: string) {
  const cores: Record<string, string> = {
    'TI / Tecnologia':   '#1e40af',
    'Saúde':             '#166534',
    'Educação':          '#5b21b6',
    'Administrativo':    '#713f12',
    'Jurídico':          '#991b1b',
    'Engenharia':        '#c2410c',
    'Segurança Pública': '#0369a1',
    'Geral':             '#374151',
  }
  return cores[cat] || '#374151'
}

function gerarHtml(nome: string, editais: Edital[]): string {
  const cards = editais.map(e => `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1rem 1.25rem;margin-bottom:0.75rem;">
      <span style="background:#f0f0ff;color:${corCategoria(e.categoria)};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">${e.categoria}</span>
      <p style="font-weight:700;font-size:15px;color:#1e1b4b;margin:0.5rem 0 0.25rem;">
        <a href="${e.url}" style="color:#1e1b4b;text-decoration:none;">${e.titulo}</a>
      </p>
      ${e.orgao ? `<p style="font-size:12px;color:#6b7280;margin:0 0 0.35rem;">🏛️ ${e.orgao}</p>` : ''}
      ${e.resumo ? `<p style="font-size:12px;color:#374151;margin:0;line-height:1.5;">${e.resumo.slice(0, 180)}${e.resumo.length > 180 ? '...' : ''}</p>` : ''}
      <p style="font-size:11px;color:#9ca3af;margin:0.5rem 0 0;">
        📅 ${new Date(e.data_publicacao).toLocaleDateString('pt-BR')} · ${e.nivel} · ${e.fonte}
      </p>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:2rem 1rem;">
    <div style="background:linear-gradient(135deg,#1e1b4b,#3730a3);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1.5rem;">
      <h1 style="color:#fff;margin:0;font-size:1.4rem;">📋 Monitor de Editais</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:0.85rem;margin:0.35rem 0 0;">Olá, <strong>${nome}</strong>! Novos editais foram encontrados.</p>
    </div>

    <p style="color:#374151;font-size:0.9rem;margin-bottom:1.25rem;">
      Encontramos <strong>${editais.length} novo(s) edital(is)</strong> compatível(is) com seu perfil de interesse:
    </p>

    ${cards}

    <div style="border-top:1px solid #e5e7eb;margin-top:1.5rem;padding-top:1rem;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">
        © ${new Date().getFullYear()} Msdos Informática Ltda &nbsp;·&nbsp;
        LGPD Lei nº 13.709/2018 &nbsp;·&nbsp; LAI Lei nº 12.527/2011
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function enviarAlertaEmail(
  email: string,
  nome: string,
  editais: Edital[]
): Promise<boolean> {
  if (!editais.length) return false
  const { error } = await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: `📋 ${editais.length} novo(s) edital(is) para você — ${new Date().toLocaleDateString('pt-BR')}`,
    html:    gerarHtml(nome, editais),
  })
  if (error) console.error('Erro e-mail Resend:', error)
  return !error
}
