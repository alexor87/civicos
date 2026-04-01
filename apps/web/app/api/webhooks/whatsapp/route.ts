import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'

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
  const rawBody = await req.text()
  const params  = parseTwilioBody(rawBody)

  const from        = (params['From'] ?? '').replace('whatsapp:', '')
  const to          = (params['To']   ?? '').replace('whatsapp:', '')
  const messageBody = params['Body']  ?? ''
  const messageSid  = params['MessageSid'] ?? ''

  // Find which tenant_integrations row owns this "To" number
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: integrationRow } = await supabase
    .from('tenant_integrations')
    .select('id, tenant_id, campaign_id, twilio_sid, twilio_token, twilio_whatsapp_from')
    .eq('twilio_whatsapp_from', to)
    .limit(1)
    .single()

  const { data: integrationRowPrefixed } = !integrationRow
    ? await supabase
        .from('tenant_integrations')
        .select('id, tenant_id, campaign_id, twilio_sid, twilio_token, twilio_whatsapp_from')
        .eq('twilio_whatsapp_from', `whatsapp:${to}`)
        .limit(1)
        .single()
    : { data: null }

  const integration = integrationRow ?? integrationRowPrefixed
  if (!integration?.campaign_id) {
    return new NextResponse('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Build a campaign-like object for downstream use
  const campaign = {
    id: integration.campaign_id,
    tenant_id: integration.tenant_id,
    twilio_sid: integration.twilio_sid,
    twilio_token: integration.twilio_token,
    twilio_whatsapp_from: integration.twilio_whatsapp_from,
  }

  // Decrypt token for signature validation
  let authToken = process.env.TWILIO_AUTH_TOKEN ?? ''
  if (campaign.twilio_token) {
    const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', { encrypted: campaign.twilio_token })
    if (decrypted) authToken = decrypted
    else authToken = campaign.twilio_token // plain text fallback from migration
  }

  const signature  = req.headers.get('x-twilio-signature') ?? ''
  const requestUrl = req.url

  if (authToken) {
    const valid = twilio.validateRequest(authToken, signature, requestUrl, params)
    if (!valid) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Find contact by phone number
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('campaign_id', campaign.id)
    .eq('phone', from)
    .single()

  // Log inbound message
  await supabase.from('whatsapp_conversations').insert({
    tenant_id:          campaign.tenant_id,
    campaign_id:        campaign.id,
    contact_id:         contact?.id ?? null,
    direction:          'inbound',
    body:               messageBody,
    twilio_message_sid: messageSid,
    status:             'received',
  })

  // Check chatbot config
  const { data: chatbotConfig } = await supabase
    .from('whatsapp_chatbot_config')
    .select('*')
    .eq('campaign_id', campaign.id)
    .single()

  if (!chatbotConfig?.enabled) {
    return new NextResponse('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Generate AI reply
  let replyText   = chatbotConfig.fallback_message

  try {
    const aiResult = await callAI(adminSupabase, campaign.tenant_id, campaign.id, [
      { role: 'user', content: messageBody },
    ], {
      system: chatbotConfig.system_prompt || 'Eres un asistente de campaña. Responde de forma breve y útil.',
      maxTokens: 500,
    })

    if (aiResult.content) {
      replyText = aiResult.content
    }
  } catch {
    replyText = chatbotConfig.fallback_message
  }

  // Send reply via Twilio
  const twilioSid    = campaign.twilio_sid   ?? process.env.TWILIO_ACCOUNT_SID ?? ''
  const twilioToken2 = authToken // already decrypted above
  const fromNumber   = campaign.twilio_whatsapp_from as string

  if (twilioSid && twilioToken2 && fromNumber) {
    const client = twilio(twilioSid, twilioToken2)
    const normalizedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`
    const normalizedTo   = `whatsapp:${from}`

    try {
      const outMsg = await client.messages.create({
        from: normalizedFrom,
        to:   normalizedTo,
        body: replyText,
      })

      await supabase.from('whatsapp_conversations').insert({
        tenant_id:          campaign.tenant_id,
        campaign_id:        campaign.id,
        contact_id:         contact?.id ?? null,
        direction:          'outbound',
        body:               replyText,
        twilio_message_sid: outMsg.sid,
        status:             'sent',
      })
    } catch { /* log and continue */ }
  }

  return new NextResponse(`<Response><Message>${replyText}</Message></Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
