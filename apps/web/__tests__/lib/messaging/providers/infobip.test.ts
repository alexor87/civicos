import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { InfobipProvider } from '@/lib/messaging/providers/infobip'

const ORIGINAL_FETCH = globalThis.fetch
const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = mockFetch as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('InfobipProvider.sendSMS', () => {
  it('POSTs to /sms/2/text/advanced with the correct body and headers', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {
      messages: [{ messageId: 'msg-1', status: { groupName: 'PENDING' } }],
    }))

    const provider = new InfobipProvider({
      apiKey:  'test-key',
      baseUrl: '55eexx.api.infobip.com',
      smsFrom: 'Scrutix',
    })

    const result = await provider.sendSMS({ to: '+573001234567', body: 'Hola' })
    expect(result).toEqual({ ok: true, providerMessageId: 'msg-1' })

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://55eexx.api.infobip.com/sms/2/text/advanced')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('App test-key')
    expect(init.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(init.body)
    expect(body).toEqual({
      messages: [{
        from: 'Scrutix',
        destinations: [{ to: '+573001234567' }],
        text: 'Hola',
      }],
    })
  })

  it('handles base URL with protocol prefix', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { messages: [{ messageId: 'm' }] }))
    const provider = new InfobipProvider({
      apiKey:  'k',
      baseUrl: 'https://55eexx.api.infobip.com/',
      smsFrom: 'X',
    })
    await provider.sendSMS({ to: '+1', body: 'h' })
    expect(mockFetch.mock.calls[0][0]).toBe('https://55eexx.api.infobip.com/sms/2/text/advanced')
  })

  it('returns Infobip error message when API returns 400', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(400, {
      requestError: {
        serviceException: { messageId: 'BAD_REQUEST', text: 'Invalid phone number' },
      },
    }))

    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com', smsFrom: 'S' })
    const result = await provider.sendSMS({ to: 'bad', body: 'h' })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Invalid phone number')
    expect(result.errorCode).toBe('BAD_REQUEST')
  })

  it('returns error when sender missing', async () => {
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com' })
    const result = await provider.sendSMS({ to: '+1', body: 'h' })
    expect(result.ok).toBe(false)
    expect(result.errorCode).toBe('missing_from')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'))
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com', smsFrom: 'S' })
    const result = await provider.sendSMS({ to: '+1', body: 'h' })
    expect(result).toEqual({ ok: false, error: 'Network down' })
  })
})

describe('InfobipProvider.sendWhatsApp', () => {
  it('POSTs to /whatsapp/1/message/template with placeholders', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {
      messages: [{ messageId: 'wa-1' }],
    }))

    const provider = new InfobipProvider({
      apiKey:       'k',
      baseUrl:      'x.api.infobip.com',
      whatsappFrom: '447860099299',
    })

    const result = await provider.sendWhatsApp({
      to: '+573001234567',
      templateId: 'campana_bogota',
      templateLanguage: 'es',
      templateVariables: { '1': 'María', '2': 'Bogotá' },
    })

    expect(result.ok).toBe(true)
    expect(result.providerMessageId).toBe('wa-1')

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://x.api.infobip.com/whatsapp/1/message/template')
    const body = JSON.parse(init.body)
    expect(body.messages[0].content.templateName).toBe('campana_bogota')
    expect(body.messages[0].content.language).toBe('es')
    expect(body.messages[0].content.templateData.body.placeholders).toEqual(['María', 'Bogotá'])
    expect(body.messages[0].from).toBe('447860099299')
    expect(body.messages[0].to).toBe('+573001234567')
  })

  it('strips whatsapp: prefix from numbers', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { messages: [{ messageId: 'm' }] }))
    const provider = new InfobipProvider({
      apiKey:       'k',
      baseUrl:      'x.api.infobip.com',
      whatsappFrom: 'whatsapp:447860099299',
    })

    await provider.sendWhatsApp({ to: 'whatsapp:+573001234567', templateId: 't' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].from).toBe('447860099299')
    expect(body.messages[0].to).toBe('+573001234567')
  })

  it('POSTs to /whatsapp/1/message/text for free-form body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { messageId: 'wa-text' }))

    const provider = new InfobipProvider({
      apiKey:       'k',
      baseUrl:      'x.api.infobip.com',
      whatsappFrom: '447860099299',
    })

    const result = await provider.sendWhatsApp({ to: '+573001234567', body: 'Hola directo' })
    expect(result.ok).toBe(true)
    expect(result.providerMessageId).toBe('wa-text')

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://x.api.infobip.com/whatsapp/1/message/text')
    const body = JSON.parse(init.body)
    expect(body.content.text).toBe('Hola directo')
  })

  it('returns error when neither template nor body provided', async () => {
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com', whatsappFrom: 'F' })
    const result = await provider.sendWhatsApp({ to: '+1' })
    expect(result.ok).toBe(false)
    expect(result.errorCode).toBe('invalid_payload')
  })
})

describe('InfobipProvider.testConnection', () => {
  it('returns ok when balance endpoint returns 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { balance: 5.0, currency: 'USD' }))
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com' })
    expect(await provider.testConnection()).toEqual({ ok: true })
    expect(mockFetch.mock.calls[0][0]).toBe('https://x.api.infobip.com/account/1/balance')
  })

  it('returns error when API returns 401', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(401, {
      requestError: { serviceException: { text: 'Invalid login details' } },
    }))
    const provider = new InfobipProvider({ apiKey: 'bad', baseUrl: 'x.api.infobip.com' })
    const result = await provider.testConnection()
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Invalid login details')
  })

  it('returns error when missing credentials', async () => {
    const provider = new InfobipProvider({ apiKey: '', baseUrl: '' })
    expect(await provider.testConnection()).toEqual({ ok: false, error: 'Missing Infobip API key' })
  })
})

describe('InfobipProvider.validateInboundSignature', () => {
  it('returns null when no secret configured', () => {
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com' })
    expect(provider.validateInboundSignature('body', 'sig', null)).toBeNull()
  })

  it('returns false when no signature header', () => {
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com' })
    expect(provider.validateInboundSignature('body', null, 'secret')).toBe(false)
  })

  it('returns true on matching HMAC-SHA256', () => {
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com' })
    // Pre-computed HMAC-SHA256 of "hello" with key "secret":
    const expectedSig = '88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b'
    expect(provider.validateInboundSignature('hello', expectedSig, 'secret')).toBe(true)
  })

  it('returns false on mismatched signature', () => {
    const provider = new InfobipProvider({ apiKey: 'k', baseUrl: 'x.api.infobip.com' })
    expect(provider.validateInboundSignature('hello', 'a'.repeat(64), 'secret')).toBe(false)
  })
})
