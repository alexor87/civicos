import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { getMessagingProvider } from '@/lib/messaging/dispatcher'
import { MessagingConfigError } from '@/lib/messaging/types'
import { WHATSAPP_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'

interface InfobipInboundResult {
  from?: string
  to?: string
  messageId?: string
  message?: {
    type?: string
    text?: string
  }
}

interface InfobipInboundPayload {
  results?: InfobipInboundResult[]
}

export async function POST(req: NextRequest) {
  if (!WHATSAPP_CHANNEL_ENABLED) {
    return NextResponse.json({ error: 'whatsapp channel disabled' }, { status: 503 })
  }

  let payload: InfobipInboundPayload
  try {
    payload = (await req.json()) as InfobipInboundPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const results = payload.results ?? []
  if (results.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  for (const result of results) {
    const from = (result.from ?? '').trim()
    const to   = (result.to   ?? '').trim()
    const text = result.message?.text ?? ''
    const msgId = result.messageId ?? ''

    if (!from || !to) continue

    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('tenant_id, campaign_id')
      .eq('infobip_whatsapp_from', to)
      .limit(1)
      .single()

    if (!integration?.tenant_id || !integration.campaign_id) continue

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', integration.campaign_id)
      .eq('phone', from.startsWith('+') ? from : `+${from}`)
      .is('deleted_at', null)
      .single()

    await supabase.from('whatsapp_conversations').insert({
      tenant_id:          integration.tenant_id,
      campaign_id:        integration.campaign_id,
      contact_id:         contact?.id ?? null,
      direction:          'inbound',
      body:               text,
      twilio_message_sid: msgId,
      status:             'received',
    })

    const { data: chatbotConfig } = await supabase
      .from('whatsapp_chatbot_config')
      .select('*')
      .eq('campaign_id', integration.campaign_id)
      .single()

    if (!chatbotConfig?.enabled) continue

    let replyText = chatbotConfig.fallback_message
    try {
      const aiResult = await callAI(
        adminSupabase,
        integration.tenant_id,
        integration.campaign_id,
        [{ role: 'user', content: text }],
        {
          system: chatbotConfig.system_prompt || 'Eres un asistente de campaña. Responde de forma breve y útil.',
          maxTokens: 500,
        }
      )
      if (aiResult.content) replyText = aiResult.content
    } catch {
      replyText = chatbotConfig.fallback_message
    }

    try {
      const provider = await getMessagingProvider(
        supabase,
        adminSupabase,
        integration.tenant_id,
        integration.campaign_id,
        'whatsapp'
      )
      const sendResult = await provider.sendWhatsApp({ to: from, body: replyText })
      if (sendResult.ok) {
        await supabase.from('whatsapp_conversations').insert({
          tenant_id:          integration.tenant_id,
          campaign_id:        integration.campaign_id,
          contact_id:         contact?.id ?? null,
          direction:          'outbound',
          body:               replyText,
          twilio_message_sid: sendResult.providerMessageId ?? '',
          status:             'sent',
        })
      }
    } catch (err) {
      if (!(err instanceof MessagingConfigError)) throw err
      // Misconfigured tenant — log and move on so other results still process.
      console.error('[infobip-webhook] provider config error:', err.message)
    }
  }

  return NextResponse.json({ ok: true })
}
