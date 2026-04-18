import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: public-contact-register
// Handles public registration from unete.scrutix.co/[slug]
// No JWT required — uses anon key + reCAPTCHA + rate limiting.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

interface RegistrationPayload {
  campaign_id: string
  first_name: string
  last_name: string
  phone: string
  document_type?: string
  document_number?: string
  email?: string
  department?: string
  municipality?: string
  district?: string
  gender?: string
  age_group?: string
  data_authorization: boolean
  referrer_code?: string
  honeypot?: string
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    let body: RegistrationPayload
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400)
    }

    console.log('[public-register] Request received for campaign:', body.campaign_id)

    // ── 1. Honeypot check ─────────────────────────────────────────────────
    if (body.honeypot) {
      return jsonResponse({ success: true, referral_code: '0' })
    }

    // ── 2. Basic validation ───────────────────────────────────────────────
    if (!body.campaign_id || !body.first_name || !body.last_name || !body.phone) {
      return jsonResponse({ error: 'Campos requeridos: nombre, apellido, celular' }, 422)
    }
    if (!body.data_authorization) {
      return jsonResponse({ error: 'Debe autorizar el tratamiento de datos' }, 422)
    }

    // ── 4. Supabase client (service role for inserts) ─────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── 5. Rate limiting ─────────────────────────────────────────────────
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || '0.0.0.0'

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count: recentCount } = await supabase
      .from('registration_rate_limit')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('campaign_id', body.campaign_id)
      .gte('registered_at', twentyFourHoursAgo)

    if ((recentCount ?? 0) >= 10) {
      return jsonResponse({ error: 'Demasiados registros desde esta ubicación. Intente más tarde.' }, 429)
    }

    // ── 6. Verify campaign exists and is active ───────────────────────────
    const { data: config } = await supabase
      .from('public_registration_config')
      .select('campaign_id, is_active')
      .eq('campaign_id', body.campaign_id)
      .single()

    if (!config || !config.is_active) {
      return jsonResponse({ error: 'Campaña no encontrada o inactiva' }, 404)
    }

    // ── 7. Get tenant_id from campaign ────────────────────────────────────
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('tenant_id')
      .eq('id', body.campaign_id)
      .single()

    if (!campaign) {
      return jsonResponse({ error: 'Campaña no encontrada' }, 404)
    }

    // ── 8. Normalize phone ────────────────────────────────────────────────
    const { data: normalizedResult } = await supabase.rpc('normalize_phone_co', {
      phone: body.phone,
    })
    const normalizedPhone = normalizedResult || body.phone.replace(/\D/g, '')

    const contactLevel = body.document_number ? 'completo' : 'opinion'

    // ── 9. Dedup: check existing contact by phone OR document_number ────
    let existingContact = null

    // First: search by phone
    const { data: byPhone } = await supabase
      .from('contacts')
      .select('*')
      .eq('campaign_id', body.campaign_id)
      .eq('phone', normalizedPhone)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle()

    existingContact = byPhone

    // If not found by phone, try document_number
    if (!existingContact && body.document_number) {
      const { data: byDoc } = await supabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', body.campaign_id)
        .eq('document_number', body.document_number)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      existingContact = byDoc
    }

    let contactId: string
    let isExisting = false

    if (existingContact) {
      isExisting = true
      // Merge: fill gaps in existing contact with new registration data
      const updates: Record<string, unknown> = {}
      if (body.email && !existingContact.email) updates.email = body.email.toLowerCase()
      if (normalizedPhone && !existingContact.phone) updates.phone = normalizedPhone
      if (body.document_number && !existingContact.document_number) {
        updates.document_type = body.document_type || null
        updates.document_number = body.document_number
        updates.contact_level = 'completo'
      }
      if (body.department && !existingContact.department) updates.department = body.department
      if (body.municipality && !existingContact.municipality) {
        updates.municipality = body.municipality
        if (!existingContact.city) updates.city = body.municipality
      }
      if (body.district && !existingContact.district) updates.district = body.district

      // Metadata merge: fill gaps
      const existingMeta = (existingContact.metadata || {}) as Record<string, unknown>
      const newMeta = { ...existingMeta }
      if (body.gender && !existingMeta.gender) newMeta.gender = body.gender
      if (body.age_group && !existingMeta.age_group) newMeta.age_group = body.age_group
      if (Object.keys(newMeta).length > Object.keys(existingMeta).length) {
        updates.metadata = newMeta
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('contacts')
          .update(updates)
          .eq('id', existingContact.id)
      }
      contactId = existingContact.id
    } else {
      // ── 10. Insert new contact ──────────────────────────────────────────
      const metadata: Record<string, unknown> = {}
      if (body.gender) metadata.gender = body.gender
      if (body.age_group) metadata.age_group = body.age_group

      const insertObj: Record<string, unknown> = {
        tenant_id: campaign.tenant_id,
        campaign_id: body.campaign_id,
        contact_level: contactLevel,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        phone: normalizedPhone,
        email: body.email ? body.email.toLowerCase().trim() : null,
        document_type: body.document_type || null,
        document_number: body.document_number || null,
        department: body.department || null,
        municipality: body.municipality || null,
        city: body.municipality || null,
        district: body.district || null,
        status: 'supporter',
        capture_source: 'web',
        metadata,
        tags: [],
      }

      const { data: inserted, error: insertError } = await supabase
        .from('contacts')
        .insert(insertObj)
        .select('id')
        .single()

      if (insertError) {
        console.error('[public-register] Insert error:', JSON.stringify(insertError))
        if (insertError.code === '23505') {
          return jsonResponse({ error: 'Ya estás registrado en esta campaña' }, 409)
        }
        return jsonResponse({ error: 'Error al registrar. Intente de nuevo.' }, 500)
      }

      contactId = inserted!.id
    }

    // ── 11. Record referral event ─────────────────────────────────────────
    if (body.referrer_code && body.referrer_code !== normalizedPhone) {
      await supabase
        .from('referral_events')
        .insert({
          campaign_id: body.campaign_id,
          referrer_code: body.referrer_code,
          referred_contact_id: contactId,
        })
        .then(({ error }) => {
          if (error && error.code !== '23505') {
            console.error('[public-register] Referral insert error:', error)
          }
        })

      if (!isExisting) {
        await supabase.rpc('increment_campaign_stat', {
          p_campaign_id: body.campaign_id,
          p_field: 'registrations_referred',
        })
      }
    }

    // ── 12. Increment public registration counter (only for new contacts) ──
    if (!isExisting) {
      await supabase.rpc('increment_campaign_stat', {
        p_campaign_id: body.campaign_id,
        p_field: 'registrations_public',
      })
    }

    // ── 13. Record rate limit entry ──────────────────────────────────────
    await supabase
      .from('registration_rate_limit')
      .insert({
        ip_address: clientIp,
        campaign_id: body.campaign_id,
      })

    console.log('[public-register] Success for contact:', contactId)

    return jsonResponse({
      success: true,
      contact_id: contactId,
      referral_code: normalizedPhone,
      is_existing: isExisting,
    })
  } catch (err) {
    console.error('[public-register] Unhandled error:', err)
    return jsonResponse({ error: 'Error interno del servidor' }, 500)
  }
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
