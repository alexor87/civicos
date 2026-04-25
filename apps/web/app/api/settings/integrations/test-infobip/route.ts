import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getIntegrationConfig } from '@/lib/get-integration-config'
import { InfobipProvider } from '@/lib/messaging/providers/infobip'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const tenantId   = profile?.tenant_id
  const campaignId = profile?.campaign_ids?.[0] ?? null
  if (!tenantId) return NextResponse.json({ error: 'Sin tenant' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const config = await getIntegrationConfig(adminSupabase, tenantId, campaignId)

  if (!config?.infobip_api_key || !config?.infobip_base_url) {
    return NextResponse.json(
      { error: 'Faltan credenciales de Infobip (API key y Base URL)' },
      { status: 400 }
    )
  }

  let apiKey = config.infobip_api_key
  const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', {
    encrypted: config.infobip_api_key,
  })
  if (decrypted) apiKey = decrypted

  const provider = new InfobipProvider({
    apiKey,
    baseUrl:      config.infobip_base_url,
    smsFrom:      config.infobip_sms_from,
    whatsappFrom: config.infobip_whatsapp_from,
  })

  const result = await provider.testConnection()
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'No se pudo conectar con Infobip' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
