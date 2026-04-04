import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getAdminFromRequest } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { insertAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  // 1. Verify admin
  const admin = await getAdminFromRequest()
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Parse body
  const body = await request.json()
  const { tenant_id } = body

  if (!tenant_id || typeof tenant_id !== 'string') {
    return NextResponse.json({ error: 'tenant_id es requerido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 3. Fetch tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, status')
    .eq('id', tenant_id)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
  }

  if (tenant.status === 'cancelled') {
    return NextResponse.json({ error: 'No se puede impersonar un tenant cancelado' }, { status: 400 })
  }

  // 4. Find super_admin profile
  const { data: superAdminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, tenant_id')
    .eq('tenant_id', tenant_id)
    .eq('role', 'super_admin')
    .limit(1)
    .single()

  if (profileError || !superAdminProfile) {
    return NextResponse.json(
      { error: 'No se encontró un super_admin para este tenant' },
      { status: 404 }
    )
  }

  // 5. Sign transfer token
  const secret = new TextEncoder().encode(process.env.IMPERSONATION_SECRET!)
  const sessionId = crypto.randomUUID()
  const sessionExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const impersonationToken = await new SignJWT({
    sub: superAdminProfile.id,
    tenant_id,
    tenant_name: tenant.name,
    impersonated_by: admin.email,
    admin_id: admin.id,
    impersonation_session_id: sessionId,
    is_impersonation: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('60s')
    .setIssuer('scrutix-admin')
    .setAudience('scrutix-web')
    .sign(secret)

  // 6. Audit log
  await insertAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'impersonate_start',
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    payload: {
      super_admin_id: superAdminProfile.id,
      super_admin_name: superAdminProfile.full_name,
      impersonation_session_id: sessionId,
      session_expires_at: sessionExpiresAt,
    },
  })

  // 7. Return token
  return NextResponse.json({ token: impersonationToken })
}
