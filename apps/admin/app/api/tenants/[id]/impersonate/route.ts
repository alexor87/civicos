import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const adminSupabase = createAdminClient()

  // Verify tenant exists and is not cancelled
  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('id, name, status')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
  }
  if (tenant.status === 'cancelled') {
    return NextResponse.json({ error: 'No se puede impersonar un tenant cancelado' }, { status: 400 })
  }

  // Find the Super Admin of the tenant
  const { data: superAdmin } = await adminSupabase
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'super_admin')
    .limit(1)
    .single()

  if (!superAdmin) {
    return NextResponse.json({ error: 'El tenant no tiene Super Admin configurado' }, { status: 404 })
  }

  // Sign a short-lived JWT for impersonation
  const secret = new TextEncoder().encode(process.env.IMPERSONATION_SECRET!)
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const token = await new SignJWT({
    sub: superAdmin.id,
    tenant_id: tenantId,
    tenant_name: tenant.name,
    admin_id: admin.id,
    impersonated_by: admin.email,
    impersonation_session_id: sessionId,
    is_impersonation: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .setIssuer('scrutix-admin')
    .setAudience('scrutix-web')
    .sign(secret)

  // Audit log
  await insertAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'impersonate_start',
    tenant_id: tenantId,
    tenant_name: tenant.name,
    payload: {
      super_admin_user_id: superAdmin.id,
      super_admin_name: superAdmin.full_name,
      session_id: sessionId,
      session_expires_at: expiresAt,
    },
  })

  const webAppUrl = process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'https://civicos-eight.vercel.app'
  const url = `${webAppUrl}/auth/impersonate?token=${token}`

  return NextResponse.json({ url })
}
