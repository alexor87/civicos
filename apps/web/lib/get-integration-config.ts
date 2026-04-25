import type { SupabaseClient } from '@supabase/supabase-js'

export type ProviderId = 'twilio' | 'infobip'

export interface IntegrationConfig {
  id: string
  tenant_id: string
  campaign_id: string | null
  resend_api_key: string | null
  resend_api_key_hint: string | null
  resend_domain: string | null
  resend_from_name: string | null
  resend_from_email: string | null
  resend_webhook_secret: string | null
  resend_webhook_secret_hint: string | null
  // Provider selection per channel.
  sms_provider: ProviderId | null
  whatsapp_provider: ProviderId | null
  // Twilio config
  twilio_sid: string | null
  twilio_token: string | null
  twilio_token_hint: string | null
  twilio_from: string | null
  twilio_whatsapp_from: string | null
  // Infobip config
  infobip_api_key: string | null
  infobip_api_key_hint: string | null
  infobip_base_url: string | null
  infobip_sms_from: string | null
  infobip_whatsapp_from: string | null
}

/**
 * Get integration config for a tenant+campaign.
 * Priority: campaign-specific → tenant default → null
 */
export async function getIntegrationConfig(
  supabase: SupabaseClient,
  tenantId: string,
  campaignId: string | null,
): Promise<IntegrationConfig | null> {
  const { data } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(campaignId ? `campaign_id.eq.${campaignId},campaign_id.is.null` : 'campaign_id.is.null')
    .order('campaign_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .single()

  return (data as IntegrationConfig | null) ?? null
}
