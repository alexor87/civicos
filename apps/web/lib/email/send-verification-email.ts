import { sendVerificationEmail as sendVerification } from './transactional'

type SendResult = { ok: true } | { ok: false; error: string }

/**
 * Back-compat wrapper. New callers should import `sendVerificationEmail`
 * directly from `@/lib/email/transactional`.
 */
export async function sendVerificationEmail({
  email,
  actionLink,
}: {
  email: string
  actionLink: string
}): Promise<SendResult> {
  const result = await sendVerification({ to: email, actionLink })
  if (result.ok) return { ok: true }
  return { ok: false, error: result.error }
}
