/**
 * AI Router — Node.js version for Next.js server actions / API routes
 *
 * Reads tenant_ai_config from DB, decrypts API key, and calls the
 * configured provider's API using native fetch(). No SDK imports.
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ── Types ────────────────────────────────────────────────────────────────────

export type AiProvider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'groq'

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CallAiOptions {
  system?: string
  maxTokens?: number
  temperature?: number
}

export interface AiOverrideConfig {
  provider: AiProvider
  model: string
  apiKey: string
}

export interface AiResult {
  content: string
}

// ── Error class ──────────────────────────────────────────────────────────────

export class AiNotConfiguredError extends Error {
  constructor(campaignId: string) {
    super(`No AI configuration found for campaign ${campaignId}. Configure your AI model in Settings > Integrations.`)
    this.name = 'AiNotConfiguredError'
  }
}

// ── Config resolution ────────────────────────────────────────────────────────

interface DbConfig {
  provider: AiProvider
  model: string
  apiKey: string
}

async function resolveConfig(
  supabase: SupabaseClient,
  tenantId: string,
  campaignId: string,
  override?: AiOverrideConfig,
): Promise<DbConfig> {
  if (override) {
    return { provider: override.provider, model: override.model, apiKey: override.apiKey }
  }

  const { data: configs } = await supabase
    .from('tenant_ai_config')
    .select('provider, model, api_key_encrypted, campaign_id')
    .eq('tenant_id', tenantId)
    .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
    .order('campaign_id', { ascending: false, nullsFirst: false })
    .limit(2)

  const config = configs?.find((c: any) => c.campaign_id === campaignId)
    ?? configs?.find((c: any) => c.campaign_id === null)

  if (!config) {
    throw new AiNotConfiguredError(campaignId)
  }

  const { data: decrypted } = await supabase.rpc('decrypt_ai_key', {
    encrypted: config.api_key_encrypted,
  })

  if (!decrypted) {
    throw new Error('Failed to decrypt AI API key')
  }

  return {
    provider: config.provider as AiProvider,
    model: config.model,
    apiKey: decrypted as string,
  }
}

// ── Provider-specific API calls ──────────────────────────────────────────────

async function callAnthropic(config: DbConfig, messages: AiMessage[], opts: CallAiOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: opts.maxTokens ?? 1024,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  }
  if (opts.system) body.system = opts.system
  if (opts.temperature !== undefined) body.temperature = opts.temperature

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function callOpenAICompatible(
  endpoint: string,
  config: DbConfig,
  messages: AiMessage[],
  opts: CallAiOptions,
): Promise<string> {
  const allMessages: Array<{ role: string; content: string }> = []
  if (opts.system) allMessages.push({ role: 'system', content: opts.system })
  allMessages.push(...messages.map(m => ({ role: m.role, content: m.content })))

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: opts.maxTokens ?? 1024,
    messages: allMessages,
  }
  if (opts.temperature !== undefined) body.temperature = opts.temperature

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGoogle(config: DbConfig, messages: AiMessage[], opts: CallAiOptions): Promise<string> {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

  if (opts.system) {
    contents.push({ role: 'user', parts: [{ text: opts.system }] })
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] })
  }

  for (const m of messages) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
    },
  }
  if (opts.temperature !== undefined) {
    (body.generationConfig as Record<string, unknown>).temperature = opts.temperature
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google AI error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Main entry point ─────────────────────────────────────────────────────────

const OPENAI_ENDPOINTS: Record<string, string> = {
  openai:  'https://api.openai.com/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  groq:    'https://api.groq.com/openai/v1/chat/completions',
}

export async function callAI(
  supabase: SupabaseClient,
  tenantId: string,
  campaignId: string,
  messages: AiMessage[],
  options: CallAiOptions = {},
  _overrideConfig?: AiOverrideConfig,
): Promise<AiResult> {
  const config = await resolveConfig(supabase, tenantId, campaignId, _overrideConfig)

  let content: string

  if (config.provider === 'anthropic') {
    content = await callAnthropic(config, messages, options)
  } else if (config.provider === 'google') {
    content = await callGoogle(config, messages, options)
  } else {
    const endpoint = OPENAI_ENDPOINTS[config.provider]
    if (!endpoint) throw new Error(`Unknown provider: ${config.provider}`)
    content = await callOpenAICompatible(endpoint, config, messages, options)
  }

  return { content }
}
