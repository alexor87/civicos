'use server'

import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export interface CampaignPublicData {
  id:           string
  name:         string
  candidate_name: string | null
  brand_color:  string
  logo_url:     string | null
  election_type: string | null
  volunteer_registration_enabled: boolean
}

export async function getCampaignPublicData(campaignId: string): Promise<CampaignPublicData | null> {
  const supabase = serviceClient()
  const { data } = await supabase
    .from('campaigns')
    .select('id, name, candidate_name, brand_color, logo_url, election_type, volunteer_registration_enabled')
    .eq('id', campaignId)
    .single()
  return data ?? null
}

export interface RegisterVolunteerInput {
  campaignId:     string
  firstName:      string
  lastName:       string
  email:          string
  phone:          string
  city:           string
  availability:   string[]
  howDidYouHear:  string
}

export type RegisterResult =
  | { success: true }
  | { success: false; error: string; duplicate?: boolean }

export async function registerVolunteer(input: RegisterVolunteerInput): Promise<RegisterResult> {
  const { campaignId, firstName, lastName, email, phone, city, availability, howDidYouHear } = input

  if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
    return { success: false, error: 'Todos los campos obligatorios deben estar completos.' }
  }

  const supabase = serviceClient()

  // Verify campaign exists and has registration enabled
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, tenant_id, volunteer_registration_enabled')
    .eq('id', campaignId)
    .single()

  if (!campaign) return { success: false, error: 'Campaña no encontrada.' }
  if (!campaign.volunteer_registration_enabled) {
    return { success: false, error: 'El registro de voluntarios no está habilitado para esta campaña.' }
  }

  // Check duplicate by email
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('email', email.toLowerCase().trim())
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return { success: false, duplicate: true, error: '¡Ya estás registrado! Tu información ya está en nuestro sistema.' }
  }

  const notes = [
    availability.length ? `Disponibilidad: ${availability.join(', ')}` : null,
    howDidYouHear ? `Fuente: ${howDidYouHear}` : null,
  ].filter(Boolean).join('. ')

  const { error } = await supabase.from('contacts').insert({
    tenant_id:  campaign.tenant_id,
    campaign_id: campaignId,
    first_name:  firstName.trim(),
    last_name:   lastName.trim(),
    email:       email.toLowerCase().trim(),
    phone:       phone.trim(),
    city:        city.trim() || null,
    status:      'undecided',
    tags:        ['voluntario'],
    notes:       notes || null,
    metadata:    {
      source:          'volunteer_registration',
      availability,
      how_did_you_hear: howDidYouHear,
      registered_at:   new Date().toISOString(),
    },
  })

  if (error) {
    console.error('registerVolunteer error:', error)
    return { success: false, error: 'Error al guardar tu información. Inténtalo de nuevo.' }
  }

  return { success: true }
}
