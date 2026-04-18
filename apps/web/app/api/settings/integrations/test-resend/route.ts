import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getIntegrationConfig } from '@/lib/get-integration-config'
import { buildResendFrom } from '@/lib/email/build-resend-from'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id
  const campaignId = body.campaign_id ?? profile?.campaign_ids?.[0] ?? null
  if (!tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const config = await getIntegrationConfig(adminSupabase, tenantId, campaignId)

  if (!config?.resend_domain) {
    return NextResponse.json({ error: 'No hay dominio configurado en Resend' }, { status: 400 })
  }

  // Decrypt API key, fallback to env var
  let apiKey = process.env.RESEND_API_KEY ?? ''
  if (config.resend_api_key) {
    const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', { encrypted: config.resend_api_key })
    if (decrypted) apiKey = decrypted
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'No hay API key de Resend configurada' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: buildResendFrom(config),
        to: user.email,
        subject: 'Scrutix — Prueba de conexión',
        text: 'Esta es una prueba de conexión exitosa con Resend desde Scrutix.',
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
