import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockMessagesCreate, mockAccountsFetch, mockValidateRequest } = vi.hoisted(() => ({
  mockMessagesCreate:  vi.fn(),
  mockAccountsFetch:   vi.fn(),
  mockValidateRequest: vi.fn(),
}))

vi.mock('twilio', () => {
  const factory = vi.fn(() => ({
    messages: { create: mockMessagesCreate },
    api: {
      accounts: vi.fn(() => ({ fetch: mockAccountsFetch })),
    },
  })) as unknown as { (): unknown; validateRequest: typeof mockValidateRequest }
  factory.validateRequest = mockValidateRequest
  return { default: factory }
})

import { TwilioProvider } from '@/lib/messaging/providers/twilio'

beforeEach(() => {
  vi.clearAllMocks()
  mockMessagesCreate.mockResolvedValue({ sid: 'SM_abc' })
  mockAccountsFetch.mockResolvedValue({})
  mockValidateRequest.mockReturnValue(true)
})

describe('TwilioProvider.sendSMS', () => {
  it('sends SMS with config defaults', async () => {
    const provider = new TwilioProvider({
      sid: 'AC123',
      authToken: 'tok',
      smsFrom: '+15550000000',
    })

    const result = await provider.sendSMS({ to: '+573001234567', body: 'Hola' })
    expect(result).toEqual({ ok: true, providerMessageId: 'SM_abc' })
    expect(mockMessagesCreate).toHaveBeenCalledWith({
      from: '+15550000000',
      to:   '+573001234567',
      body: 'Hola',
    })
  })

  it('returns error when no sender configured', async () => {
    const provider = new TwilioProvider({ sid: 'AC123', authToken: 'tok' })

    const result = await provider.sendSMS({ to: '+573001234567', body: 'Hola' })
    expect(result.ok).toBe(false)
    expect(result.errorCode).toBe('missing_from')
  })

  it('returns error when Twilio throws', async () => {
    mockMessagesCreate.mockRejectedValueOnce(Object.assign(new Error('Invalid number'), { code: 21211 }))
    const provider = new TwilioProvider({
      sid: 'AC123',
      authToken: 'tok',
      smsFrom: '+15550000000',
    })

    const result = await provider.sendSMS({ to: 'bad', body: 'Hola' })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Invalid number')
    expect(result.errorCode).toBe('21211')
  })
})

describe('TwilioProvider.sendWhatsApp', () => {
  it('adds whatsapp: prefix to numbers and sends template', async () => {
    const provider = new TwilioProvider({
      sid: 'AC123',
      authToken: 'tok',
      whatsappFrom: '+15550000000',
    })

    const result = await provider.sendWhatsApp({
      to: '+573001234567',
      templateId: 'HX_template_sid',
      templateVariables: { '1': 'Ana', '2': 'Bogotá' },
    })

    expect(result.ok).toBe(true)
    const call = mockMessagesCreate.mock.calls[0][0]
    expect(call.from).toBe('whatsapp:+15550000000')
    expect(call.to).toBe('whatsapp:+573001234567')
    expect(call.contentSid).toBe('HX_template_sid')
    expect(call.contentVariables).toBe('{"1":"Ana","2":"Bogotá"}')
  })

  it('preserves existing whatsapp: prefix', async () => {
    const provider = new TwilioProvider({
      sid: 'AC123',
      authToken: 'tok',
      whatsappFrom: 'whatsapp:+15550000000',
    })

    await provider.sendWhatsApp({ to: 'whatsapp:+573001234567', templateId: 'HX' })

    const call = mockMessagesCreate.mock.calls[0][0]
    expect(call.from).toBe('whatsapp:+15550000000')
    expect(call.to).toBe('whatsapp:+573001234567')
  })

  it('sends free-form body when no template provided', async () => {
    const provider = new TwilioProvider({
      sid: 'AC123',
      authToken: 'tok',
      whatsappFrom: '+15550000000',
    })

    const result = await provider.sendWhatsApp({ to: '+573001234567', body: 'Hola directo' })
    expect(result.ok).toBe(true)
    expect(mockMessagesCreate.mock.calls[0][0].body).toBe('Hola directo')
  })

  it('returns error when neither template nor body provided', async () => {
    const provider = new TwilioProvider({
      sid: 'AC123',
      authToken: 'tok',
      whatsappFrom: '+15550000000',
    })

    const result = await provider.sendWhatsApp({ to: '+573001234567' })
    expect(result.ok).toBe(false)
    expect(result.errorCode).toBe('invalid_payload')
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })
})

describe('TwilioProvider.testConnection', () => {
  it('returns ok when account fetch succeeds', async () => {
    const provider = new TwilioProvider({ sid: 'AC123', authToken: 'tok' })
    expect(await provider.testConnection()).toEqual({ ok: true })
  })

  it('returns error when fetch throws', async () => {
    mockAccountsFetch.mockRejectedValueOnce(new Error('Auth failed'))
    const provider = new TwilioProvider({ sid: 'AC123', authToken: 'tok' })
    expect(await provider.testConnection()).toEqual({ ok: false, error: 'Auth failed' })
  })

  it('returns error when credentials missing', async () => {
    const provider = new TwilioProvider({ sid: '', authToken: '' })
    expect(await provider.testConnection()).toEqual({
      ok: false,
      error: 'Missing Twilio credentials',
    })
  })
})

describe('TwilioProvider.validateInboundSignature', () => {
  it('returns null when no auth token configured', () => {
    const provider = new TwilioProvider({ sid: 'AC123', authToken: '' })
    expect(provider.validateInboundSignature('sig', 'https://x', {})).toBeNull()
  })

  it('returns false when no signature header', () => {
    const provider = new TwilioProvider({ sid: 'AC123', authToken: 'tok' })
    expect(provider.validateInboundSignature(null, 'https://x', {})).toBe(false)
  })

  it('delegates to twilio.validateRequest when both present', () => {
    const provider = new TwilioProvider({ sid: 'AC123', authToken: 'tok' })
    mockValidateRequest.mockReturnValueOnce(true)
    expect(provider.validateInboundSignature('sig', 'https://x', { a: '1' })).toBe(true)
    expect(mockValidateRequest).toHaveBeenCalledWith('tok', 'sig', 'https://x', { a: '1' })
  })
})
