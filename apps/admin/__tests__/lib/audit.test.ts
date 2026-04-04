import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase admin client
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

// Mock next/headers
const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}))

import { insertAuditLog } from '@/lib/audit'

describe('insertAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts audit entry with IP from x-forwarded-for', async () => {
    mockHeadersGet.mockImplementation((key: string) => {
      if (key === 'x-forwarded-for') return '1.2.3.4'
      if (key === 'user-agent') return 'TestAgent/1.0'
      return null
    })

    await insertAuditLog({
      admin_id: 'admin-1',
      admin_email: 'admin@test.com',
      action: 'tenant_created',
      tenant_id: 'tenant-1',
      tenant_name: 'Org Test',
      payload: { plan: 'pro' },
    })

    expect(mockFrom).toHaveBeenCalledWith('admin_audit_log')
    expect(mockInsert).toHaveBeenCalledWith({
      admin_id: 'admin-1',
      admin_email: 'admin@test.com',
      action: 'tenant_created',
      tenant_id: 'tenant-1',
      tenant_name: 'Org Test',
      payload: { plan: 'pro' },
      ip_address: '1.2.3.4',
      user_agent: 'TestAgent/1.0',
    })
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
    mockHeadersGet.mockImplementation((key: string) => {
      if (key === 'x-forwarded-for') return null
      if (key === 'x-real-ip') return '5.6.7.8'
      if (key === 'user-agent') return 'Bot/2.0'
      return null
    })

    await insertAuditLog({
      admin_id: 'admin-2',
      admin_email: 'other@test.com',
      action: 'admin_login',
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '5.6.7.8',
        user_agent: 'Bot/2.0',
      }),
    )
  })

  it('uses "unknown" when no IP headers present', async () => {
    mockHeadersGet.mockReturnValue(null)

    await insertAuditLog({
      admin_id: 'admin-3',
      admin_email: 'noop@test.com',
      action: 'plan_changed',
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: 'unknown',
        user_agent: 'unknown',
      }),
    )
  })

  it('defaults optional fields to null and empty object', async () => {
    mockHeadersGet.mockReturnValue(null)

    await insertAuditLog({
      admin_id: 'admin-1',
      admin_email: 'admin@test.com',
      action: 'admin_login',
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: null,
        tenant_name: null,
        payload: {},
      }),
    )
  })
})
