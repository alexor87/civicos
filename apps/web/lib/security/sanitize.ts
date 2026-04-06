/**
 * Security helpers for input sanitization.
 * Use these functions before interpolating user data into AI prompts,
 * storing in DB, or rendering as HTML.
 */

// ── Prompt injection prevention ───────────────────────────────────────────────

/**
 * Sanitize a user-provided string before inserting into an AI prompt.
 * Strips characters that could be used for prompt injection.
 */
export function sanitizeForPrompt(text: string | null | undefined, maxLen = 500): string {
  if (!text) return ''
  return String(text)
    .replace(/[<>]/g, '')                  // strip HTML-like angle brackets
    .replace(/\{[^}]{0,100}\}/g, '')       // strip template vars like {variable}
    .replace(/\[INST\]|\[\/INST\]/gi, '')  // strip LLM instruction tokens
    .replace(/###\s*(system|human|assistant)/gi, '') // strip role markers
    .slice(0, maxLen)
    .trim()
}

/**
 * Sanitize an array of user-provided strings (e.g. tags).
 */
export function sanitizeTagsForPrompt(tags: string[] | null | undefined, maxTags = 10): string {
  if (!tags?.length) return 'ninguno'
  return tags
    .slice(0, maxTags)
    .map(t => sanitizeForPrompt(t, 50))
    .filter(Boolean)
    .join(', ') || 'ninguno'
}

// ── Text length limits ────────────────────────────────────────────────────────

export const FIELD_LIMITS = {
  name:     100,
  email:    254,
  phone:    20,
  short:    200,
  medium:   500,
  notes:    3_000,
  url:      2_000,
} as const

/**
 * Truncate a string to a maximum length. Returns null if empty/null.
 */
export function truncate(value: unknown, maxLen: number): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value).slice(0, maxLen) || null
}

// ── Input validation ──────────────────────────────────────────────────────────

export const VALID_CONTACT_STATUSES = ['supporter', 'undecided', 'opponent', 'unknown'] as const
export type ContactStatus = typeof VALID_CONTACT_STATUSES[number]

export function isValidContactStatus(s: unknown): s is ContactStatus {
  return VALID_CONTACT_STATUSES.includes(s as ContactStatus)
}

const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/

export function isValidDomain(domain: unknown): boolean {
  if (typeof domain !== 'string') return false
  return DOMAIN_REGEX.test(domain)
}

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
