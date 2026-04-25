import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockGetIntegrationConfig = vi.fn()

vi.mock('@/lib/get-integration-config', () => ({
  getIntegrationConfig: (...args: unknown[]) => mockGetIntegrationConfig(...args),
}))

vi.mock('twilio', () => {
  const factory = vi.fn(() => ({
    messages: { create: vi.fn() },
    api: { accounts: vi.fn(() => ({ fetch: vi.fn() })) },
  })) as unknown as { (): unknown; validateRequest: ReturnType<typeof vi.fn> }
  factory.validateRequest = vi.fn()
  return { default: factory }
})

import { getMessagingProvider } from '@/lib/messaging/dispatcher'
import { MessagingConfigError } from '@/lib/messaging/types'
import { TwilioProvider } from '@/lib/messaging/providers/twilio'

const ORIGINAL_ENV = process.env

function makeAdmin(decryptResult?: string | null) {
  return {
    rpc: vi.fn(async () => ({ data: decryptResult ?? null })),
  } as never
}

function makeSupabase() {
  return {} as never
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...ORIGINAL_ENV }
  delete process.env.TWILIO_AUTH_TOKEN
  delete process.env.TWILIO_ACCOUNT_SID
  delete process.env.TWILIO_FROM_NUMBER
  delete process.env.TWILIO_WHATSAPP_FROM
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

describe('getMessagingProvider — Twilio', () => {
  it('returns TwilioProvider with decrypted token from DB config', async () => {
    mockGetIntegrationConfig.mockResolvedValue({
      twilio_sid:           'AC123',
      twilio_token:         'encrypted_blob',
      twilio_from:          '+15550000000',
      twilio_whatsapp_from: '+15551111111',
    })

    const provider = await getMessagingProvider(
      makeSupabase(),
      makeAdmin('decrypted-token'),
      't1',
      'c1',
      'sms'
    )

    expect(provider).toBeInstanceOf(TwilioProvider)
    expect(provider.id).toBe('twilio')
  })

  it('falls back to env vars when DB config is null', async () => {
    mockGetIntegrationConfig.mockResolvedValue(null)
    process.env.TWILIO_ACCOUNT_SID = 'AC_env'
    process.env.TWILIO_AUTH_TOKEN  = 'tok_env'
    process.env.TWILIO_FROM_NUMBER = '+15550000000'

    const provider = await getMessagingProvider(
      makeSupabase(),
      makeAdmin(),
      't1',
      'c1',
      'sms'
    )
    expect(provider).toBeInstanceOf(TwilioProvider)
  })

  it('throws MessagingConfigError when SID/token missing', async () => {
    mockGetIntegrationConfig.mockResolvedValue(null)

    await expect(
      getMessagingProvider(makeSupabase(), makeAdmin(), 't1', 'c1', 'sms')
    ).rejects.toThrow(MessagingConfigError)
  })

  it('throws when channel-specific sender missing (sms)', async () => {
    mockGetIntegrationConfig.mockResolvedValue({
      twilio_sid:   'AC123',
      twilio_token: 'plain-token',
      twilio_from:  null,
      twilio_whatsapp_from: '+15551111111',
    })

    let thrown: unknown
    try {
      await getMessagingProvider(
        makeSupabase(),
        makeAdmin(null),
        't1',
        'c1',
        'sms'
      )
    } catch (err) { thrown = err }

    expect(thrown).toBeInstanceOf(MessagingConfigError)
    expect((thrown as MessagingConfigError).code).toBe('missing_credentials')
  })

  it('throws when channel-specific sender missing (whatsapp)', async () => {
    mockGetIntegrationConfig.mockResolvedValue({
      twilio_sid:   'AC123',
      twilio_token: 'plain-token',
      twilio_from:  '+15550000000',
      twilio_whatsapp_from: null,
    })

    await expect(
      getMessagingProvider(makeSupabase(), makeAdmin(null), 't1', 'c1', 'whatsapp')
    ).rejects.toThrow(/WhatsApp/i)
  })

  it('uses plain-text token when decrypt RPC returns null', async () => {
    mockGetIntegrationConfig.mockResolvedValue({
      twilio_sid:   'AC123',
      twilio_token: 'plain-fallback-token',
      twilio_from:  '+15550000000',
      twilio_whatsapp_from: null,
    })

    const provider = await getMessagingProvider(
      makeSupabase(),
      makeAdmin(null),
      't1',
      'c1',
      'sms'
    )
    expect(provider).toBeInstanceOf(TwilioProvider)
  })
})
