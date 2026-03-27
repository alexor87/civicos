import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'

/**
 * Query helper: tries admin client first, falls back to server client.
 * Needed because admin client may be misconfigured in production.
 */
async function queryWithFallback<T>(
  adminQuery: () => Promise<{ data: T | null; error: any }>,
  serverQuery: () => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  const { data: d1 } = await adminQuery()
  if (d1) return d1
  const { data: d2 } = await serverQuery()
  return d2
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch { admin = null as any }

  // Permission check: try server client first (known to work), admin as fallback
  let can = await checkPermission(supabase, user.id, 'roles.manage')
  if (!can && admin) {
    can = await checkPermission(admin, user.id, 'roles.manage')
  }
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  // Get tenant_id via server client (works reliably)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  const tenantId = profile.tenant_id

  // Get roles — try admin (bypasses RLS), fallback to server client
  let roles = await queryWithFallback(
    () => admin
      ? admin.from('custom_roles').select('*').eq('tenant_id', tenantId).order('is_system', { ascending: false }).order('name')
      : Promise.resolve({ data: null, error: 'no admin' }),
    () => supabase.from('custom_roles').select('*').eq('tenant_id', tenantId).order('is_system', { ascending: false }).order('name')
  )

  // Auto-initialize system roles if none exist
  if (!roles || (Array.isArray(roles) && roles.length === 0)) {
    // Try RPC via server client (SECURITY DEFINER — works with any authenticated user)
    const { error: rpcError } = await supabase.rpc('initialize_system_roles', { p_tenant_id: tenantId })

    if (rpcError) {
      console.warn('[roles/GET] Server client RPC failed:', rpcError.message)
      // Try via admin client
      if (admin) {
        const { error: adminRpcError } = await admin.rpc('initialize_system_roles', { p_tenant_id: tenantId })
        if (adminRpcError) {
          console.error('[roles/GET] Admin RPC also failed:', adminRpcError.message)
          return NextResponse.json(
            { error: 'No se pudieron inicializar los roles del sistema' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'No se pudieron inicializar los roles del sistema' },
          { status: 500 }
        )
      }
    }

    // Re-fetch after initialization
    roles = await queryWithFallback(
      () => admin
        ? admin.from('custom_roles').select('*').eq('tenant_id', tenantId).order('is_system', { ascending: false }).order('name')
        : Promise.resolve({ data: null, error: 'no admin' }),
      () => supabase.from('custom_roles').select('*').eq('tenant_id', tenantId).order('is_system', { ascending: false }).order('name')
    )
  }

  // Get member counts per role
  const allProfiles = await queryWithFallback(
    () => admin
      ? admin.from('profiles').select('custom_role_id').eq('tenant_id', tenantId)
      : Promise.resolve({ data: null, error: 'no admin' }),
    () => supabase.from('profiles').select('custom_role_id').eq('tenant_id', tenantId)
  )

  const memberCounts: Record<string, number> = {}
  if (Array.isArray(allProfiles)) {
    allProfiles.forEach((p: { custom_role_id: string | null }) => {
      if (p.custom_role_id) {
        memberCounts[p.custom_role_id] = (memberCounts[p.custom_role_id] || 0) + 1
      }
    })
  }

  const rolesWithCount = (Array.isArray(roles) ? roles : []).map((r: any) => ({
    ...r,
    member_count: memberCounts[r.id] || 0,
  }))

  return NextResponse.json(rolesWithCount)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch { admin = null as any }

  // Permission check
  let can = await checkPermission(supabase, user.id, 'roles.manage')
  if (!can && admin) {
    can = await checkPermission(admin, user.id, 'roles.manage')
  }
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  const tenantId = profile.tenant_id

  const body = await request.json()
  const { name, description, color, base_role_id } = body

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 })
  }

  if (name.trim().length > 40) {
    return NextResponse.json({ error: 'El nombre no puede tener más de 40 caracteres' }, { status: 400 })
  }

  const slug = name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Use whichever client works for custom_roles queries
  const db = admin || supabase

  const { data: existing } = await db
    .from('custom_roles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 })
  }

  const systemSlugs = ['super-admin', 'campaign-manager', 'field-coordinator', 'voluntario', 'analista']
  if (systemSlugs.includes(slug)) {
    return NextResponse.json({ error: 'No se puede usar un nombre de rol del sistema' }, { status: 400 })
  }

  const { data: newRole, error } = await db
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

  if (base_role_id) {
    const { data: basePerms } = await db
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
      await db.from('role_permissions').insert(newPerms)
    }
  } else {
    const { ALL_PERMISSIONS } = await import('@/lib/permissions')
    const newPerms = ALL_PERMISSIONS.map((p: string) => ({
      tenant_id: tenantId,
      role_id: newRole.id,
      permission: p,
      is_active: false,
    }))
    await db.from('role_permissions').insert(newPerms)
  }

  return NextResponse.json(newRole, { status: 201 })
}
