import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase      = await createClient()
    const adminSupabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_ids, tenant_id')
      .eq('id', user.id)
      .single()

    const campaignId = profile?.campaign_ids?.[0]
    if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = adminSupabase
      .from('automation_flows')
      .select('*')
      .eq('campaign_id', campaignId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: flows, error } = await query
    if (error) throw error

    // Contar ejecuciones por flow
    const { data: execCounts } = await adminSupabase
      .from('flow_executions')
      .select('flow_id')
      .in('flow_id', (flows ?? []).map(f => f.id))

    const countMap: Record<string, number> = {}
    const lastMap:  Record<string, string> = {}
    for (const e of execCounts ?? []) {
      countMap[e.flow_id] = (countMap[e.flow_id] ?? 0) + 1
    }

    // Última ejecución por flow
    const { data: lastExecs } = await adminSupabase
      .from('flow_executions')
      .select('flow_id, started_at')
      .in('flow_id', (flows ?? []).map(f => f.id))
      .order('started_at', { ascending: false })

    const seenFlows = new Set<string>()
    for (const e of lastExecs ?? []) {
      if (!seenFlows.has(e.flow_id)) {
        lastMap[e.flow_id] = e.started_at
        seenFlows.add(e.flow_id)
      }
    }

    const result = (flows ?? []).map(f => ({
      ...f,
      execution_count:    countMap[f.id] ?? 0,
      last_execution_at:  lastMap[f.id] ?? null,
    }))

    return NextResponse.json(result)
  } catch (e) {
    console.error('[GET /api/flows]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase      = await createClient()
    const adminSupabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_ids, tenant_id')
      .eq('id', user.id)
      .single()

    const campaignId = profile?.campaign_ids?.[0]
    if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const body = await req.json()
    const {
      name,
      description,
      category,
      icon,
      trigger_config,
      filter_config,
      actions_config,
      status,
      max_executions_per_contact,
      execution_window_days,
      requires_approval,
      ai_generated,
      natural_language_input,
      from_template_id,
    } = body

    if (!name || !trigger_config || !actions_config) {
      return NextResponse.json({ error: 'name, trigger_config y actions_config son requeridos' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const insertData: Record<string, unknown> = {
      tenant_id:       profile.tenant_id,
      campaign_id:     campaignId,
      created_by:      user.id,
      name,
      description:     description ?? null,
      category:        category ?? 'custom',
      icon:            icon ?? null,
      from_template_id: from_template_id ?? null,
      status:          status ?? 'draft',
      trigger_config,
      filter_config:   filter_config ?? [],
      actions_config,
      max_executions_per_contact: max_executions_per_contact ?? 1,
      execution_window_days:      execution_window_days ?? null,
      requires_approval:          requires_approval ?? false,
      ai_generated:               ai_generated ?? false,
      natural_language_input:     natural_language_input ?? null,
    }

    if (status === 'active') {
      insertData.activated_at = now
    }

    const { data: flow, error } = await adminSupabase
      .from('automation_flows')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(flow, { status: 201 })
  } catch (e) {
    console.error('[POST /api/flows]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
