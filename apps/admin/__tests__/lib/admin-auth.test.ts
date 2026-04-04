import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase admin client
const mockSingle = vi.fn()
const mockEq2 = vi.fn(() => ({ single: mockSingle }))
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
const mockSelect = vi.fn(() => ({ eq: mockEq1 }))
const mockUpdateEq = vi.fn()
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'admin_users') {
    return { select: mockSelect, update: mockUpdate }
  }
  return {}
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { verifyAdminUser, updateAdminLastLogin } from '@/lib/admin-auth'

describe('verifyAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns admin user when found and active', async () => {
    const fakeAdmin = {
      id: 'admin-1',
      user_id: 'auth-user-1',
      email: 'admin@test.com',
      full_name: 'Test Admin',
      is_active: true,
      last_login_at: null,
    }
    mockSingle.mockResolvedValue({ data: fakeAdmin, error: null })

    const result = await verifyAdminUser('auth-user-1')

    expect(result).toEqual(fakeAdmin)
    expect(mockFrom).toHaveBeenCalledWith('admin_users')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq1).toHaveBeenCalledWith('user_id', 'auth-user-1')
    expect(mockEq2).toHaveBeenCalledWith('is_active', true)
  })

  it('returns null when user not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const result = await verifyAdminUser('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null when supabase returns an error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const result = await verifyAdminUser('auth-user-1')
    expect(result).toBeNull()
  })

  it('returns null when data is null even without error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })

    const result = await verifyAdminUser('auth-user-1')
    expect(result).toBeNull()
  })
})

describe('updateAdminLastLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-31T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates last_login_at for the given admin id', async () => {
    mockUpdateEq.mockResolvedValue({ error: null })

    await updateAdminLastLogin('admin-1')

    expect(mockFrom).toHaveBeenCalledWith('admin_users')
    expect(mockUpdate).toHaveBeenCalledWith({
      last_login_at: '2026-03-31T12:00:00.000Z',
    })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'admin-1')
  })
})
