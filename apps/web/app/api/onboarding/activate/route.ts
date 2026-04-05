import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const {
    electionType,
    candidateName,
    plan,
    electionDate,
  } = body

  if (!electionType || !candidateName) {
    return NextResponse.json({ error: 'Cargo y candidato son requeridos' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()

  // 1. Update onboarding state to 'activating'
  await adminSupabase
    .from('onboarding_state')
    .update({
      stage: 'activating',
      wizard_data: body,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', profile.tenant_id)

  // 2. Call RPC to delete demo and create real campaign
  const campaignName = `Campaña ${candidateName}`
  const { data: newCampaignId, error: rpcError } = await adminSupabase.rpc(
    'activate_real_campaign',
    {
      p_tenant_id: profile.tenant_id,
      p_name: campaignName,
      p_candidate: candidateName,
      p_election_type: electionType,
      p_election_date: electionDate || null,
    }
  )

  if (rpcError) {
    // Revert to demo state on failure
    await adminSupabase
      .from('onboarding_state')
      .update({ stage: 'demo', updated_at: new Date().toISOString() })
      .eq('tenant_id', profile.tenant_id)

    return NextResponse.json(
      { error: 'Error al activar la campaña: ' + rpcError.message },
      { status: 500 }
    )
  }

  // 3. Update tenant plan
  if (plan) {
    await adminSupabase
      .from('tenants')
      .update({ plan })
      .eq('id', profile.tenant_id)
  }

  return NextResponse.json({
    success: true,
    campaignId: newCampaignId,
  })
}
