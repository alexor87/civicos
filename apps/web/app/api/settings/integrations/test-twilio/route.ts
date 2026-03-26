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
    .select('twilio_sid, twilio_token, twilio_from')
    .eq('id', campaign_id)
    .single()

  if (!campaign?.twilio_sid || !campaign?.twilio_token) {
    return NextResponse.json({ error: 'Faltan credenciales de Twilio' }, { status: 400 })
  }

  // Verify by calling Twilio's account API
  try {
    const credentials = Buffer.from(`${campaign.twilio_sid}:${campaign.twilio_token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${campaign.twilio_sid}.json`, {
      headers: { 'Authorization': `Basic ${credentials}` },
    })

    if (res.status === 401) {
      return NextResponse.json({ error: 'Las credenciales son inválidas. Verifica el Auth Token en la consola de Twilio.' }, { status: 400 })
    }
    if (res.status === 403) {
      return NextResponse.json({ error: 'No tienes permiso para usar este servicio. Verifica que tu cuenta de Twilio esté activa.' }, { status: 400 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Error al verificar la cuenta de Twilio' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con Twilio. Verifica tu conexión.' }, { status: 500 })
  }
}
