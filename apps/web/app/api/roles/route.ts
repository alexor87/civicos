import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'
import { initializeSystemRoles } from '@/lib/roles/initialize-system-roles'

/**
 * Helper: check roles.manage permission with admin client,
 * fallback to server client if admin fails.
 */
async function canManageRoles(
  admin: ReturnType<typeof createAdminClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const can = await checkPermission(admin, userId, 'roles.manage')
  if (can) return true

  // Fallback: admin client may fail silently — try server client
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'super_admin') {
    console.warn('[roles] Admin permission check failed, server client fallback used for:', userId)
    return true
  }
  return false
}

/**
 * Helper: get tenant_id from profile, trying admin then server client.
 */
async function getTenantId(
  admin: ReturnType<typeof createAdminClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: p1 } = await admin.from('profiles').select('tenant_id').eq('id', userId).single()
  if (p1?.tenant_id) return p1.tenant_id

  const { data: p2 } = await supabase.from('profiles').select('tenant_id').eq('id', userId).single()
  return p2?.tenant_id ?? null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const can = await canManageRoles(admin, supabase, user.id)
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const tenantId = await getTenantId(admin, supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  // Get roles
  let { data: roles } = await admin
    .from('custom_roles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_system', { ascending: false })
    .order('name')

  // Auto-initialize system roles if none exist for this tenant
  if (!roles || roles.length === 0) {
    // Try RPC first (fastest if migration functions are registered)
    const { error: rpcError } = await admin.rpc('initialize_system_roles', { p_tenant_id: tenantId })

    if (rpcError) {
      // RPC unavailable — fallback to direct insert via admin client
      console.warn('[roles/GET] RPC initialize_system_roles failed, using fallback:', rpcError.message)
      const result = await initializeSystemRoles(admin, tenantId)
      if (!result.success) {
        console.error('[roles/GET] Fallback initialization also failed:', result.error)
        return NextResponse.json(
          { error: 'No se pudieron inicializar los roles del sistema' },
          { status: 500 }
        )
      }
    }

    // Re-fetch after initialization
    const { data: freshRoles } = await admin
      .from('custom_roles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_system', { ascending: false })
      .order('name')
    roles = freshRoles
  }

  // Get member counts per role
  const { data: profiles } = await admin
    .from('profiles')
    .select('custom_role_id')
    .eq('tenant_id', tenantId)

  const memberCounts: Record<string, number> = {}
  profiles?.forEach((p: { custom_role_id: string | null }) => {
    if (p.custom_role_id) {
      memberCounts[p.custom_role_id] = (memberCounts[p.custom_role_id] || 0) + 1
    }
  })

  const rolesWithCount = (roles ?? []).map((r: any) => ({
    ...r,
    member_count: memberCounts[r.id] || 0,
  }))

  return NextResponse.json(rolesWithCount)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const can = await canManageRoles(admin, supabase, user.id)
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const tenantId = await getTenantId(admin, supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const body = await request.json()
  const { name, description, color, base_role_id } = body

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 })
  }

  if (name.trim().length > 40) {
    return NextResponse.json({ error: 'El nombre no puede tener más de 40 caracteres' }, { status: 400 })
  }

  // Generate slug
  const slug = name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Check uniqueness
  const { data: existing } = await admin
    .from('custom_roles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 })
  }

  // Check not using system role name
  const systemSlugs = ['super-admin', 'campaign-manager', 'field-coordinator', 'voluntario', 'analista']
  if (systemSlugs.includes(slug)) {
    return NextResponse.json({ error: 'No se puede usar un nombre de rol del sistema' }, { status: 400 })
  }

  // Create the role
  const { data: newRole, error } = await admin
    .from('custom_roles')
    .insert({
      tenant_id: tenantId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      color: color || '#6366F1',
      is_system: false,
      base_role_key: null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If base_role_id provided, copy permissions from that role
  if (base_role_id) {
    const { data: basePerms } = await admin
      .from('role_permissions')
      .select('permission, is_active')
      .eq('role_id', base_role_id)

    if (basePerms && basePerms.length > 0) {
      const newPerms = basePerms.map((p: { permission: string; is_active: boolean }) => ({
        tenant_id: tenantId,
        role_id: newRole.id,
        permission: p.permission,
        is_active: p.is_active,
      }))

      await admin.from('role_permissions').insert(newPerms)
    }
  } else {
    // Create all permissions as false for the new role
    const { ALL_PERMISSIONS } = await import('@/lib/permissions')
    const newPerms = ALL_PERMISSIONS.map((p: string) => ({
      tenant_id: tenantId,
      role_id: newRole.id,
      permission: p,
      is_active: false,
    }))
    await admin.from('role_permissions').insert(newPerms)
  }

  return NextResponse.json(newRole, { status: 201 })
}
