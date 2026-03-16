import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

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

  // Find which campaign owns this "To" number
  const supabase = await createClient()

  const { data: campaignRow } = await supabase
    .from('campaigns')
    .select('id, tenant_id, twilio_sid, twilio_token, twilio_whatsapp_from')
    .eq('twilio_whatsapp_from', to)
    .single()

  // If no campaign found, try with whatsapp: prefix stored
  const { data: campaignRowPrefixed } = !campaignRow
    ? await supabase
        .from('campaigns')
        .select('id, tenant_id, twilio_sid, twilio_token, twilio_whatsapp_from')
        .eq('twilio_whatsapp_from', `whatsapp:${to}`)
        .single()
    : { data: null }

  const campaign = campaignRow ?? campaignRowPrefixed
  if (!campaign) {
    // Return empty TwiML — no campaign matches this number
    return new NextResponse('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Validate Twilio signature
  const authToken  = campaign.twilio_token ?? process.env.TWILIO_AUTH_TOKEN ?? ''
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
  const anthropic = new Anthropic()
  let replyText   = chatbotConfig.fallback_message

  try {
    const aiResponse = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 500,
      system:     chatbotConfig.system_prompt || 'Eres un asistente de campaña. Responde de forma breve y útil.',
      messages:   [{ role: 'user', content: messageBody }],
    })

    const firstContent = aiResponse.content[0]
    if (firstContent.type === 'text') {
      replyText = firstContent.text
    }
  } catch {
    replyText = chatbotConfig.fallback_message
  }

  // Send reply via Twilio
  const twilioSid    = campaign.twilio_sid   ?? process.env.TWILIO_ACCOUNT_SID ?? ''
  const twilioToken2 = campaign.twilio_token ?? process.env.TWILIO_AUTH_TOKEN  ?? ''
  const fromNumber   = (campaign as Record<string, unknown>).twilio_whatsapp_from as string

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
