import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const body = await request.json()
  const { name, slug, plan, country, admin_email, internal_notes } = body

  if (!name || !slug || !admin_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Create the tenant
  const { data: tenant, error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      name,
      slug,
      plan: plan ?? 'esencial',
      country: country ?? 'co',
      internal_notes: internal_notes ?? null,
      created_by_admin: admin.id,
    })
    .select('id, name')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? 'Failed to create tenant' }, { status: 500 })
  }

  // Invite the super admin via email
  const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(admin_email, {
    data: { tenant_id: tenant.id, role: 'super_admin' },
  })

  // Audit log
  await insertAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'tenant_created',
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    payload: { plan, country, admin_email, invite_error: inviteError?.message ?? null },
  })

  return NextResponse.json({ id: tenant.id, name: tenant.name })
}
