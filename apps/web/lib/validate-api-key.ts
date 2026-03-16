import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { hashKey, checkRateLimit } from '@/lib/api-keys'

export interface ApiKeyContext {
  campaignId: string
  scopes: string[]
  keyHash: string
}

export async function validateApiKey(
  req: NextRequest,
  supabase: SupabaseClient
): Promise<{ ctx: ApiKeyContext } | { error: NextResponse }> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  if (!key) {
    return { error: NextResponse.json({ error: 'Missing API key' }, { status: 401 }) }
  }

  const keyHash = hashKey(key)

  // Rate limiting check
  const { allowed, remaining } = checkRateLimit(keyHash)
  if (!allowed) {
    return {
      error: NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      ),
    }
  }

  // Look up key in DB
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, campaign_id, scopes, revoked_at, key_hash')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single()

  if (error || !apiKey) {
    return { error: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }) }
  }

  // Update last_used_at — errors are intentionally ignored
  try {
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
  } catch { /* ignore */ }

  return {
    ctx: {
      campaignId: apiKey.campaign_id,
      scopes: apiKey.scopes,
      keyHash,
    },
  }
}

export function hasScope(ctx: ApiKeyContext, scope: string): boolean {
  return ctx.scopes.includes(scope)
}
