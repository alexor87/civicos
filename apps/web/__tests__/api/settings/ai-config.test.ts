import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUser = { id: 'user-1' }
const mockProfile = {
  tenant_id: 'tenant-1',
  campaign_ids: ['camp-1'],
  role: 'super_admin',
}

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockAdminFrom = vi.fn()
const mockAdminRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser, getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }) },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
    rpc: mockAdminRpc,
  })),
}))

// Mock fetch for verify call
const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockChain(data: any) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data }),
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: data ? [data] : [] }),
          }),
        }),
        is: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AI Config API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(mockChain(mockProfile))
    mockAdminFrom.mockReturnValue(mockChain(null))
    mockAdminRpc.mockResolvedValue({ data: 'encrypted-value' })
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ valid: true }) })
  })

  it('GET returns configured: false when no config exists', async () => {
    const { GET } = await import('@/app/api/settings/ai-config/route')
    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(false)
  })

  it('GET returns config when it exists', async () => {
    const existingConfig = {
      id: 'config-1',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      api_key_hint: 'sk-a...xy12',
      is_valid: true,
      campaign_id: 'camp-1',
      updated_at: '2026-03-01',
    }
    mockAdminFrom.mockReturnValue(mockChain(existingConfig))

    const { GET } = await import('@/app/api/settings/ai-config/route')
    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(true)
    expect(data.provider).toBe('anthropic')
    expect(data.model).toBe('claude-sonnet-4-5-20250514')
  })

  it('POST returns 401 for unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/settings/ai-config/route')
    const req = new Request('http://localhost/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', model: 'claude-sonnet-4-5-20250514', apiKey: 'sk-test' }),
    })

    const response = await POST(req as any)
    expect(response.status).toBe(401)
  })

  it('POST returns 403 for non-admin users', async () => {
    const volunteerProfile = { ...mockProfile, role: 'volunteer' }
    mockFrom.mockReturnValue(mockChain(volunteerProfile))

    const { POST } = await import('@/app/api/settings/ai-config/route')
    const req = new Request('http://localhost/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', model: 'claude-sonnet-4-5-20250514', apiKey: 'sk-test' }),
    })

    const response = await POST(req as any)
    expect(response.status).toBe(403)
  })

  it('POST returns 400 when missing fields', async () => {
    const { POST } = await import('@/app/api/settings/ai-config/route')
    const req = new Request('http://localhost/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic' }), // missing model and apiKey
    })

    const response = await POST(req as any)
    expect(response.status).toBe(400)
  })

  it('DELETE returns 401 for unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { DELETE } = await import('@/app/api/settings/ai-config/route')
    const req = new Request('http://localhost/api/settings/ai-config?id=config-1', { method: 'DELETE' })

    const response = await DELETE(req as any)
    expect(response.status).toBe(401)
  })
})
