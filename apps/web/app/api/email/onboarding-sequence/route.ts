import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendOnboardingEmail, type OnboardingStep } from '@/lib/email/onboarding-sequence'

/**
 * POST /api/email/onboarding-sequence
 *
 * Cron endpoint — processes pending drip emails from email_sequence_queue.
 * Called by Vercel Cron or an external scheduler (e.g. daily at 9am).
 *
 * Auth: requires CRON_SECRET header to match env var.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const provided = request.headers.get('x-cron-secret')
    if (!provided || provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.scrutix.co'

  // Fetch pending drip recipients from the queue view
  const { data: queue, error: queueError } = await supabase
    .from('email_sequence_queue')
    .select('tenant_id, user_id, email, next_step')

  if (queueError) {
    console.error('[onboarding-sequence] queue fetch error:', queueError.message)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }

  if (!queue || queue.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Fetch tenant names for personalisation
  const tenantIds = [...new Set(queue.map((r) => r.tenant_id as string))]
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .in('id', tenantIds)

  const tenantNameMap = new Map<string, string>(
    (tenants ?? []).map((t: { id: string; name: string }) => [t.id, t.name])
  )

  const results = await Promise.allSettled(
    queue.map(async (row) => {
      const step = row.next_step as OnboardingStep
      const result = await sendOnboardingEmail({
        step,
        email: row.email as string,
        tenantId: row.tenant_id as string,
        orgName: tenantNameMap.get(row.tenant_id as string),
        appUrl,
      })

      if (!result.ok) {
        throw new Error(`[${row.tenant_id}] ${step}: ${result.error}`)
      }

      // Record that we sent this step
      const { error: insertError } = await supabase.from('email_sequence_state').insert({
        tenant_id: row.tenant_id,
        user_id: row.user_id,
        email: row.email,
        step,
      })

      if (insertError) {
        // Unique constraint violation means already sent — not a hard error
        if (!insertError.message.includes('unique')) {
          throw new Error(`[${row.tenant_id}] insert error: ${insertError.message}`)
        }
      }

      return { tenant_id: row.tenant_id, step }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message ?? 'unknown error')

  if (errors.length > 0) {
    console.error('[onboarding-sequence] send errors:', errors)
  }

  return NextResponse.json({ ok: true, sent, errors })
}
