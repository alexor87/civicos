// Sliding-window in-memory rate limiter for manual AI agent triggers.
// Cron-triggered runs bypass this entirely.
//
// Limits: 10 manual triggers per campaign per agent per hour.

const WINDOW_MS = 60 * 60_000 // 1 hour
const MAX_CALLS = 10

interface Entry { timestamps: number[] }

const store = new Map<string, Entry>()

export function checkAgentRateLimit(
  tenantId: string,
  agentId: string,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const key   = `${tenantId}:${agentId}`
  const now   = Date.now()
  const entry = store.get(key) ?? { timestamps: [] }

  entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS)

  if (entry.timestamps.length >= MAX_CALLS) {
    const oldestMs    = entry.timestamps[0]
    const retryAfterMs = WINDOW_MS - (now - oldestMs)
    store.set(key, entry)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return { allowed: true, remaining: MAX_CALLS - entry.timestamps.length, retryAfterMs: 0 }
}

export function resetAgentRateLimit(tenantId: string, agentId: string): void {
  store.delete(`${tenantId}:${agentId}`)
}
