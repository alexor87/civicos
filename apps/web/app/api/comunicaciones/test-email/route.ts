import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { getIntegrationConfig } from '@/lib/get-integration-config'
import { buildResendFrom } from '@/lib/email/build-resend-from'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role, full_name')
    .eq('id', user.id)
    .single()

  const canSend = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canSend) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { subject, body_html, to_email } = body

  if (!subject || !body_html || !to_email) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const previewHtml = body_html
    .replace(/\{nombre\}/gi, profile?.full_name?.split(' ')[0] ?? 'Usuario')
    .replace(/\{apellido\}/gi, profile?.full_name?.split(' ')[1] ?? '')

  const activeCampaignId = profile?.campaign_ids?.[0] ?? ''
  const adminSupabase = createAdminClient()
  const integrationConfig = await getIntegrationConfig(supabase, profile!.tenant_id, activeCampaignId)

  let resendApiKey = ''
  if (integrationConfig?.resend_api_key) {
    const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', { encrypted: integrationConfig.resend_api_key })
    if (decrypted) resendApiKey = decrypted
    else return NextResponse.json({ error: 'No se pudo desencriptar la API key de Resend. Intenta guardarla de nuevo.' }, { status: 500 })
  } else {
    resendApiKey = process.env.RESEND_API_KEY ?? ''
  }

  if (!resendApiKey) {
    return NextResponse.json({ error: 'No hay API key de Resend configurada' }, { status: 400 })
  }

  const resend = new Resend(resendApiKey)
  const fromAddress = buildResendFrom(integrationConfig ?? {}, process.env.EMAIL_FROM)

  try {
    await resend.emails.send({
      from: fromAddress,
      to: to_email,
      subject: `[PRUEBA] ${subject}`,
      html: previewHtml,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al enviar el email de prueba' }, { status: 500 })
  }
}
