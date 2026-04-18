import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/normalize-phone'

describe('normalizePhone', () => {
  it('returns 12-digit number starting with 57 as-is', () => {
    expect(normalizePhone('573001234567')).toBe('573001234567')
  })

  it('prepends 57 to 10-digit number starting with 3', () => {
    expect(normalizePhone('3001234567')).toBe('573001234567')
  })

  it('strips non-digit characters', () => {
    expect(normalizePhone('+57 300 123 4567')).toBe('573001234567')
    expect(normalizePhone('(300) 123-4567')).toBe('573001234567')
  })

  it('handles number with country code and special chars', () => {
    expect(normalizePhone('+57-300-123-4567')).toBe('573001234567')
  })

  it('returns cleaned digits for non-Colombian numbers', () => {
    expect(normalizePhone('12025551234')).toBe('12025551234')
  })

  it('handles empty string', () => {
    expect(normalizePhone('')).toBe('')
  })

  it('handles short numbers', () => {
    expect(normalizePhone('123')).toBe('123')
  })

  it('does not prepend 57 to 10-digit not starting with 3', () => {
    expect(normalizePhone('1234567890')).toBe('1234567890')
  })
})
