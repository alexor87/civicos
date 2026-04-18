/**
 * Builds the "from" address for Resend emails.
 * Supports both custom domains (e.g. "tucampaña.com") and
 * full email addresses (e.g. "user@gmail.com") in resend_domain.
 */
export function buildResendFrom(config: {
  resend_domain?: string | null
  resend_from_name?: string | null
  resend_from_email?: string | null
}, fallback?: string): string {
  const domain = config.resend_domain
  if (!domain) return fallback ?? 'noreply@scrutix.app'

  // If domain contains @, it's a full email address (e.g. free Resend tier)
  const isFullEmail = domain.includes('@')
  const email = isFullEmail
    ? domain
    : `${config.resend_from_email || 'noreply'}@${domain}`

  return config.resend_from_name
    ? `${config.resend_from_name} <${email}>`
    : email
}
