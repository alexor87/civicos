import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockProfileSelect,
  mockApiKeySelect,
  mockApiKeyInsert,
  mockApiKeyUpdate,
} = vi.hoisted(() => ({
  mockGetUser:      vi.fn(),
  mockProfileSelect: vi.fn(),
  mockApiKeySelect:  vi.fn(),
  mockApiKeyInsert:  vi.fn(),
  mockApiKeyUpdate:  vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSelect })) })) }
      }
      if (table === 'api_keys') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => mockApiKeySelect()),
              single: mockApiKeySelect,
            })),
          })),
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockApiKeyInsert })) })),
          update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => mockApiKeyUpdate()) })) })),
        }
      }
      return {}
    }),
  })),
}))

import { GET, POST } from '@/app/api/keys/route'
import { DELETE } from '@/app/api/keys/[id]/route'

const CAMPAIGN_ID = 'camp-1'
const KEY_ID      = 'key-uuid-1'

function makeRequest(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/keys', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
  mockApiKeySelect.mockResolvedValue({ data: [] })
  mockApiKeyInsert.mockResolvedValue({ data: null, error: null })
  mockApiKeyUpdate.mockResolvedValue({ data: null, error: null })
})

// ── GET tests ─────────────────────────────────────────────────────────────────
describe('GET /api/keys', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns 200 with empty array when no keys', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockApiKeySelect.mockResolvedValue({ data: [] })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.keys).toEqual([])
  })

  it('returns list of keys without hash', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockApiKeySelect.mockResolvedValue({
      data: [{ id: KEY_ID, name: 'My Key', key_prefix: 'cvk_abc12', scopes: ['contacts:read'], created_at: '2024-01-01T00:00:00Z', last_used_at: null, revoked_at: null, key_hash: 'should-not-appear' }],
    })
    const res = await GET(makeRequest('GET'))
    const body = await res.json()
    expect(body.keys[0].key_hash).toBeUndefined()
    expect(body.keys[0].key_prefix).toBe('cvk_abc12')
  })
})

// ── POST tests ────────────────────────────────────────────────────────────────
describe('POST /api/keys', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await POST(makeRequest('POST', { name: 'Key 1', scopes: ['contacts:read'] }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for volunteer role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'volunteer' } })
    const res = await POST(makeRequest('POST', { name: 'Key 1', scopes: ['contacts:read'] }))
    expect(res.status).toBe(403)
  })

  it('returns 400 if name is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    const res = await POST(makeRequest('POST', { scopes: ['contacts:read'] }))
    expect(res.status).toBe(400)
  })

  it('returns 201 with full key on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    mockApiKeyInsert.mockResolvedValue({
      data: { id: KEY_ID, name: 'Key 1', key_prefix: 'cvk_abc12', scopes: ['contacts:read'], created_at: '2024-01-01T00:00:00Z', revoked_at: null },
      error: null,
    })
    const res = await POST(makeRequest('POST', { name: 'Key 1', scopes: ['contacts:read'] }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.key).toMatch(/^cvk_/)
    expect(body.api_key.id).toBe(KEY_ID)
  })
})

// ── DELETE tests ──────────────────────────────────────────────────────────────
describe('DELETE /api/keys/[id]', () => {
  const PARAMS = { params: { id: KEY_ID } }

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest(`http://localhost/api/keys/${KEY_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns 403 for volunteer role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'volunteer' } })
    const req = new NextRequest(`http://localhost/api/keys/${KEY_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, PARAMS)
    expect(res.status).toBe(403)
  })

  it('returns 200 on successful revoke', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' } })
    const req = new NextRequest(`http://localhost/api/keys/${KEY_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
