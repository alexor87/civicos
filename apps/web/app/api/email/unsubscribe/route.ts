import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/email/onboarding-sequence'

/**
 * GET /api/email/unsubscribe?tid=<tenantId>&token=<hmacToken>
 *
 * CAN-SPAM compliant one-click unsubscribe for onboarding sequence emails.
 * Records unsubscribe in email_sequence_unsubscribes and redirects to a
 * confirmation page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tid')
  const token = searchParams.get('token')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.scrutix.co'

  if (!tenantId || !token) {
    return NextResponse.redirect(`${appUrl}/unsubscribed?error=invalid`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.redirect(`${appUrl}/unsubscribed?error=server`)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Fetch the email for this tenant from sequence state
  const { data: sequenceRow } = await supabase
    .from('email_sequence_state')
    .select('email')
    .eq('tenant_id', tenantId)
    .limit(1)
    .single()

  const email = sequenceRow?.email
  if (!email) {
    return NextResponse.redirect(`${appUrl}/unsubscribed?error=notfound`)
  }

  if (!verifyUnsubscribeToken(tenantId, email, token)) {
    return NextResponse.redirect(`${appUrl}/unsubscribed?error=invalid`)
  }

  // Upsert unsubscribe record (idempotent)
  await supabase.from('email_sequence_unsubscribes').upsert(
    { tenant_id: tenantId, email },
    { onConflict: 'tenant_id' }
  )

  return NextResponse.redirect(`${appUrl}/unsubscribed?success=1`)
}
