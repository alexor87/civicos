import { describe, it, expect } from 'vitest'
import { buildResendFrom } from '@/lib/email/build-resend-from'

describe('buildResendFrom', () => {
  it('returns fallback when no domain configured', () => {
    expect(buildResendFrom({})).toBe('noreply@scrutix.app')
    expect(buildResendFrom({}, 'custom@fallback.com')).toBe('custom@fallback.com')
  })

  it('returns fallback when domain is null', () => {
    expect(buildResendFrom({ resend_domain: null })).toBe('noreply@scrutix.app')
  })

  // Custom domain cases
  it('builds from with domain and default prefix', () => {
    expect(buildResendFrom({ resend_domain: 'example.com' })).toBe('noreply@example.com')
  })

  it('builds from with domain and custom prefix', () => {
    expect(buildResendFrom({
      resend_domain: 'example.com',
      resend_from_email: 'contacto',
    })).toBe('contacto@example.com')
  })

  it('builds from with domain, prefix and name', () => {
    expect(buildResendFrom({
      resend_domain: 'example.com',
      resend_from_email: 'info',
      resend_from_name: 'Campaña Juan',
    })).toBe('Campaña Juan <info@example.com>')
  })

  // Full email cases (free Resend tier)
  it('uses full email directly when domain contains @', () => {
    expect(buildResendFrom({
      resend_domain: 'user@gmail.com',
    })).toBe('user@gmail.com')
  })

  it('uses full email with name when domain contains @', () => {
    expect(buildResendFrom({
      resend_domain: 'user@gmail.com',
      resend_from_name: 'Mi Campaña',
    })).toBe('Mi Campaña <user@gmail.com>')
  })

  it('ignores from_email prefix when domain is a full email', () => {
    expect(buildResendFrom({
      resend_domain: 'user@gmail.com',
      resend_from_email: 'contacto',
    })).toBe('user@gmail.com')
  })
})
