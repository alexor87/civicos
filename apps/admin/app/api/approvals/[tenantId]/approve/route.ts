import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const adminSupabase = createAdminClient()

  // Fetch tenant + wizard data for audit and plan update
  const { data: tenant } = await adminSupabase.from('tenants').select('name').eq('id', tenantId).single()
  const { data: onboarding } = await adminSupabase
    .from('onboarding_state')
    .select('wizard_data')
    .eq('tenant_id', tenantId)
    .single()

  const { data: campaignId, error } = await adminSupabase.rpc('approve_campaign_activation', {
    p_tenant_id: tenantId,
    p_admin_id: admin.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update tenant plan from wizard_data (wizard uses 'profesional', DB uses 'pro')
  const rawPlan = (onboarding?.wizard_data as Record<string, unknown> | null)?.plan as string | undefined
  const plan = rawPlan === 'profesional' ? 'pro' : rawPlan
  if (plan && ['esencial', 'pro', 'campaign', 'enterprise'].includes(plan)) {
    await adminSupabase.from('tenants').update({ plan }).eq('id', tenantId)
  }

  await insertAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'activation_approved',
    tenant_id: tenantId,
    tenant_name: tenant?.name,
    payload: { campaign_id: campaignId, plan },
  })

  return NextResponse.json({ ok: true, campaignId })
}
