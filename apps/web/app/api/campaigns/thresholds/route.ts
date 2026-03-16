import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_AGENT_THRESHOLDS, type AgentThresholds } from '@/lib/agents/thresholds'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, campaign_ids')
    .eq('id', user.id)
    .single()

  if (!['super_admin', 'campaign_manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { campaign_id, thresholds } = body as { campaign_id: string; thresholds: Partial<AgentThresholds> }

  if (!campaign_id || !thresholds) {
    return NextResponse.json({ error: 'Missing campaign_id or thresholds' }, { status: 400 })
  }

  const campaignIds: string[] = profile?.campaign_ids ?? []
  if (profile?.role !== 'super_admin' && !campaignIds.includes(campaign_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validate threshold values
  const merged: AgentThresholds = { ...DEFAULT_AGENT_THRESHOLDS }
  const keys = Object.keys(DEFAULT_AGENT_THRESHOLDS) as (keyof AgentThresholds)[]
  for (const key of keys) {
    const val = thresholds[key]
    if (val !== undefined) {
      if (typeof val !== 'number' || val <= 0) {
        return NextResponse.json({ error: `Invalid value for ${key}` }, { status: 400 })
      }
      merged[key] = val
    }
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('config')
    .eq('id', campaign_id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const existingConfig = (campaign.config as Record<string, unknown> | null) ?? {}
  const newConfig = { ...existingConfig, agent_thresholds: merged }

  const { error } = await supabase
    .from('campaigns')
    .update({ config: newConfig })
    .eq('id', campaign_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, thresholds: merged })
}
