import { describe, it, expect } from 'vitest'
import {
  SMS_CHANNEL_ENABLED,
  WHATSAPP_CHANNEL_ENABLED,
  ANY_NON_EMAIL_CHANNEL_ENABLED,
  isChannelEnabled,
} from '@/lib/features/messaging-channels'

describe('messaging-channels feature flags', () => {
  it('email is always enabled', () => {
    expect(isChannelEnabled('email')).toBe(true)
  })

  it('sms reflects SMS_CHANNEL_ENABLED constant', () => {
    expect(isChannelEnabled('sms')).toBe(SMS_CHANNEL_ENABLED)
  })

  it('whatsapp reflects WHATSAPP_CHANNEL_ENABLED constant', () => {
    expect(isChannelEnabled('whatsapp')).toBe(WHATSAPP_CHANNEL_ENABLED)
  })

  it('ANY_NON_EMAIL_CHANNEL_ENABLED matches OR of sms and whatsapp', () => {
    expect(ANY_NON_EMAIL_CHANNEL_ENABLED).toBe(SMS_CHANNEL_ENABLED || WHATSAPP_CHANNEL_ENABLED)
  })

  it('returns false for unknown channel keys', () => {
    // @ts-expect-error testing runtime behavior
    expect(isChannelEnabled('telegram')).toBe(false)
  })
})

describe('messaging-channels current default state (production guard)', () => {
  it('SMS is disabled by default', () => {
    expect(SMS_CHANNEL_ENABLED).toBe(false)
  })

  it('WhatsApp is disabled by default', () => {
    expect(WHATSAPP_CHANNEL_ENABLED).toBe(false)
  })
})
