import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/admin'

const EVENT_MAP: Record<string, { statusName: string; tsColumn: string; countColumn: string }> = {
  'email.delivered':  { statusName: 'delivered',  tsColumn: 'delivered_at', countColumn: 'delivered_count' },
  'email.opened':     { statusName: 'opened',     tsColumn: 'opened_at',   countColumn: 'opened_count' },
  'email.clicked':    { statusName: 'clicked',    tsColumn: 'clicked_at',  countColumn: 'clicked_count' },
  'email.bounced':    { statusName: 'bounced',    tsColumn: 'bounced_at',  countColumn: 'bounced_count' },
  'email.complained': { statusName: 'complained', tsColumn: 'bounced_at',  countColumn: 'bounced_count' },
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const svixId = request.headers.get('svix-id') ?? ''
  const svixTimestamp = request.headers.get('svix-timestamp') ?? ''
  const svixSignature = request.headers.get('svix-signature') ?? ''

  let payload: { type: string; data: { email_id: string } }
  try {
    const wh = new Webhook(secret)
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof payload
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const eventType = payload.type
  const resendEmailId = payload.data?.email_id
  const mapping = EVENT_MAP[eventType]

  if (!mapping || !resendEmailId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createAdminClient()

  // Find the recipient row
  const { data: recipient } = await supabase
    .from('email_campaign_recipients')
    .select('id, email_campaign_id, delivered_at, opened_at, clicked_at, bounced_at')
    .eq('resend_email_id', resendEmailId)
    .single()

  if (!recipient) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const tsKey = mapping.tsColumn as keyof Pick<typeof recipient, 'delivered_at' | 'opened_at' | 'clicked_at' | 'bounced_at'>
  const alreadyTracked = recipient[tsKey] !== null
  const now = new Date().toISOString()

  // Update recipient row (keep first timestamp, update status)
  await supabase
    .from('email_campaign_recipients')
    .update({
      status: mapping.statusName,
      [mapping.tsColumn]: recipient[tsKey] ?? now,
    })
    .eq('id', recipient.id)

  // Increment campaign counter only on first occurrence
  if (!alreadyTracked) {
    await supabase.rpc('increment_email_campaign_counter', {
      p_campaign_id: recipient.email_campaign_id,
      p_column: mapping.countColumn,
    })
  }

  return NextResponse.json({ ok: true })
}
