import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Admin client bypasses RLS — needed because JWT lacks tenant_id claim
  // (enrich-jwt hook not registered). Safe: auth verified above.
  const admin = createAdminClient()

  const can = await checkPermission(admin, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  // Get roles
  let { data: roles } = await admin
    .from('custom_roles')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('is_system', { ascending: false })
    .order('name')

  // Auto-initialize system roles if none exist for this tenant
  if (!roles || roles.length === 0) {
    const { error: rpcError } = await admin.rpc('initialize_system_roles', { p_tenant_id: profile.tenant_id })
    if (!rpcError) {
      const { data: freshRoles } = await admin
        .from('custom_roles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('is_system', { ascending: false })
        .order('name')
      roles = freshRoles
    }
  }

  // Get member counts per role
  const { data: profiles } = await admin
    .from('profiles')
    .select('custom_role_id')
    .eq('tenant_id', profile.tenant_id)

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

  const can = await checkPermission(admin, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

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
    .eq('tenant_id', profile.tenant_id)
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
      tenant_id: profile.tenant_id,
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
        tenant_id: profile.tenant_id,
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
      tenant_id: profile.tenant_id,
      role_id: newRole.id,
      permission: p,
      is_active: false,
    }))
    await admin.from('role_permissions').insert(newPerms)
  }

  return NextResponse.json(newRole, { status: 201 })
}
