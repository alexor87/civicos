import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initializeSystemRoles } from '@/lib/roles/initialize-system-roles'

// Mock permissions
vi.mock('@/lib/permissions', () => ({
  ALL_PERMISSIONS: ['contacts.view', 'contacts.create', 'roles.manage'],
  DEFAULT_PERMISSIONS: {
    super_admin: { 'contacts.view': true, 'contacts.create': true, 'roles.manage': true },
    campaign_manager: { 'contacts.view': true, 'contacts.create': true, 'roles.manage': false },
    field_coordinator: { 'contacts.view': true, 'contacts.create': true, 'roles.manage': false },
    volunteer: { 'contacts.view': true, 'contacts.create': false, 'roles.manage': false },
    analyst: { 'contacts.view': true, 'contacts.create': false, 'roles.manage': false },
  },
}))

function createMockAdmin({
  upsertRolesError = null as any,
  fetchRolesData = [
    { id: 'r1', base_role_key: 'super_admin' },
    { id: 'r2', base_role_key: 'campaign_manager' },
    { id: 'r3', base_role_key: 'field_coordinator' },
    { id: 'r4', base_role_key: 'volunteer' },
    { id: 'r5', base_role_key: 'analyst' },
  ] as any,
  fetchRolesError = null as any,
  upsertPermsError = null as any,
} = {}) {
  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockResolvedValue({ data: null, error: null }),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'custom_roles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: upsertRolesError }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: fetchRolesData, error: fetchRolesError }),
            })),
          })),
        }
      }
      if (table === 'role_permissions') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: upsertPermsError }),
        }
      }
      if (table === 'profiles') {
        return {
          update: vi.fn(() => updateChain),
        }
      }
      return {}
    }),
  } as any
}

describe('initializeSystemRoles', () => {
  it('initializes roles and permissions successfully', async () => {
    const admin = createMockAdmin()
    const result = await initializeSystemRoles(admin, 'tenant-1')

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()

    // Should have called from('custom_roles') for upsert and select
    expect(admin.from).toHaveBeenCalledWith('custom_roles')
    // Should have called from('role_permissions') for permissions
    expect(admin.from).toHaveBeenCalledWith('role_permissions')
    // Should have called from('profiles') for backfill
    expect(admin.from).toHaveBeenCalledWith('profiles')
  })

  it('returns error when roles upsert fails', async () => {
    const admin = createMockAdmin({
      upsertRolesError: { message: 'relation does not exist' },
    })
    const result = await initializeSystemRoles(admin, 'tenant-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('inserting roles')
  })

  it('returns error when fetching created roles fails', async () => {
    const admin = createMockAdmin({
      fetchRolesError: { message: 'query failed' },
      fetchRolesData: null,
    })
    const result = await initializeSystemRoles(admin, 'tenant-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('fetching roles')
  })

  it('returns error when permissions upsert fails', async () => {
    const admin = createMockAdmin({
      upsertPermsError: { message: 'permission insert failed' },
    })
    const result = await initializeSystemRoles(admin, 'tenant-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('inserting permissions')
  })

  it('handles unexpected exceptions gracefully', async () => {
    const admin = {
      from: vi.fn(() => { throw new Error('unexpected crash') }),
    } as any
    const result = await initializeSystemRoles(admin, 'tenant-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('unexpected crash')
  })
})
