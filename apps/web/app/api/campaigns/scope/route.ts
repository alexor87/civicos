import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MANAGE_ROLES = ['super_admin', 'campaign_manager']

// ── GET — Current scope + available geo units ─────────────────────────────────
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

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, config')
    .eq('id', campaignId ?? '')
    .single()

  const config = (campaign?.config as Record<string, unknown> | null) ?? {}
  const electionType = (config.election_type as string | null) ?? null
  const geoScope     = (config.geo_scope as Record<string, string> | null) ?? {}

  // Load available departments
  const { data: departments } = await supabase
    .from('geo_units')
    .select('id, name, code')
    .eq('campaign_id', campaignId ?? '')
    .eq('type', 'departamento')
    .order('name')

  // Load municipalities for selected department (if any)
  let municipalities: { id: string; name: string }[] = []
  if (geoScope.department_id) {
    const { data: munis } = await supabase
      .from('geo_units')
      .select('id, name')
      .eq('campaign_id', campaignId ?? '')
      .eq('type', 'municipio')
      .eq('parent_id', geoScope.department_id)
      .order('name')
    municipalities = (munis ?? []) as { id: string; name: string }[]
  }

  return NextResponse.json({
    election_type: electionType,
    geo_scope:     geoScope,
    departments:   (departments ?? []) as { id: string; name: string; code: string }[],
    municipalities,
  })
}

// ── PATCH — Update election type + geo scope ──────────────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!MANAGE_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const campaignId = profile.campaign_ids?.[0]
  const body = await req.json().catch(() => ({}))
  const { election_type, geo_scope } = body

  // Load current config to merge (not replace)
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, config')
    .eq('id', campaignId ?? '')
    .single()

  const existingConfig = (campaign?.config as Record<string, unknown> | null) ?? {}
  const newConfig: Record<string, unknown> = { ...existingConfig }

  if (election_type !== undefined) newConfig.election_type = election_type
  if (geo_scope !== undefined)    newConfig.geo_scope     = geo_scope

  const { error } = await supabase
    .from('campaigns')
    .update({ config: newConfig })
    .eq('id', campaignId ?? '')

  if (error) {
    return NextResponse.json({ error: 'Failed to update scope', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
