import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkAgentRateLimit, resetAgentRateLimit } from '@/lib/agent-rate-limit'

const TENANT  = 'tenant-1'
const AGENT   = 'agent-smart-comms'
const TENANT2 = 'tenant-2'
const AGENT2  = 'agent-campaign-monitor'

beforeEach(() => {
  resetAgentRateLimit(TENANT, AGENT)
  resetAgentRateLimit(TENANT2, AGENT)
  resetAgentRateLimit(TENANT, AGENT2)
})

describe('checkAgentRateLimit', () => {
  it('allows first call and returns correct remaining count', () => {
    const result = checkAgentRateLimit(TENANT, AGENT)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
    expect(result.retryAfterMs).toBe(0)
  })

  it('allows up to 10 calls within the window', () => {
    for (let i = 0; i < 10; i++) {
      const r = checkAgentRateLimit(TENANT, AGENT)
      expect(r.allowed).toBe(true)
    }
  })

  it('blocks the 11th call and returns retryAfterMs > 0', () => {
    for (let i = 0; i < 10; i++) checkAgentRateLimit(TENANT, AGENT)
    const result = checkAgentRateLimit(TENANT, AGENT)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('isolates limits by tenant — different tenants are independent', () => {
    for (let i = 0; i < 10; i++) checkAgentRateLimit(TENANT, AGENT)
    // TENANT is blocked
    expect(checkAgentRateLimit(TENANT, AGENT).allowed).toBe(false)
    // TENANT2 with same agent is still allowed
    expect(checkAgentRateLimit(TENANT2, AGENT).allowed).toBe(true)
  })

  it('isolates limits by agent — same tenant, different agents are independent', () => {
    for (let i = 0; i < 10; i++) checkAgentRateLimit(TENANT, AGENT)
    expect(checkAgentRateLimit(TENANT, AGENT).allowed).toBe(false)
    expect(checkAgentRateLimit(TENANT, AGENT2).allowed).toBe(true)
  })

  it('slides the window — old timestamps expire and allow new calls', () => {
    vi.useFakeTimers()
    for (let i = 0; i < 10; i++) checkAgentRateLimit(TENANT, AGENT)
    expect(checkAgentRateLimit(TENANT, AGENT).allowed).toBe(false)

    // Advance 1 hour + 1 ms → all timestamps expire
    vi.advanceTimersByTime(60 * 60_000 + 1)
    expect(checkAgentRateLimit(TENANT, AGENT).allowed).toBe(true)
    vi.useRealTimers()
  })

  it('resetAgentRateLimit clears the counter', () => {
    for (let i = 0; i < 10; i++) checkAgentRateLimit(TENANT, AGENT)
    expect(checkAgentRateLimit(TENANT, AGENT).allowed).toBe(false)
    resetAgentRateLimit(TENANT, AGENT)
    expect(checkAgentRateLimit(TENANT, AGENT).allowed).toBe(true)
  })
})
