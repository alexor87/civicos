import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { TwilioProvider } from '@/lib/messaging/providers/twilio'
import { WHATSAPP_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'

// Twilio sends URL-encoded form data for webhooks
function parseTwilioBody(body: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const pair of body.split('&')) {
    const [key, value] = pair.split('=').map(decodeURIComponent)
    if (key) params[key] = value ?? ''
  }
  return params
}

export async function POST(req: NextRequest) {
  if (!WHATSAPP_CHANNEL_ENABLED) {
    return NextResponse.json({ error: 'whatsapp channel disabled' }, { status: 503 })
  }

  const rawBody = await req.text()
  const params  = parseTwilioBody(rawBody)

  const from        = (params['From'] ?? '').replace('whatsapp:', '')
  const to          = (params['To']   ?? '').replace('whatsapp:', '')
  const messageBody = params['Body']  ?? ''
  const messageSid  = params['MessageSid'] ?? ''

  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const prefixedTo = `whatsapp:${to}`

  const { data: integration } = await supabase
    .from('tenant_integrations')
    .select('tenant_id, campaign_id, twilio_sid, twilio_token, twilio_whatsapp_from')
    .or(`twilio_whatsapp_from.eq.${to},twilio_whatsapp_from.eq.${prefixedTo}`)
    .limit(1)
    .single()

  if (!integration?.campaign_id) {
    return new NextResponse('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  let authToken = process.env.TWILIO_AUTH_TOKEN ?? ''
  if (integration.twilio_token) {
    const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', {
      encrypted: integration.twilio_token,
    })
    if (decrypted) authToken = decrypted
    else authToken = integration.twilio_token
  }

  const sid          = integration.twilio_sid ?? process.env.TWILIO_ACCOUNT_SID ?? ''
  const whatsappFrom = integration.twilio_whatsapp_from ?? process.env.TWILIO_WHATSAPP_FROM ?? ''

  const provider = new TwilioProvider({
    sid,
    authToken,
    smsFrom: null,
    whatsappFrom,
  })

  const signature = req.headers.get('x-twilio-signature')
  const valid = provider.validateInboundSignature(signature, req.url, params)
  if (valid === false) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('campaign_id', integration.campaign_id)
    .eq('phone', from)
    .is('deleted_at', null)
    .single()

  await supabase.from('whatsapp_conversations').insert({
    tenant_id:          integration.tenant_id,
    campaign_id:        integration.campaign_id,
    contact_id:         contact?.id ?? null,
    direction:          'inbound',
    body:               messageBody,
    twilio_message_sid: messageSid,
    status:             'received',
  })

  const { data: chatbotConfig } = await supabase
    .from('whatsapp_chatbot_config')
    .select('*')
    .eq('campaign_id', integration.campaign_id)
    .single()

  if (!chatbotConfig?.enabled) {
    return new NextResponse('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  let replyText = chatbotConfig.fallback_message

  try {
    const aiResult = await callAI(adminSupabase, integration.tenant_id, integration.campaign_id, [
      { role: 'user', content: messageBody },
    ], {
      system: chatbotConfig.system_prompt || 'Eres un asistente de campaña. Responde de forma breve y útil.',
      maxTokens: 500,
    })

    if (aiResult.content) replyText = aiResult.content
  } catch {
    replyText = chatbotConfig.fallback_message
  }

  if (sid && authToken && whatsappFrom) {
    const result = await provider.sendWhatsApp({
      to:   from,
      body: replyText,
    })

    if (result.ok) {
      await supabase.from('whatsapp_conversations').insert({
        tenant_id:          integration.tenant_id,
        campaign_id:        integration.campaign_id,
        contact_id:         contact?.id ?? null,
        direction:          'outbound',
        body:               replyText,
        twilio_message_sid: result.providerMessageId ?? '',
        status:             'sent',
      })
    }
  }

  return new NextResponse(`<Response><Message>${replyText}</Message></Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
