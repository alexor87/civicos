import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI, AiNotConfiguredError } from '@/lib/ai/call-ai'

const mockFetch = vi.fn()
global.fetch = mockFetch

function createMockSupabase(configs: any[] = [], decryptedKey = 'test-api-key') {
  const chainObj = {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: configs }),
      }),
    }),
  }
  const client = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(chainObj),
    }),
    rpc: vi.fn().mockResolvedValue({ data: decryptedKey }),
  }
  return client as any
}

describe('Tenant Isolation — AI Config', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('callAI with wrong tenantId throws AiNotConfiguredError', async () => {
    const supabase = createMockSupabase([])
    await expect(
      callAI(supabase, 'wrong-tenant-id', 'campaign-123', [{ role: 'user', content: 'Hello' }])
    ).rejects.toThrow(AiNotConfiguredError)
  })

  it('callAI with correct tenantId resolves config and calls API', async () => {
    const config = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-ant-test-key')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'OK' }] }),
    })

    const result = await callAI(
      supabase, 'tenant-123', 'campaign-123',
      [{ role: 'user', content: 'Hello' }],
    )
    expect(result.content).toBe('OK')
  })

  it('resolveConfig filters by tenant_id in DB query', async () => {
    const config = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-test')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'OK' }] }),
    })

    await callAI(supabase, 'tenant-ABC', 'campaign-123', [{ role: 'user', content: 'Hi' }])

    // Verify the select chain includes .eq('tenant_id', 'tenant-ABC')
    const selectResult = supabase.from.mock.results[0].value.select.mock.results[0].value
    expect(selectResult.eq).toHaveBeenCalledWith('tenant_id', 'tenant-ABC')
  })

  it('override config bypasses DB entirely — no tenant_id needed', async () => {
    const supabase = createMockSupabase([])
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Override OK' }] }),
    })

    const result = await callAI(
      supabase, 'any-tenant', 'any-campaign',
      [{ role: 'user', content: 'Hello' }],
      { maxTokens: 10 },
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', apiKey: 'direct-key' },
    )

    expect(result.content).toBe('Override OK')
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
