import crypto from 'crypto'
import type {
  InfobipConfig,
  MessagingProvider,
  ProviderId,
  SendResult,
  SendSMSParams,
  SendWhatsAppParams,
  TestConnectionResult,
} from '../types'

function normalizeBaseUrl(raw: string): string {
  let u = raw.trim()
  if (!u) return u
  // accept "55eexx.api.infobip.com" or "https://55eexx.api.infobip.com"
  if (!u.startsWith('http')) u = `https://${u}`
  return u.replace(/\/+$/, '')
}

function stripWhatsAppPrefix(num: string): string {
  return num.replace(/^whatsapp:/i, '')
}

interface InfobipErrorBody {
  requestError?: {
    serviceException?: {
      messageId?: string
      text?: string
    }
  }
}

interface InfobipSmsResponse {
  messages?: Array<{ messageId?: string; status?: { groupName?: string; description?: string } }>
}

interface InfobipWhatsAppResponse {
  messageId?: string
  status?: { groupName?: string; description?: string }
}

async function parseInfobipError(res: Response): Promise<{ error: string; code: string }> {
  const status = String(res.status)
  try {
    const body = (await res.json()) as InfobipErrorBody
    const exc  = body.requestError?.serviceException
    const text = exc?.text || `HTTP ${status}`
    const code = exc?.messageId || status
    return { error: text, code }
  } catch {
    return { error: `HTTP ${status}`, code: status }
  }
}

export class InfobipProvider implements MessagingProvider {
  readonly id: ProviderId = 'infobip'
  private readonly config: InfobipConfig
  private readonly baseUrl: string

  constructor(config: InfobipConfig) {
    this.config = config
    this.baseUrl = normalizeBaseUrl(config.baseUrl)
  }

  private headers(): Record<string, string> {
    return {
      Authorization:  `App ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    }
  }

  async sendSMS(params: SendSMSParams): Promise<SendResult> {
    const from = params.from ?? this.config.smsFrom ?? ''
    if (!from) return { ok: false, error: 'Missing SMS sender', errorCode: 'missing_from' }
    if (!this.baseUrl) return { ok: false, error: 'Missing Infobip base URL', errorCode: 'missing_base_url' }

    try {
      const res = await fetch(`${this.baseUrl}/sms/2/text/advanced`, {
        method:  'POST',
        headers: this.headers(),
        body: JSON.stringify({
          messages: [{
            from,
            destinations: [{ to: stripWhatsAppPrefix(params.to) }],
            text: params.body,
          }],
        }),
      })

      if (!res.ok) {
        const { error, code } = await parseInfobipError(res)
        return { ok: false, error, errorCode: code }
      }

      const body = (await res.json()) as InfobipSmsResponse
      const msg  = body.messages?.[0]
      return { ok: true, providerMessageId: msg?.messageId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Infobip error'
      return { ok: false, error: message }
    }
  }

  async sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult> {
    const from = params.from ?? this.config.whatsappFrom ?? ''
    if (!from) return { ok: false, error: 'Missing WhatsApp sender', errorCode: 'missing_from' }
    if (!this.baseUrl) return { ok: false, error: 'Missing Infobip base URL', errorCode: 'missing_base_url' }

    const fromNum = stripWhatsAppPrefix(from)
    const toNum   = stripWhatsAppPrefix(params.to)

    let url: string
    let payload: Record<string, unknown>

    if (params.templateId) {
      url = `${this.baseUrl}/whatsapp/1/message/template`
      const placeholders = params.templateVariables
        ? Object.keys(params.templateVariables)
            .sort((a, b) => Number(a) - Number(b))
            .map(k => params.templateVariables![k])
        : []
      payload = {
        messages: [{
          from: fromNum,
          to:   toNum,
          content: {
            templateName: params.templateId,
            templateData: { body: { placeholders } },
            language:     params.templateLanguage ?? 'es',
          },
        }],
      }
    } else if (params.body) {
      url = `${this.baseUrl}/whatsapp/1/message/text`
      payload = {
        from:    fromNum,
        to:      toNum,
        content: { text: params.body },
      }
    } else {
      return {
        ok: false,
        error: 'WhatsApp send requires templateId or body',
        errorCode: 'invalid_payload',
      }
    }

    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: this.headers(),
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error, code } = await parseInfobipError(res)
        return { ok: false, error, errorCode: code }
      }

      const body = (await res.json()) as InfobipWhatsAppResponse | { messages: InfobipWhatsAppResponse[] }
      const messageId =
        ('messages' in body && Array.isArray(body.messages))
          ? body.messages[0]?.messageId
          : (body as InfobipWhatsAppResponse).messageId
      return { ok: true, providerMessageId: messageId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Infobip error'
      return { ok: false, error: message }
    }
  }

  /**
   * Pings a lightweight Infobip endpoint to verify credentials work.
   * Uses /account/1/balance which requires only API key.
   */
  async testConnection(): Promise<TestConnectionResult> {
    if (!this.config.apiKey) return { ok: false, error: 'Missing Infobip API key' }
    if (!this.baseUrl)        return { ok: false, error: 'Missing Infobip base URL' }

    try {
      const res = await fetch(`${this.baseUrl}/account/1/balance`, {
        method:  'GET',
        headers: this.headers(),
      })
      if (!res.ok) {
        const { error } = await parseInfobipError(res)
        return { ok: false, error }
      }
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Infobip error'
      return { ok: false, error: message }
    }
  }

  /**
   * Verify Infobip inbound webhook signature.
   * Infobip signs the raw request body with HMAC-SHA256 using a webhook
   * secret configured on their dashboard. The signature comes in either
   * `X-Signature` (hex) or `X-Signature-Sha256` header depending on setup.
   *
   * Returns null if no secret is configured (caller decides), false on
   * invalid signature, true on valid.
   */
  validateInboundSignature(
    rawBody: string,
    signatureHeader: string | null,
    webhookSecret: string | null
  ): boolean | null {
    if (!webhookSecret) return null
    if (!signatureHeader) return false

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    // timing-safe comparison
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(signatureHeader, 'utf8')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  }
}
