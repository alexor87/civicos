import type { SupabaseClient } from '@supabase/supabase-js'
import { getIntegrationConfig, type IntegrationConfig } from '@/lib/get-integration-config'
import { TwilioProvider } from './providers/twilio'
import { InfobipProvider } from './providers/infobip'
import {
  MessagingConfigError,
  type MessagingChannel,
  type MessagingProvider,
  type ProviderId,
} from './types'

async function decryptToken(
  adminSupabase: SupabaseClient,
  encrypted: string | null
): Promise<string> {
  if (!encrypted) return ''
  const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', {
    encrypted,
  })
  return decrypted ?? encrypted // fallback to plain text (back-compat)
}

function pickProviderId(
  config: IntegrationConfig | null,
  channel: MessagingChannel
): ProviderId {
  if (!config) return 'twilio'
  const selected = channel === 'sms' ? config.sms_provider : config.whatsapp_provider
  return selected ?? 'twilio'
}

export async function getMessagingProvider(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  tenantId: string,
  campaignId: string | null,
  channel: MessagingChannel
): Promise<MessagingProvider> {
  const config     = await getIntegrationConfig(supabase, tenantId, campaignId)
  const providerId = pickProviderId(config, channel)

  if (providerId === 'twilio') {
    return await buildTwilio(config, adminSupabase, channel)
  }
  if (providerId === 'infobip') {
    return await buildInfobip(config, adminSupabase, channel)
  }

  throw new MessagingConfigError('unknown_provider', `Provider not supported: ${providerId}`)
}

async function buildTwilio(
  config: IntegrationConfig | null,
  adminSupabase: SupabaseClient,
  channel: MessagingChannel
): Promise<TwilioProvider> {
  const authToken = config?.twilio_token
    ? await decryptToken(adminSupabase, config.twilio_token)
    : (process.env.TWILIO_AUTH_TOKEN ?? '')

  const sid          = config?.twilio_sid           ?? process.env.TWILIO_ACCOUNT_SID ?? ''
  const smsFrom      = config?.twilio_from          ?? process.env.TWILIO_FROM_NUMBER ?? null
  const whatsappFrom = config?.twilio_whatsapp_from ?? process.env.TWILIO_WHATSAPP_FROM ?? null

  if (!sid || !authToken) {
    throw new MessagingConfigError(
      'missing_credentials',
      'Configura las credenciales de Twilio en Configuración → Integraciones'
    )
  }

  const channelFrom = channel === 'sms' ? smsFrom : whatsappFrom
  if (!channelFrom) {
    throw new MessagingConfigError(
      'missing_credentials',
      channel === 'sms'
        ? 'Configura el número SMS en Configuración → Integraciones'
        : 'Configura el número de WhatsApp en Configuración → Integraciones'
    )
  }

  return new TwilioProvider({ sid, authToken, smsFrom, whatsappFrom })
}

async function buildInfobip(
  config: IntegrationConfig | null,
  adminSupabase: SupabaseClient,
  channel: MessagingChannel
): Promise<InfobipProvider> {
  const apiKey = config?.infobip_api_key
    ? await decryptToken(adminSupabase, config.infobip_api_key)
    : ''

  const baseUrl      = config?.infobip_base_url      ?? ''
  const smsFrom      = config?.infobip_sms_from      ?? null
  const whatsappFrom = config?.infobip_whatsapp_from ?? null

  if (!apiKey || !baseUrl) {
    throw new MessagingConfigError(
      'missing_credentials',
      'Configura las credenciales de Infobip en Configuración → Integraciones'
    )
  }

  const channelFrom = channel === 'sms' ? smsFrom : whatsappFrom
  if (!channelFrom) {
    throw new MessagingConfigError(
      'missing_credentials',
      channel === 'sms'
        ? 'Configura el sender SMS de Infobip en Configuración → Integraciones'
        : 'Configura el sender WhatsApp de Infobip en Configuración → Integraciones'
    )
  }

  return new InfobipProvider({ apiKey, baseUrl, smsFrom, whatsappFrom })
}

/**
 * Look up tenant by inbound WhatsApp recipient. Tries both Twilio and
 * Infobip whatsapp_from columns.
 */
export async function findTenantByInboundWhatsAppNumber(
  supabase: SupabaseClient,
  toNumber: string
): Promise<{
  tenant_id: string
  campaign_id: string | null
  provider: ProviderId
} | null> {
  const stripped = toNumber.replace(/^whatsapp:/, '')
  const prefixed = `whatsapp:${stripped}`

  // Try Twilio columns first
  const { data: twilioRow } = await supabase
    .from('tenant_integrations')
    .select('tenant_id, campaign_id')
    .or(`twilio_whatsapp_from.eq.${stripped},twilio_whatsapp_from.eq.${prefixed}`)
    .limit(1)
    .single()

  if (twilioRow?.tenant_id) {
    return {
      tenant_id:   twilioRow.tenant_id,
      campaign_id: twilioRow.campaign_id ?? null,
      provider:    'twilio',
    }
  }

  // Fall back to Infobip
  const { data: infobipRow } = await supabase
    .from('tenant_integrations')
    .select('tenant_id, campaign_id')
    .eq('infobip_whatsapp_from', stripped)
    .limit(1)
    .single()

  if (infobipRow?.tenant_id) {
    return {
      tenant_id:   infobipRow.tenant_id,
      campaign_id: infobipRow.campaign_id ?? null,
      provider:    'infobip',
    }
  }

  return null
}
