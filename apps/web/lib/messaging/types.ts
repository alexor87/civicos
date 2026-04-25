export type MessagingChannel = 'sms' | 'whatsapp'
export type ProviderId = 'twilio' | 'infobip'

export const PROVIDER_IDS: ProviderId[] = ['twilio', 'infobip']

export interface SendSMSParams {
  to: string         // E.164
  body: string
  from?: string      // optional override; defaults to provider's tenant config
}

export interface SendWhatsAppParams {
  to: string         // E.164 (no whatsapp: prefix; provider adapter normalizes)
  templateId?: string                      // contentSid (Twilio) or templateName (Infobip)
  templateLanguage?: string                // e.g. "es"
  templateVariables?: Record<string, string>
  body?: string                            // free-form session message (24h window)
  from?: string                            // optional override
}

export interface SendResult {
  ok: boolean
  providerMessageId?: string
  error?: string
  errorCode?: string
}

export interface TestConnectionResult {
  ok: boolean
  error?: string
}

/**
 * Adapter contract every messaging provider implements.
 * Channel selection (sms vs whatsapp) happens at call site;
 * the dispatcher decides which provider to instantiate.
 */
export interface MessagingProvider {
  readonly id: ProviderId
  sendSMS(params: SendSMSParams): Promise<SendResult>
  sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult>
  testConnection(): Promise<TestConnectionResult>
}

/**
 * Tenant-level config consumed by the dispatcher to instantiate a provider.
 * Source: tenant_integrations row (decrypted).
 */
export interface TwilioConfig {
  sid: string
  authToken: string
  smsFrom?: string | null
  whatsappFrom?: string | null
}

export interface InfobipConfig {
  apiKey: string
  baseUrl: string             // e.g. "55eexx.api.infobip.com" (no protocol)
  smsFrom?: string | null     // sender ID or number
  whatsappFrom?: string | null
}

export type ProviderConfig =
  | { provider: 'twilio'; config: TwilioConfig }
  | { provider: 'infobip'; config: InfobipConfig }

export class MessagingConfigError extends Error {
  readonly code: 'missing_credentials' | 'unknown_provider' | 'invalid_config'
  constructor(code: MessagingConfigError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'MessagingConfigError'
  }
}
