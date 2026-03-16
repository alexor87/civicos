import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── hoisted mocks ──────────────────────────────────────────────────────────────
const {
  mockKeySelect,
  mockKeyUpdate,
  mockContactSelect,
  mockContactInsert,
  mockCampaignSelect,
} = vi.hoisted(() => ({
  mockKeySelect:      vi.fn(),
  mockKeyUpdate:      vi.fn(),
  mockContactSelect:  vi.fn(),
  mockContactInsert:  vi.fn(),
  mockCampaignSelect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === 'api_keys') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({ single: mockKeySelect })),
            })),
          })),
          update: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => mockContactSelect()),
              })),
            })),
          })),
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockContactInsert })) })),
        }
      }
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSelect })) })),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('@/lib/api-keys', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-keys')>()
  return {
    ...actual,
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 59 })),
    hashKey: vi.fn((key: string) => `hash-of-${key}`),
  }
})

import { GET as publicContactsGET, POST as publicContactsPOST } from '@/app/api/public/contacts/route'
import { GET as publicCampaignGET } from '@/app/api/public/campaigns/[id]/route'

const CAMPAIGN_ID = 'camp-1'
const VALID_KEY   = 'cvk_validkey123456789012345678901234567890123456789012'

const SAMPLE_KEY_ROW = {
  id: 'key-1',
  campaign_id: CAMPAIGN_ID,
  scopes: ['contacts:read', 'contacts:write'],
  revoked_at: null,
  key_hash: `hash-of-${VALID_KEY}`,
}

function makeRequest(method: string, path: string, body?: unknown, apiKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockKeySelect.mockResolvedValue({ data: null, error: { message: 'not found' } })
  mockContactSelect.mockResolvedValue({ data: [], count: 0 })
  mockContactInsert.mockResolvedValue({ data: null, error: null })
  mockCampaignSelect.mockResolvedValue({ data: null, error: null })
})

// ── GET /api/public/contacts ──────────────────────────────────────────────────
describe('GET /api/public/contacts', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await publicContactsGET(makeRequest('GET', '/api/public/contacts'))
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid key', async () => {
    mockKeySelect.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const res = await publicContactsGET(makeRequest('GET', '/api/public/contacts', undefined, 'cvk_invalid'))
    expect(res.status).toBe(401)
  })

  it('returns 200 with contacts array for valid key', async () => {
    mockKeySelect.mockResolvedValue({ data: SAMPLE_KEY_ROW, error: null })
    mockContactSelect.mockResolvedValue({ data: [{ id: 'c1', first_name: 'Ana', status: 'supporter' }], count: 1 })
    const res = await publicContactsGET(makeRequest('GET', '/api/public/contacts', undefined, VALID_KEY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns 403 if key lacks contacts:read scope', async () => {
    mockKeySelect.mockResolvedValue({ data: { ...SAMPLE_KEY_ROW, scopes: ['contacts:write'] }, error: null })
    const res = await publicContactsGET(makeRequest('GET', '/api/public/contacts', undefined, VALID_KEY))
    expect(res.status).toBe(403)
  })

  it('includes pagination metadata', async () => {
    mockKeySelect.mockResolvedValue({ data: SAMPLE_KEY_ROW, error: null })
    mockContactSelect.mockResolvedValue({ data: [], count: 0 })
    const res = await publicContactsGET(makeRequest('GET', '/api/public/contacts', undefined, VALID_KEY))
    const body = await res.json()
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('page')
    expect(body).toHaveProperty('per_page')
  })
})

// ── POST /api/public/contacts ─────────────────────────────────────────────────
describe('POST /api/public/contacts', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await publicContactsPOST(makeRequest('POST', '/api/public/contacts', { first_name: 'Ana' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 if key lacks contacts:write scope', async () => {
    mockKeySelect.mockResolvedValue({ data: { ...SAMPLE_KEY_ROW, scopes: ['contacts:read'] }, error: null })
    const res = await publicContactsPOST(makeRequest('POST', '/api/public/contacts', { first_name: 'Ana' }, VALID_KEY))
    expect(res.status).toBe(403)
  })

  it('returns 201 with created contact on success', async () => {
    mockKeySelect.mockResolvedValue({ data: SAMPLE_KEY_ROW, error: null })
    mockContactInsert.mockResolvedValue({
      data: { id: 'new-c', first_name: 'Ana', campaign_id: CAMPAIGN_ID },
      error: null,
    })
    const res = await publicContactsPOST(
      makeRequest('POST', '/api/public/contacts', { first_name: 'Ana', last_name: 'Gómez' }, VALID_KEY)
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('new-c')
  })
})

// ── GET /api/public/campaigns/[id] ───────────────────────────────────────────
describe('GET /api/public/campaigns/[id]', () => {
  const PARAMS = { params: { id: CAMPAIGN_ID } }

  it('returns 401 without Authorization header', async () => {
    const req = makeRequest('GET', `/api/public/campaigns/${CAMPAIGN_ID}`)
    const res = await publicCampaignGET(req, PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 403 if key is for a different campaign', async () => {
    mockKeySelect.mockResolvedValue({ data: { ...SAMPLE_KEY_ROW, campaign_id: 'other-camp' }, error: null })
    const req = makeRequest('GET', `/api/public/campaigns/${CAMPAIGN_ID}`, undefined, VALID_KEY)
    const res = await publicCampaignGET(req, PARAMS)
    expect(res.status).toBe(403)
  })

  it('returns 200 with campaign data for valid key', async () => {
    mockKeySelect.mockResolvedValue({ data: SAMPLE_KEY_ROW, error: null })
    mockCampaignSelect.mockResolvedValue({ data: { id: CAMPAIGN_ID, name: 'Test Campaign', status: 'active' }, error: null })
    const req = makeRequest('GET', `/api/public/campaigns/${CAMPAIGN_ID}`, undefined, VALID_KEY)
    const res = await publicCampaignGET(req, PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(CAMPAIGN_ID)
  })
})
