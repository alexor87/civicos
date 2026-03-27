import type { SupabaseClient } from '@supabase/supabase-js'
import { ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from '@/lib/permissions'

const SYSTEM_ROLES = [
  { name: 'Super Admin',       slug: 'super-admin',       description: 'Acceso total a la plataforma',      color: '#1E40AF', base_role_key: 'super_admin' },
  { name: 'Campaign Manager',  slug: 'campaign-manager',  description: 'Gestión completa de la campaña',    color: '#7C3AED', base_role_key: 'campaign_manager' },
  { name: 'Field Coordinator', slug: 'field-coordinator', description: 'Coordinación de terreno y equipos', color: '#059669', base_role_key: 'field_coordinator' },
  { name: 'Voluntario',        slug: 'voluntario',        description: 'Canvassing y registro de visitas',  color: '#D97706', base_role_key: 'volunteer' },
  { name: 'Analista',          slug: 'analista',          description: 'Reportes y análisis de datos',      color: '#DC2626', base_role_key: 'analyst' },
] as const

/**
 * Initialize system roles + permissions for a tenant directly via admin client.
 * Fallback when the Supabase RPC `initialize_system_roles` is unavailable.
 * Idempotent: uses upsert with ignoreDuplicates.
 */
export async function initializeSystemRoles(
  admin: SupabaseClient,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Upsert the 5 system roles
    const rolesToInsert = SYSTEM_ROLES.map(r => ({
      tenant_id: tenantId,
      name: r.name,
      slug: r.slug,
      description: r.description,
      color: r.color,
      is_system: true,
      base_role_key: r.base_role_key,
    }))

    const { error: rolesError } = await admin
      .from('custom_roles')
      .upsert(rolesToInsert, { onConflict: 'tenant_id,slug', ignoreDuplicates: true })

    if (rolesError) {
      return { success: false, error: `Error inserting roles: ${rolesError.message}` }
    }

    // 2. Fetch the created/existing system role IDs
    const { data: createdRoles, error: fetchError } = await admin
      .from('custom_roles')
      .select('id, base_role_key')
      .eq('tenant_id', tenantId)
      .eq('is_system', true)

    if (fetchError || !createdRoles) {
      return { success: false, error: `Error fetching roles: ${fetchError?.message}` }
    }

    // 3. Insert permissions for each role
    const permRows: Array<{
      tenant_id: string
      role_id: string
      permission: string
      is_active: boolean
    }> = []

    for (const role of createdRoles) {
      const defaults = DEFAULT_PERMISSIONS[role.base_role_key]
      if (!defaults) continue

      for (const perm of ALL_PERMISSIONS) {
        permRows.push({
          tenant_id: tenantId,
          role_id: role.id,
          permission: perm,
          is_active: defaults[perm] ?? false,
        })
      }
    }

    if (permRows.length > 0) {
      const { error: permError } = await admin
        .from('role_permissions')
        .upsert(permRows, { onConflict: 'tenant_id,role_id,permission', ignoreDuplicates: true })

      if (permError) {
        return { success: false, error: `Error inserting permissions: ${permError.message}` }
      }
    }

    // 4. Backfill: link existing profiles to their system role
    for (const role of createdRoles) {
      await admin
        .from('profiles')
        .update({ custom_role_id: role.id })
        .eq('tenant_id', tenantId)
        .eq('role', role.base_role_key)
        .is('custom_role_id', null)
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
