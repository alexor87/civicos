import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope } from '@/lib/validate-api-key'

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

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ ...body, campaign_id: ctx.campaignId })
    .select('id, first_name, last_name, email, phone, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }

  return NextResponse.json({ data: contact }, { status: 201 })
}
