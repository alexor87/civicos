import { createAdminClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/email/send-verification-email'
import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limit: max 1 resend per 60s per email
const COOLDOWN_MS = 60_000
const lastSent = new Map<string, number>()

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const now = Date.now()
  const last = lastSent.get(email)
  if (last && now - last < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
    return NextResponse.json(
      { error: `Espera ${retryAfter} segundos antes de reenviar` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const supabase = await createAdminClient()

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.scrutix.co'
  // Use magiclink: doesn't need the password and, for unconfirmed users, acts
  // as email verification (clicking confirms the email AND signs them in).
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/welcome` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: 'No se pudo generar el link' }, { status: 404 })
  }

  const result = await sendVerificationEmail({
    email,
    actionLink: linkData.properties.action_link,
  })

  if (!result.ok) {
    return NextResponse.json({ error: 'No se pudo enviar el email' }, { status: 500 })
  }

  lastSent.set(email, now)
  return NextResponse.json({ ok: true })
}
