import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockSingle })),
          })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: mockEq,
              single: mockSingle,
              is: vi.fn(() => ({ single: mockSingle, eq: mockEq })),
            })),
            is: vi.fn(() => ({
              eq: vi.fn(() => ({ single: mockSingle })),
            })),
          })),
          update: mockUpdate,
        }
      }
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })) }
    }),
  })),
}))

import { DELETE } from '@/app/api/contacts/[id]/route'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DELETE /api/contacts/[id] (soft delete)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const req = new NextRequest('http://localhost/api/contacts/abc')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 if not admin or super_admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: { campaign_ids: ['c1'], role: 'volunteer' },
    })

    const req = new NextRequest('http://localhost/api/contacts/abc')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(403)
  })

  it('performs soft delete (sets deleted_at) instead of hard delete', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: { campaign_ids: ['c1'], role: 'admin' },
    })

    // Mock the update chain
    const mockUpdateEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
    mockUpdate.mockReturnValue({ eq: mockUpdateEq1 })

    const req = new NextRequest('http://localhost/api/contacts/abc')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'abc' }) })

    expect(res.status).toBe(200)
    // Verify it called .update() with deleted_at, not .delete()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    )
  })

  it('returns 200 with success on soft delete', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: { campaign_ids: ['c1'], role: 'super_admin' },
    })

    const mockUpdateEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }))
    mockUpdate.mockReturnValue({ eq: mockUpdateEq1 })

    const req = new NextRequest('http://localhost/api/contacts/abc')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'abc' }) })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})
