import { describe, it, expect, beforeEach } from 'vitest'
import { generateApiKey, hashKey, checkRateLimit, resetRateLimit } from '@/lib/api-keys'

describe('generateApiKey', () => {
  it('key starts with cvk_', () => {
    const { key } = generateApiKey()
    expect(key).toMatch(/^cvk_/)
  })

  it('keyPrefix is first 12 chars of key', () => {
    const { key, keyPrefix } = generateApiKey()
    expect(keyPrefix).toBe(key.slice(0, 12))
  })

  it('keyHash is SHA-256 of key', () => {
    const { key, keyHash } = generateApiKey()
    expect(keyHash).toBe(hashKey(key))
  })

  it('generates unique keys', () => {
    const keys = Array.from({ length: 10 }, () => generateApiKey().key)
    expect(new Set(keys).size).toBe(10)
  })

  it('key has expected length (cvk_ + 48 hex chars)', () => {
    const { key } = generateApiKey()
    expect(key).toHaveLength(52) // 4 + 48
  })

  it('keyHash is 64 hex chars (SHA-256)', () => {
    const { keyHash } = generateApiKey()
    expect(keyHash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('hashKey', () => {
  it('is deterministic', () => {
    const key = 'cvk_test123'
    expect(hashKey(key)).toBe(hashKey(key))
  })

  it('different keys produce different hashes', () => {
    expect(hashKey('cvk_aaaa')).not.toBe(hashKey('cvk_bbbb'))
  })
})

describe('checkRateLimit', () => {
  const KEY = 'test-hash-abc'

  beforeEach(() => resetRateLimit(KEY))

  it('allows first request', () => {
    const result = checkRateLimit(KEY)
    expect(result.allowed).toBe(true)
  })

  it('remaining decreases with each request', () => {
    const r1 = checkRateLimit(KEY)
    const r2 = checkRateLimit(KEY)
    expect(r2.remaining).toBe(r1.remaining - 1)
  })

  it('blocks requests after limit is reached', () => {
    for (let i = 0; i < 60; i++) checkRateLimit(KEY)
    const result = checkRateLimit(KEY)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('different keys have independent limits', () => {
    const KEY2 = 'test-hash-xyz'
    resetRateLimit(KEY2)
    for (let i = 0; i < 60; i++) checkRateLimit(KEY)
    const r1 = checkRateLimit(KEY)
    const r2 = checkRateLimit(KEY2)
    expect(r1.allowed).toBe(false)
    expect(r2.allowed).toBe(true)
    resetRateLimit(KEY2)
  })
})
