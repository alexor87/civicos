import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const { feature_key, value } = await request.json()
  if (!feature_key) return NextResponse.json({ error: 'Missing feature_key' }, { status: 400 })

  const adminSupabase = createAdminClient()

  // Upsert override
  const { error } = await adminSupabase
    .from('tenant_feature_overrides')
    .upsert(
      { tenant_id: tenantId, feature_key, value, set_by_admin: admin.id },
      { onConflict: 'tenant_id,feature_key' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: tenant } = await adminSupabase.from('tenants').select('name').eq('id', tenantId).single()

  await insertAuditLog({
    admin_id: admin.id, admin_email: admin.email,
    action: 'feature_override_set', tenant_id: tenantId, tenant_name: tenant?.name,
    payload: { feature_key, value },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const { feature_key } = await request.json()
  if (!feature_key) return NextResponse.json({ error: 'Missing feature_key' }, { status: 400 })

  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('tenant_feature_overrides')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('feature_key', feature_key)

  const { data: tenant } = await adminSupabase.from('tenants').select('name').eq('id', tenantId).single()

  await insertAuditLog({
    admin_id: admin.id, admin_email: admin.email,
    action: 'feature_override_removed', tenant_id: tenantId, tenant_name: tenant?.name,
    payload: { feature_key },
  })

  return NextResponse.json({ ok: true })
}
