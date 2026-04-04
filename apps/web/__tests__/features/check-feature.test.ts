import { describe, it, expect, vi } from 'vitest'
import { checkFeature, getFeatureValue } from '@/lib/features/check-feature'
import type { SupabaseClient } from '@supabase/supabase-js'

function createMockSupabase(rpcResult: { data: unknown }): SupabaseClient {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as SupabaseClient
}

const TENANT_ID = 'tenant-123'

describe('checkFeature()', () => {
  it('returns true for a boolean feature resolved to true', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: true }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith('resolve_tenant_feature', {
      p_tenant_id: TENANT_ID,
      p_feature_key: 'territory_map',
    })
  })

  it('returns false for a boolean feature resolved to false', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: false }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(false)
  })

  it('returns false when data is null', async () => {
    const supabase = createMockSupabase({ data: null })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(false)
  })

  it('returns false when data is an empty array', async () => {
    const supabase = createMockSupabase({ data: [] })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(false)
  })

  it('returns false when data is not an array', async () => {
    const supabase = createMockSupabase({ data: 'not-array' })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(false)
  })

  it('returns true for a numeric value > 0', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: 500 }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'contact_limit')
    expect(result).toBe(true)
  })

  it('returns true for numeric value -1 (unlimited)', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: -1 }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'contact_limit')
    expect(result).toBe(true)
  })

  it('returns false for numeric value 0', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: 0 }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'contact_limit')
    expect(result).toBe(false)
  })

  it('returns true for string "true"', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: 'true' }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(true)
  })

  it('returns false for string "false"', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: 'false' }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(false)
  })

  it('returns true for a non-empty array', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: ['openai'] }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'ai_providers')
    expect(result).toBe(true)
  })

  it('returns false for an empty array', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: [] }],
    })
    const result = await checkFeature(supabase, TENANT_ID, 'ai_providers')
    expect(result).toBe(false)
  })
})

describe('getFeatureValue()', () => {
  it('returns the raw resolved value', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: 1000 }],
    })
    const result = await getFeatureValue<number>(supabase, TENANT_ID, 'contact_limit')
    expect(result).toBe(1000)
  })

  it('returns an array value', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: ['openai', 'anthropic'] }],
    })
    const result = await getFeatureValue<string[]>(supabase, TENANT_ID, 'ai_providers')
    expect(result).toEqual(['openai', 'anthropic'])
  })

  it('returns a boolean value', async () => {
    const supabase = createMockSupabase({
      data: [{ resolved_value: true }],
    })
    const result = await getFeatureValue<boolean>(supabase, TENANT_ID, 'territory_map')
    expect(result).toBe(true)
  })

  it('returns null when data is null', async () => {
    const supabase = createMockSupabase({ data: null })
    const result = await getFeatureValue(supabase, TENANT_ID, 'territory_map')
    expect(result).toBeNull()
  })

  it('returns null when data is empty array', async () => {
    const supabase = createMockSupabase({ data: [] })
    const result = await getFeatureValue(supabase, TENANT_ID, 'territory_map')
    expect(result).toBeNull()
  })

  it('returns null when data is not an array', async () => {
    const supabase = createMockSupabase({ data: 'not-array' })
    const result = await getFeatureValue(supabase, TENANT_ID, 'territory_map')
    expect(result).toBeNull()
  })
})
