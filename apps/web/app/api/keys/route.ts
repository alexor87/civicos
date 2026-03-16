import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api-keys'

const ALLOWED_ROLES = ['super_admin', 'campaign_manager']

// ── GET — List API keys for campaign ─────────────────────────────────────────
export async function GET(_req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaignId = profile.campaign_ids?.[0]

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  // Strip key_hash from response — must never be exposed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeKeys = (keys ?? []).map(({ key_hash: _h, ...rest }: Record<string, unknown>) => rest)
  return NextResponse.json({ keys: safeKeys })
}

// ── POST — Create new API key ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { name, scopes = ['contacts:read'] } = body

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const campaignId = profile.campaign_ids?.[0]
  const { key, keyHash, keyPrefix } = generateApiKey()

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      campaign_id: campaignId,
      name,
      key_hash:   keyHash,
      key_prefix: keyPrefix,
      scopes,
      created_by: user.id,
    })
    .select('id, name, key_prefix, scopes, created_at, revoked_at')
    .single()

  if (error) {
    console.error('[POST /api/keys] insert error:', error)
    return NextResponse.json({ error: 'Failed to create key', detail: error.message }, { status: 500 })
  }

  // Return full key ONCE — not stored in DB
  return NextResponse.json({ key, api_key: apiKey }, { status: 201 })
}
