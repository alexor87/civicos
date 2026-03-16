import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockProfileSelect,
  mockContactSelect,
  mockVisitSelect,
  mockContactUpdate,
} = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockProfileSelect: vi.fn(),
  mockContactSelect: vi.fn(),
  mockVisitSelect:   vi.fn(),
  mockContactUpdate: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSelect })) })) }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockContactSelect,
              order: vi.fn(() => mockVisitSelect()),
            })),
          })),
          update: vi.fn(() => ({ eq: vi.fn(() => mockContactUpdate()) })),
        }
      }
      if (table === 'canvass_visits') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => mockVisitSelect()),
            })),
          })),
        }
      }
      return {}
    }),
  })),
}))

import { GET, DELETE } from '@/app/api/contacts/[id]/personal-data/route'

const CONTACT_ID = 'contact-1'
const CAMPAIGN_ID = 'camp-1'

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/contacts/${CONTACT_ID}/personal-data`, { method: 'GET' })
}
function makeDeleteRequest() {
  return new NextRequest(`http://localhost/api/contacts/${CONTACT_ID}/personal-data`, { method: 'DELETE' })
}

const PARAMS = { params: { id: CONTACT_ID } }

const SAMPLE_CONTACT = {
  id: CONTACT_ID, campaign_id: CAMPAIGN_ID,
  first_name: 'Ana', last_name: 'García',
  email: 'ana@test.com', phone: '3001234567',
  address: 'Calle 1 #2-3', city: 'Bogotá', district: null,
  document_type: 'CC', document_number: '123456',
  birth_date: '1990-01-01', gender: 'F',
  department: 'Cundinamarca', municipality: 'Bogotá',
  commune: null, voting_place: null, voting_table: null,
  status: 'supporter', tags: ['activo'], notes: 'Nota',
  metadata: {}, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
  mockContactSelect.mockResolvedValue({ data: null, error: null })
  mockVisitSelect.mockResolvedValue({ data: [] })
  mockContactUpdate.mockReturnValue({ error: null })
})

// ── GET tests ────────────────────────────────────────────────────────────────
describe('GET /api/contacts/[id]/personal-data', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await GET(makeGetRequest(), PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 404 when contact not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const res = await GET(makeGetRequest(), PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 403 when contact belongs to different campaign', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: ['other-camp'], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT, error: null })
    const res = await GET(makeGetRequest(), PARAMS)
    expect(res.status).toBe(403)
  })

  it('returns 200 with contact data and correct content-type', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT, error: null })
    const res = await GET(makeGetRequest(), PARAMS)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('sets Content-Disposition with attachment and contact id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT, error: null })
    const res = await GET(makeGetRequest(), PARAMS)
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toContain('attachment')
    expect(disposition).toContain(CONTACT_ID)
  })

  it('response body contains contact name and email', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT, error: null })
    const res = await GET(makeGetRequest(), PARAMS)
    const body = await res.json()
    expect(body.contact.first_name).toBe('Ana')
    expect(body.contact.email).toBe('ana@test.com')
    expect(body.exported_at).toBeTruthy()
  })

  it('super_admin can access contact from any campaign', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: ['other-camp'], role: 'super_admin' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT, error: null })
    const res = await GET(makeGetRequest(), PARAMS)
    expect(res.status).toBe(200)
  })
})

// ── DELETE tests ─────────────────────────────────────────────────────────────
describe('DELETE /api/contacts/[id]/personal-data', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await DELETE(makeDeleteRequest(), PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 403 for volunteer role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'volunteer' } })
    const res = await DELETE(makeDeleteRequest(), PARAMS)
    expect(res.status).toBe(403)
  })

  it('returns 403 for analyst role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'analyst' } })
    const res = await DELETE(makeDeleteRequest(), PARAMS)
    expect(res.status).toBe(403)
  })

  it('returns 404 when contact not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: null })
    const res = await DELETE(makeDeleteRequest(), PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 200 with anonymized_at on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT })
    const res = await DELETE(makeDeleteRequest(), PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.anonymized_at).toBeTruthy()
  })

  it('returns 500 when update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockContactSelect.mockResolvedValue({ data: SAMPLE_CONTACT })
    mockContactUpdate.mockReturnValue({ error: { message: 'db error' } })
    const res = await DELETE(makeDeleteRequest(), PARAMS)
    expect(res.status).toBe(500)
  })
})
