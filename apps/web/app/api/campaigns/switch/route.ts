import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json()
  if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find which tenant owns the requested campaign within the user's memberships.
  // Reading tenant_users is allowed by RLS (tenant_users_select_own).
  const { data: memberships } = await supabase
    .from('tenant_users')
    .select('tenant_id, campaign_ids')
    .eq('user_id', user.id)

  const targetMembership = (memberships ?? []).find(
    (m: { tenant_id: string; campaign_ids: string[] | null }) =>
      (m.campaign_ids ?? []).includes(campaignId)
  )
  if (!targetMembership) {
    return NextResponse.json({ error: 'Campaign not accessible' }, { status: 403 })
  }
  const targetTenantId = targetMembership.tenant_id

  // Compare to current active_tenant_id to know whether we need to refresh JWT.
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_tenant_id')
    .eq('id', user.id)
    .single()
  const currentTenantId = (profile as { active_tenant_id: string | null } | null)?.active_tenant_id ?? null
  const tenantChanged = targetTenantId !== currentTenantId

  const cookieStore = await cookies()
  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   60 * 60 * 24 * 365,
  }

  if (tenantChanged) {
    // Use admin client to avoid RLS edge cases when the user is currently scoped
    // to a different tenant (profiles_update_own requires tenant_id = auth_tenant_id).
    const admin = createAdminClient()
    const { error: updateErr } = await admin
      .from('profiles')
      .update({ active_tenant_id: targetTenantId })
      .eq('id', user.id)
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    cookieStore.set('active_tenant_id', targetTenantId, cookieOpts)
  }

  cookieStore.set('active_campaign_id', campaignId, cookieOpts)

  return NextResponse.json({
    ok:             true,
    tenant_changed: tenantChanged,
    tenant_id:      targetTenantId,
  })
}
