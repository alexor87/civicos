import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { readColombiaRows, importGeoRows } from '@/lib/geo/colombia-import'

export async function POST(request: NextRequest) {
  const { orgName, slug, fullName, email, password, campaignName, electionDate, country, electionType } = await request.json()

  if (!orgName || !slug || !email || !password || !campaignName) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // 1. Check slug availability
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingTenant) {
    return NextResponse.json({ error: 'El subdominio ya está en uso' }, { status: 409 })
  }

  // 2. Create tenant (store country in settings)
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name: orgName, slug, plan: 'pro', settings: { country: country ?? 'colombia' } })
    .select()
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Error al crear la organización' }, { status: 500 })
  }

  // 3. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      tenant_id: tenant.id,
      role: 'super_admin',
    },
  })

  if (authError || !authData.user) {
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: authError?.message || 'Error al crear usuario' }, { status: 500 })
  }

  // 4. Upsert profile
  await supabase.from('profiles').upsert({
    id: authData.user.id,
    tenant_id: tenant.id,
    role: 'super_admin',
    full_name: fullName,
    campaign_ids: [],
  })

  // 5. Create first campaign
  const campaignData: {
    tenant_id: string
    name: string
    election_date?: string
    config: Record<string, unknown>
    is_active: boolean
  } = {
    tenant_id: tenant.id,
    name: campaignName,
    config: {},
    is_active: true,
  }
  if (electionDate)  campaignData.election_date = electionDate
  if (electionType)  campaignData.config = { ...campaignData.config, election_type: electionType }

  const { data: campaign } = await supabase
    .from('campaigns')
    .insert(campaignData)
    .select()
    .single()

  // 6. Update profile with campaign_id
  if (campaign) {
    await supabase
      .from('profiles')
      .update({ campaign_ids: [campaign.id] })
      .eq('id', authData.user.id)
  }

  // 7. Auto-import geographic data for Colombia
  if ((country ?? 'colombia') === 'colombia' && campaign) {
    try {
      const rows = readColombiaRows()
      await importGeoRows(supabase, rows, tenant.id, campaign.id)
    } catch {
      // Non-fatal: geo data import failure doesn't block onboarding
    }
  }

  return NextResponse.json({
    success: true,
    tenantId: tenant.id,
    campaignId: campaign?.id,
  })
}
