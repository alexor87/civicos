import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const reason = (body.reason as string | undefined)?.trim()
  if (!reason) return NextResponse.json({ error: 'Motivo requerido' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const { data: tenant } = await adminSupabase.from('tenants').select('name').eq('id', tenantId).single()

  const { error } = await adminSupabase.rpc('reject_campaign_activation', {
    p_tenant_id: tenantId,
    p_admin_id: admin.id,
    p_reason: reason,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await insertAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'activation_rejected',
    tenant_id: tenantId,
    tenant_name: tenant?.name,
    payload: { reason },
  })

  return NextResponse.json({ ok: true })
}
