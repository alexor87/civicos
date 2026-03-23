import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getFlowWithAuth(supabase: Awaited<ReturnType<typeof createClient>>, id: string, campaignId: string) {
  const { data, error } = await supabase
    .from('automation_flows')
    .select('*')
    .eq('id', id)
    .eq('campaign_id', campaignId)
    .single()
  return { data, error }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_ids')
      .eq('id', user.id)
      .single()
    const campaignId = profile?.campaign_ids?.[0]
    if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const { data: flow, error } = await getFlowWithAuth(supabase, id, campaignId)
    if (error || !flow) return NextResponse.json({ error: 'Flow no encontrado' }, { status: 404 })

    // Últimas 20 ejecuciones con nombre del contacto
    const { data: executions } = await supabase
      .from('flow_executions')
      .select('*, contacts(full_name)')
      .eq('flow_id', id)
      .order('started_at', { ascending: false })
      .limit(20)

    const execs = (executions ?? []).map(e => ({
      ...e,
      contact_name: (e.contacts as { full_name?: string } | null)?.full_name ?? 'Contacto desconocido',
      contacts: undefined,
    }))

    return NextResponse.json({ ...flow, executions: execs })
  } catch (e) {
    console.error('[GET /api/flows/[id]]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase      = await createClient()
    const adminSupabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_ids')
      .eq('id', user.id)
      .single()
    const campaignId = profile?.campaign_ids?.[0]
    if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const { data: existing } = await getFlowWithAuth(supabase, id, campaignId)
    if (!existing) return NextResponse.json({ error: 'Flow no encontrado' }, { status: 404 })

    const body = await req.json()
    const now = new Date().toISOString()

    const updates: Record<string, unknown> = { ...body, updated_at: now }

    // Setear timestamps de estado automáticamente
    if (body.status === 'active' && existing.status !== 'active') {
      updates.activated_at = now
      updates.paused_at    = null
    }
    if (body.status === 'paused' && existing.status !== 'paused') {
      updates.paused_at = now
    }

    const { data: flow, error } = await adminSupabase
      .from('automation_flows')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(flow)
  } catch (e) {
    console.error('[PATCH /api/flows/[id]]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase      = await createClient()
    const adminSupabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_ids')
      .eq('id', user.id)
      .single()
    const campaignId = profile?.campaign_ids?.[0]
    if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const { data: existing } = await getFlowWithAuth(supabase, id, campaignId)
    if (!existing) return NextResponse.json({ error: 'Flow no encontrado' }, { status: 404 })

    // Soft-delete
    await adminSupabase
      .from('automation_flows')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/flows/[id]]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
