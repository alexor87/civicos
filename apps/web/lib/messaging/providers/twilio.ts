import twilio from 'twilio'
import type {
  MessagingProvider,
  ProviderId,
  SendResult,
  SendSMSParams,
  SendWhatsAppParams,
  TestConnectionResult,
  TwilioConfig,
} from '../types'

function ensureWhatsAppPrefix(num: string): string {
  return num.startsWith('whatsapp:') ? num : `whatsapp:${num}`
}

export class TwilioProvider implements MessagingProvider {
  readonly id: ProviderId = 'twilio'
  private readonly config: TwilioConfig
  private client: ReturnType<typeof twilio> | null = null

  constructor(config: TwilioConfig) {
    this.config = config
  }

  private getClient(): ReturnType<typeof twilio> {
    if (!this.client) this.client = twilio(this.config.sid, this.config.authToken)
    return this.client
  }

  async sendSMS(params: SendSMSParams): Promise<SendResult> {
    const from = params.from ?? this.config.smsFrom ?? ''
    if (!from) {
      return { ok: false, error: 'Missing SMS sender number', errorCode: 'missing_from' }
    }

    try {
      const msg = await this.getClient().messages.create({
        from,
        to:   params.to,
        body: params.body,
      })
      return { ok: true, providerMessageId: msg.sid }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Twilio error'
      const code    = (err as { code?: string | number })?.code
      return {
        ok: false,
        error: message,
        errorCode: code != null ? String(code) : undefined,
      }
    }
  }

  async sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult> {
    const fromRaw = params.from ?? this.config.whatsappFrom ?? ''
    if (!fromRaw) {
      return { ok: false, error: 'Missing WhatsApp sender number', errorCode: 'missing_from' }
    }

    const from = ensureWhatsAppPrefix(fromRaw)
    const to   = ensureWhatsAppPrefix(params.to)

    try {
      // Twilio template send uses contentSid + contentVariables JSON.
      // For free-form session messages we accept body.
      const payload: Record<string, unknown> = { from, to }

      if (params.templateId) {
        payload.contentSid = params.templateId
        if (params.templateVariables) {
          payload.contentVariables = JSON.stringify(params.templateVariables)
        }
      } else if (params.body) {
        payload.body = params.body
      } else {
        return {
          ok: false,
          error: 'WhatsApp send requires templateId or body',
          errorCode: 'invalid_payload',
        }
      }

      const msg = await this.getClient().messages.create(payload as Parameters<ReturnType<typeof twilio>['messages']['create']>[0])
      return { ok: true, providerMessageId: msg.sid }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Twilio error'
      const code    = (err as { code?: string | number })?.code
      return {
        ok: false,
        error: message,
        errorCode: code != null ? String(code) : undefined,
      }
    }
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.config.sid || !this.config.authToken) {
      return { ok: false, error: 'Missing Twilio credentials' }
    }
    try {
      // Lightweight call: fetch the account itself.
      await this.getClient().api.accounts(this.config.sid).fetch()
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Twilio error'
      return { ok: false, error: message }
    }
  }

  /**
   * Validate an inbound Twilio webhook signature.
   * Returns true if the request is authentic, false if not, or null when no
   * auth token is configured (caller decides whether to reject).
   */
  validateInboundSignature(
    signatureHeader: string | null,
    requestUrl: string,
    formParams: Record<string, string>
  ): boolean | null {
    if (!this.config.authToken) return null
    if (!signatureHeader) return false
    return twilio.validateRequest(this.config.authToken, signatureHeader, requestUrl, formParams)
  }
}
