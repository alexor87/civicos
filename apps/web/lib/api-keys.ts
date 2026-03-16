import { createHash, randomBytes } from 'crypto'

const PREFIX              = 'cvk_'
const RATE_LIMIT_WINDOW_MS = 60_000  // 1 minute
const RATE_LIMIT_MAX       = 60      // requests per window per key

// ── Key generation ────────────────────────────────────────────────────────────

export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const secret    = randomBytes(24).toString('hex') // 48 hex chars
  const key       = `${PREFIX}${secret}`            // 52 chars total
  const keyHash   = hashKey(key)
  const keyPrefix = key.slice(0, 12)
  return { key, keyHash, keyPrefix }
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// ── Rate limiting (in-memory sliding window) ─────────────────────────────────

interface RateLimitEntry { timestamps: number[] }

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(keyHash: string): { allowed: boolean; remaining: number } {
  const now   = Date.now()
  const entry = rateLimitStore.get(keyHash) ?? { timestamps: [] }

  entry.timestamps = entry.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(keyHash, entry)
    return { allowed: false, remaining: 0 }
  }

  entry.timestamps.push(now)
  rateLimitStore.set(keyHash, entry)
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.timestamps.length }
}

export function resetRateLimit(keyHash: string): void {
  rateLimitStore.delete(keyHash)
}
