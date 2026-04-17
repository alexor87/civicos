import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope } from '@/lib/validate-api-key'
import { truncate, FIELD_LIMITS, isValidContactStatus } from '@/lib/security/sanitize'

// ── GET — List contacts ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const auth = await validateApiKey(req, supabase)
  if ('error' in auth) return auth.error

  const { ctx } = auth
  if (!hasScope(ctx, 'contacts:read')) {
    return NextResponse.json({ error: 'Forbidden: missing contacts:read scope' }, { status: 403 })
  }

  const url      = new URL(req.url)
  const page     = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const per_page = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') ?? '50', 10)))
  const from     = (page - 1) * per_page
  const to       = from + per_page - 1

  const { data, count } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, status, tags, created_at', { count: 'exact' })
    .eq('campaign_id', ctx.campaignId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  return NextResponse.json({
    data:     data ?? [],
    total:    count ?? 0,
    page,
    per_page,
  })
}

// ── POST — Create contact ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const auth = await validateApiKey(req, supabase)
  if ('error' in auth) return auth.error

  const { ctx } = auth
  if (!hasScope(ctx, 'contacts:write')) {
    return NextResponse.json({ error: 'Forbidden: missing contacts:write scope' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  // Validate required fields
  const firstName = truncate(body.first_name, FIELD_LIMITS.name)
  const lastName  = truncate(body.last_name,  FIELD_LIMITS.name)
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 422 })
  }

  // I-9: resolve tenant_id from campaign — required by RLS and stats triggers
  const { data: campaign } = await supabase
    .from('campaigns').select('tenant_id').eq('id', ctx.campaignId).single()

  // Allowlist fields — no mass assignment
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      campaign_id:     ctx.campaignId,
      tenant_id:       campaign?.tenant_id,
      first_name:      firstName,
      last_name:       lastName,
      email:           truncate(body.email,   FIELD_LIMITS.email),
      phone:           truncate(body.phone,   FIELD_LIMITS.phone),
      document_number: truncate(body.document_number, FIELD_LIMITS.short),
      address:         truncate(body.address, FIELD_LIMITS.medium),
      notes:           truncate(body.notes,   FIELD_LIMITS.notes),
      status:          isValidContactStatus(body.status) ? body.status : 'unknown',
    })
    .select('id, first_name, last_name, email, phone, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }

  return NextResponse.json({ data: contact }, { status: 201 })
}
