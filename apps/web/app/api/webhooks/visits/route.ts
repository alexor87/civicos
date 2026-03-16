import { NextRequest, NextResponse } from 'next/server'

const TRIGGER_RESULTS = ['no_home', 'follow_up']

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let body: { type: string; record: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.record) {
    return NextResponse.json({ error: 'Invalid payload: record is required' }, { status: 400 })
  }

  if (body.type !== 'UPDATE' || !TRIGGER_RESULTS.includes(body.record.result as string)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/agent-canvass-followup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ record: body.record }),
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Edge Function failed' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
