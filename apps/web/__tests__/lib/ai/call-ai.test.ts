import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callAI, AiNotConfiguredError } from '@/lib/ai/call-ai'

// ── Mock fetch ──────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Mock Supabase client ────────────────────────────────────────────────────

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

// ── Tests ───────────────────────────────────────────────────────────────────

describe('callAI', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws AiNotConfiguredError when no config found', async () => {
    const supabase = createMockSupabase([])

    await expect(
      callAI(supabase, 'tenant-123', 'campaign-123', [{ role: 'user', content: 'Hello' }])
    ).rejects.toThrow(AiNotConfiguredError)
  })

  it('calls Anthropic API with correct headers', async () => {
    const config = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-ant-test-key')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Hello back' }] }),
    })

    const result = await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
      { maxTokens: 100 },
    )

    expect(result.content).toBe('Hello back')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test-key',
          'anthropic-version': '2023-06-01',
        }),
      }),
    )
  })

  it('calls OpenAI API with correct format', async () => {
    const config = {
      provider: 'openai',
      model: 'gpt-4o',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-openai-test')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'GPT response' } }] }),
    })

    const result = await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
      { system: 'Be helpful' },
    )

    expect(result.content).toBe('GPT response')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer sk-openai-test',
        }),
      }),
    )
  })

  it('calls Google AI API with correct URL format', async () => {
    const config = {
      provider: 'google',
      model: 'gemini-2.0-flash',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'AIza-test-key')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
      }),
    })

    const result = await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
    )

    expect(result.content).toBe('Gemini response')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.any(Object),
    )
  })

  it('calls Groq API via OpenAI-compatible endpoint', async () => {
    const config = {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'gsk-test')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Groq response' } }] }),
    })

    const result = await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
    )

    expect(result.content).toBe('Groq response')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.any(Object),
    )
  })

  it('calls Mistral API via OpenAI-compatible endpoint', async () => {
    const config = {
      provider: 'mistral',
      model: 'mistral-large-latest',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-mistral-test')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Mistral response' } }] }),
    })

    const result = await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
    )

    expect(result.content).toBe('Mistral response')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/chat/completions',
      expect.any(Object),
    )
  })

  it('uses override config without querying DB', async () => {
    const supabase = createMockSupabase([]) // Empty — would throw if queried

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Override OK' }] }),
    })

    const result = await callAI(
      supabase,
      'tenant-123',
      'any-campaign',
      [{ role: 'user', content: 'Say OK' }],
      { maxTokens: 10 },
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', apiKey: 'direct-key' },
    )

    expect(result.content).toBe('Override OK')
    // Should NOT have called supabase.from (no DB query)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('throws on API error response', async () => {
    const config = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-ant-test')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    })

    await expect(
      callAI(supabase, 'tenant-123', 'campaign-123', [{ role: 'user', content: 'Hello' }])
    ).rejects.toThrow('Anthropic API error 401')
  })

  it('passes system prompt correctly for Anthropic', async () => {
    const config = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250514',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-ant-test')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'OK' }] }),
    })

    await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
      { system: 'You are a helpful assistant', maxTokens: 500 },
    )

    const bodyStr = mockFetch.mock.calls[0][1].body
    const body = JSON.parse(bodyStr)
    expect(body.system).toBe('You are a helpful assistant')
    expect(body.max_tokens).toBe(500)
  })

  it('passes system as message for OpenAI', async () => {
    const config = {
      provider: 'openai',
      model: 'gpt-4o',
      api_key_encrypted: 'encrypted-key',
      campaign_id: 'campaign-123',
    }
    const supabase = createMockSupabase([config], 'sk-openai-test')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
    })

    await callAI(
      supabase,
      'tenant-123',
      'campaign-123',
      [{ role: 'user', content: 'Hello' }],
      { system: 'Be concise' },
    )

    const bodyStr = mockFetch.mock.calls[0][1].body
    const body = JSON.parse(bodyStr)
    expect(body.messages[0]).toEqual({ role: 'system', content: 'Be concise' })
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Hello' })
  })

  it('does not return config when tenantId does not match', async () => {
    // Even with valid configs, wrong tenantId means the .eq('tenant_id', ...) filter
    // returns empty, so it should throw AiNotConfiguredError
    const supabase = createMockSupabase([]) // Empty result = no matching config

    await expect(
      callAI(supabase, 'wrong-tenant', 'campaign-123', [{ role: 'user', content: 'Hello' }])
    ).rejects.toThrow(AiNotConfiguredError)
  })
})
