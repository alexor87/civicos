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

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

  // Cache Twilio configs per campaign to avoid repeated DB calls
  const twilioCache = new Map<string, TwilioConfig>()
  async function getTwilioConfig(campaignId: string): Promise<TwilioConfig> {
    if (twilioCache.has(campaignId)) return twilioCache.get(campaignId)!
    const { data } = await supabase
      .from('campaigns')
      .select('twilio_sid, twilio_token, twilio_from')
      .eq('id', campaignId)
      .single()
    const config: TwilioConfig = data ?? {}
    twilioCache.set(campaignId, config)
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
        if (toEmail && RESEND_API_KEY) {
          const body = (currentNode.data.body ?? '')
            .replace('{nombre}', enrollment.contact.first_name ?? 'Contacto')

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from:    'noreply@civicos.app',
              to:      toEmail,
              subject: currentNode.data.subject ?? '(Sin asunto)',
              html:    body || `<p>${body}</p>`,
            }),
          })
        }
      } else if (currentNode.type === 'sms') {
        const toPhone = enrollment.contact.phone
        if (toPhone) {
          const twilio = await getTwilioConfig(journey.campaign_id)
          if (twilio.twilio_sid && twilio.twilio_token && twilio.twilio_from) {
            const smsBody = (currentNode.data.body ?? '')
              .replace('{nombre}', enrollment.contact.first_name ?? 'Contacto')
            const credentials = btoa(`${twilio.twilio_sid}:${twilio.twilio_token}`)
            await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilio.twilio_sid}/Messages.json`,
              {
                method:  'POST',
                headers: {
                  'Authorization': `Basic ${credentials}`,
                  'Content-Type':  'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  From: twilio.twilio_from,
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
