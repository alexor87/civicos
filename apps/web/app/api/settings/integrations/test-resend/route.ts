import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { campaign_id } = body

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('resend_domain')
    .eq('id', campaign_id)
    .single()

  if (!campaign?.resend_domain) {
    return NextResponse.json({ error: 'No hay dominio configurado en Resend' }, { status: 400 })
  }

  // Verify by attempting to send a test email via Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `test@${campaign.resend_domain}`,
        to: user.email,
        subject: 'CivicOS — Prueba de conexión',
        text: 'Esta es una prueba de conexión exitosa con Resend desde CivicOS.',
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = data.message ?? 'Error desconocido'
      if (msg.includes('domain') || msg.includes('verify')) {
        return NextResponse.json({ error: 'El dominio no está verificado en Resend. Sigue el proceso de verificación antes de guardar.' }, { status: 400 })
      }
      return NextResponse.json({ error: `Error de Resend: ${msg}` }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con Resend. Verifica tu conexión.' }, { status: 500 })
  }
}
