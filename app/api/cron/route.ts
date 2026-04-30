import { NextRequest, NextResponse } from 'next/server'
import { buscarEditalLexml } from '@/lib/lexml'
import { supabase } from '@/lib/supabase'
import { processarAlertas } from '@/lib/alertas'

export async function GET(req: NextRequest) {
  // Vercel Cron envia Authorization: Bearer <CRON_SECRET>
  const auth   = req.headers.get('authorization') ?? ''
  const secret = auth.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()
  let inseridos  = 0
  let duplicados = 0
  let erros      = 0
  const editaisNovos = []

  try {
    // Coleta até 3 páginas por execução
    for (let pagina = 1; pagina <= 3; pagina++) {
      const editais = await buscarEditalLexml(pagina)
      if (!editais.length) break

      for (const edital of editais) {
        const { data, error } = await supabase
          .from('editais')
          .upsert(edital, { onConflict: 'url', ignoreDuplicates: true })
          .select()

        if (error)         { erros++;      continue }
        if (data?.length)  { inseridos++;  editaisNovos.push({ ...edital, id: data[0].id }) }
        else               { duplicados++ }
      }
    }

    // Envia alertas por e-mail para usuários cadastrados
    const alertasEnviados = await processarAlertas(editaisNovos)

    // Log da execução
    await supabase.from('scraper_log').insert({
      inseridos,
      duplicados,
      erros,
      fonte:  'LexML',
      status: erros > inseridos ? 'parcial' : 'ok',
    })

    return NextResponse.json({
      ok: true,
      inseridos,
      duplicados,
      erros,
      alertasEnviados,
      duracaoMs: Date.now() - inicio,
      executadoEm: new Date().toISOString(),
    })
  } catch (err: any) {
    await supabase.from('scraper_log').insert({ inseridos, duplicados, erros: erros + 1, status: 'erro', fonte: 'LexML' })
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
