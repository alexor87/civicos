import type { SupabaseClient } from '@supabase/supabase-js'

export interface IntegrationConfig {
  id: string
  tenant_id: string
  campaign_id: string | null
  resend_api_key: string | null
  resend_api_key_hint: string | null
  resend_domain: string | null
  resend_from_name: string | null
  resend_from_email: string | null
  twilio_sid: string | null
  twilio_token: string | null
  twilio_token_hint: string | null
  twilio_from: string | null
  twilio_whatsapp_from: string | null
  resend_webhook_secret: string | null
  resend_webhook_secret_hint: string | null
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
