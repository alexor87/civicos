import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const body = await request.json()
  const { action, ...payload } = body
  const adminSupabase = createAdminClient()

  // Fetch tenant name for audit
  const { data: tenant } = await adminSupabase.from('tenants').select('name').eq('id', id).single()

  switch (action) {
    case 'change_plan': {
      const { plan } = payload
      if (!['esencial', 'pro', 'campaign', 'enterprise'].includes(plan)) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }
      await adminSupabase.from('tenants').update({ plan }).eq('id', id)
      await insertAuditLog({
        admin_id: admin.id, admin_email: admin.email,
        action: 'plan_changed', tenant_id: id, tenant_name: tenant?.name,
        payload: { new_plan: plan },
      })
      break
    }

    case 'suspend': {
      await adminSupabase.from('tenants').update({ status: 'suspended' }).eq('id', id)
      await insertAuditLog({
        admin_id: admin.id, admin_email: admin.email,
        action: 'tenant_suspended', tenant_id: id, tenant_name: tenant?.name,
      })
      break
    }

    case 'reactivate': {
      await adminSupabase.from('tenants').update({ status: 'active' }).eq('id', id)
      await insertAuditLog({
        admin_id: admin.id, admin_email: admin.email,
        action: 'tenant_reactivated', tenant_id: id, tenant_name: tenant?.name,
      })
      break
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
