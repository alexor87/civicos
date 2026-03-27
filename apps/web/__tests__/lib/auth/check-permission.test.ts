import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkPermission, checkPermissions } from '@/lib/auth/check-permission'

function createMockSupabase(opts: {
  profile?: { role: string; custom_role_id: string | null; tenant_id: string } | null
  sysRole?: { id: string } | null
  perms?: { permission: string; is_active: boolean }[]
}) {
  const { profile = null, sysRole = null, perms = [] } = opts

  return {
    // RPC not available — forces fallback to direct queries
    rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: 'function not found' } })),
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: profile, error: profile ? null : 'not found' }),
            }),
          }),
        }
      }
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: sysRole, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'role_permissions') {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              // single permission check: .eq('role_id', x).eq('permission', y).single()
              if (col === 'role_id') {
                return {
                  eq: (_c: string, perm: string) => ({
                    single: () => {
                      const found = perms.find(p => p.permission === perm)
                      return Promise.resolve({ data: found ?? null, error: null })
                    },
                  }),
                  in: (_c: string, permList: string[]) => {
                    const filtered = perms.filter(p => permList.includes(p.permission))
                    return Promise.resolve({ data: filtered, error: null })
                  },
                }
              }
              return { single: () => Promise.resolve({ data: null, error: null }) }
            },
          }),
        }
      }
      return {}
    }),
  } as any
}

describe('checkPermission', () => {
  it('returns false if profile not found', async () => {
    const supabase = createMockSupabase({ profile: null })
    expect(await checkPermission(supabase, 'user-1', 'contacts.view')).toBe(false)
  })

  it('returns true for super_admin without checking permissions table', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'super_admin', custom_role_id: null, tenant_id: 't1' },
    })
    expect(await checkPermission(supabase, 'user-1', 'contacts.delete')).toBe(true)
  })

  it('returns true when permission is active', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'volunteer', custom_role_id: 'role-1', tenant_id: 't1' },
      perms: [{ permission: 'contacts.view', is_active: true }],
    })
    expect(await checkPermission(supabase, 'user-1', 'contacts.view')).toBe(true)
  })

  it('returns false when permission is inactive', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'volunteer', custom_role_id: 'role-1', tenant_id: 't1' },
      perms: [{ permission: 'contacts.delete', is_active: false }],
    })
    expect(await checkPermission(supabase, 'user-1', 'contacts.delete')).toBe(false)
  })

  it('falls back to system role when custom_role_id is null', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'field_coordinator', custom_role_id: null, tenant_id: 't1' },
      sysRole: { id: 'sys-fc-1' },
      perms: [{ permission: 'territory.view', is_active: true }],
    })
    expect(await checkPermission(supabase, 'user-1', 'territory.view')).toBe(true)
  })

  it('returns false when no system role found', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'field_coordinator', custom_role_id: null, tenant_id: 't1' },
      sysRole: null,
    })
    expect(await checkPermission(supabase, 'user-1', 'territory.view')).toBe(false)
  })
})

describe('checkPermissions', () => {
  it('returns all true for super_admin', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'super_admin', custom_role_id: null, tenant_id: 't1' },
    })
    const result = await checkPermissions(supabase, 'user-1', ['contacts.view', 'reports.export'])
    expect(result['contacts.view']).toBe(true)
    expect(result['reports.export']).toBe(true)
  })

  it('returns correct map for mixed permissions', async () => {
    const supabase = createMockSupabase({
      profile: { role: 'analyst', custom_role_id: 'role-a', tenant_id: 't1' },
      perms: [
        { permission: 'contacts.view', is_active: true },
        { permission: 'contacts.delete', is_active: false },
      ],
    })
    const result = await checkPermissions(supabase, 'user-1', ['contacts.view', 'contacts.delete', 'reports.view'])
    expect(result['contacts.view']).toBe(true)
    expect(result['contacts.delete']).toBe(false)
    expect(result['reports.view']).toBe(false)
  })
})
