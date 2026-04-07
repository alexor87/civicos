import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing route
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockLimit = vi.fn()
const mockOr = vi.fn()

const mockChain = () => ({
  select: mockSelect,
  eq: mockEq,
  limit: mockLimit,
  or: mockOr,
  single: mockSingle,
  insert: mockInsert,
})

// Each chainable method returns the chain
mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, limit: mockLimit })
mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, limit: mockLimit, or: mockOr, select: mockSelect })
mockLimit.mockReturnValue({ single: mockSingle })
mockOr.mockReturnValue({ limit: mockLimit, single: mockSingle })
mockInsert.mockReturnValue({ select: mockSelect })

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/impersonation-guard', () => ({
  rejectIfImpersonating: vi.fn().mockResolvedValue(null),
}))

import { POST } from '@/app/api/contacts/route'

const validBody = {
  first_name: 'Juan',
  last_name: 'Pérez',
  document_type: 'CC',
  document_number: '1234567890',
  phone: '3001234567',
  status: 'supporter',
  email: 'juan@test.com',
}

describe('POST /api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    })

    // Profile query
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { tenant_id: 'tenant-1', campaign_ids: ['camp-1'] },
              }),
            }),
          }),
        }
      }
      if (table === 'contacts') {
        return {
          select: () => ({
            eq: mockEq,
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'new-contact-id' }, error: null }),
            }),
          }),
        }
      }
      return mockChain()
    })

    // Default: no duplicate found
    mockEq.mockReturnValue({ eq: mockEq, single: () => Promise.resolve({ data: null }), limit: mockLimit, or: mockOr })
    mockLimit.mockReturnValue({ single: () => Promise.resolve({ data: null }) })
    mockOr.mockReturnValue({ limit: mockLimit })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/contacts', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 422 for invalid body', async () => {
    const req = new Request('http://localhost/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ first_name: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toBe('validation')
  })

  it('returns 201 with id for valid contact', async () => {
    const req = new Request('http://localhost/api/contacts', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('new-contact-id')
  })
})
