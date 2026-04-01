import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Journey Runner — ejecuta automatizaciones programadas
// Triggered by: pg_cron every minute (via net.http_post)
// Can also be invoked manually via: POST /functions/v1/journey-runner
//   with header: x-cron-secret: <CRON_SECRET>

interface JourneyNodeData {
  label?:             string
  subject?:           string
  body?:              string
  days?:              number
  hours?:             number
  minutes?:           number
  emailCampaignId?:   string
  emailCampaignName?: string
}

interface JourneyNode {
  id:   string
  type: 'trigger' | 'email' | 'sms' | 'wait'
  data: JourneyNodeData
}

interface JourneyEdge {
  id:     string
  source: string
  target: string
}

interface Journey {
  id:           string
  campaign_id:  string
  nodes:        JourneyNode[]
  edges:        JourneyEdge[]
  status:       string
}

interface TwilioConfig {
  twilio_sid?:   string | null
  twilio_token?: string | null
  twilio_from?:  string | null
}

interface Contact {
  id:         string
  email:      string | null
  first_name: string | null
  phone:      string | null
}

interface Enrollment {
  id:           string
  current_node: string | null
  journey:      Journey
  contact:      Contact
}

Deno.serve(async (req: Request) => {
  // Auth
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // Fetch due enrollments
  const { data: enrollments, error } = await supabase
    .from('journey_enrollments')
    .select('*, journey:journeys(*), contact:contacts(id, email, first_name, phone)')
    .eq('status', 'active')
    .lte('next_run_at', new Date().toISOString())

  if (error) {
    console.error('journey-runner: fetch error', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!enrollments?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
  }

  const RESEND_API_KEY_FALLBACK = Deno.env.get('RESEND_API_KEY')

  // Cache integration configs per campaign to avoid repeated DB calls
  interface IntegrationCache {
    resend_api_key?: string | null
    resend_domain?: string | null
    twilio_sid?: string | null
    twilio_token?: string | null
    twilio_from?: string | null
  }
  const integrationCache = new Map<string, IntegrationCache>()

  async function getIntegrationForCampaign(campaignId: string): Promise<IntegrationCache> {
    if (integrationCache.has(campaignId)) return integrationCache.get(campaignId)!

    // Get tenant_id from campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('tenant_id')
      .eq('id', campaignId)
      .single()

    if (!campaign?.tenant_id) {
      integrationCache.set(campaignId, {})
      return {}
    }

    const { data: row } = await supabase
      .from('tenant_integrations')
      .select('resend_api_key, resend_domain, twilio_sid, twilio_token, twilio_from')
      .eq('tenant_id', campaign.tenant_id)
      .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      .order('campaign_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()

    const config: IntegrationCache = row ?? {}

    // Decrypt sensitive fields
    if (config.resend_api_key) {
      const { data: decrypted } = await supabase.rpc('decrypt_integration_key', { encrypted: config.resend_api_key })
      if (decrypted) config.resend_api_key = decrypted
    }
    if (config.twilio_token) {
      const { data: decrypted } = await supabase.rpc('decrypt_integration_key', { encrypted: config.twilio_token })
      if (decrypted) config.twilio_token = decrypted
    }

    integrationCache.set(campaignId, config)
    return config
  }

  let processed = 0

  for (const enrollment of enrollments as Enrollment[]) {
    try {
      const journey = enrollment.journey
      if (!journey) continue

      const nodes = journey.nodes as JourneyNode[]
      const edges = journey.edges as JourneyEdge[]
      const currentNodeId = enrollment.current_node
      if (!currentNodeId) continue

      const currentNode = nodes.find(n => n.id === currentNodeId)
      if (!currentNode) continue

      // Execute current node
      if (currentNode.type === 'email') {
        const toEmail = enrollment.contact.email
        const intConfig = await getIntegrationForCampaign(journey.campaign_id)
        const resendKey = intConfig.resend_api_key || RESEND_API_KEY_FALLBACK
        if (toEmail && resendKey) {
          const body = (currentNode.data.body ?? '')
            .replace('{nombre}', enrollment.contact.first_name ?? 'Contacto')
          const fromDomain = intConfig.resend_domain || 'civicos.app'

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from:    `noreply@${fromDomain}`,
              to:      toEmail,
              subject: currentNode.data.subject ?? '(Sin asunto)',
              html:    body || `<p>${body}</p>`,
            }),
          })
        }
      } else if (currentNode.type === 'sms') {
        const toPhone = enrollment.contact.phone
        if (toPhone) {
          const intConfig = await getIntegrationForCampaign(journey.campaign_id)
          const sid   = intConfig.twilio_sid   || Deno.env.get('TWILIO_ACCOUNT_SID') || ''
          const token = intConfig.twilio_token || Deno.env.get('TWILIO_AUTH_TOKEN')  || ''
          const from  = intConfig.twilio_from  || Deno.env.get('TWILIO_FROM_NUMBER') || ''
          if (sid && token && from) {
            const smsBody = (currentNode.data.body ?? '')
              .replace('{nombre}', enrollment.contact.first_name ?? 'Contacto')
            const credentials = btoa(`${sid}:${token}`)
            await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
              {
                method:  'POST',
                headers: {
                  'Authorization': `Basic ${credentials}`,
                  'Content-Type':  'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  From: from,
                  To:   toPhone,
                  Body: smsBody,
                }).toString(),
              }
            )
          }
        }
      }

      // Find next node
      const nextEdge = edges.find(e => e.source === currentNodeId)
      const nextNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null

      if (!nextNode) {
        // No more nodes — complete enrollment
        await supabase
          .from('journey_enrollments')
          .update({ status: 'completed' })
          .eq('id', enrollment.id)
      } else if (nextNode.type === 'wait') {
        // Schedule next run after wait period
        const d = (nextNode.data.days    ?? 0)
        const h = (nextNode.data.hours   ?? 0)
        const m = (nextNode.data.minutes ?? 0)
        const totalMs = ((d * 24 * 60 * 60) + (h * 60 * 60) + (m * 60)) * 1000
        const nextRunAt = new Date(Date.now() + (totalMs || 60_000)).toISOString()

        // Advance to node after wait
        const afterWaitEdge = edges.find(e => e.source === nextNode.id)
        await supabase
          .from('journey_enrollments')
          .update({
            current_node: afterWaitEdge?.target ?? nextNode.id,
            next_run_at:  nextRunAt,
          })
          .eq('id', enrollment.id)
      } else {
        // Advance immediately to next action node
        await supabase
          .from('journey_enrollments')
          .update({
            current_node: nextNode.id,
            next_run_at:  new Date().toISOString(),
          })
          .eq('id', enrollment.id)
      }

      processed++
    } catch (err) {
      console.error('journey-runner: enrollment error', enrollment.id, err)
    }
  }

  console.log(`journey-runner: processed ${processed} enrollments`)
  return new Response(JSON.stringify({ processed }), { status: 200 })
})
