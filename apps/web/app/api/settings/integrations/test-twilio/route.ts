import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getIntegrationConfig } from '@/lib/get-integration-config'
import { ANY_NON_EMAIL_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'

export async function POST() {
  if (!ANY_NON_EMAIL_CHANNEL_ENABLED) {
    return NextResponse.json({ error: 'Canales SMS/WhatsApp deshabilitados' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id
  const campaignId = profile?.campaign_ids?.[0] ?? null
  if (!tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const config = await getIntegrationConfig(adminSupabase, tenantId, campaignId)

  if (!config?.twilio_sid || !config?.twilio_token) {
    return NextResponse.json({ error: 'Faltan credenciales de Twilio' }, { status: 400 })
  }

  // Decrypt token — fallback to plain text (from migration)
  let token = config.twilio_token
  const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', { encrypted: config.twilio_token })
  if (decrypted) token = decrypted

  try {
    const credentials = Buffer.from(`${config.twilio_sid}:${token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilio_sid}.json`, {
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
