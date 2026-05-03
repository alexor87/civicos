import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NewVisitForm } from '@/components/dashboard/canvassing/NewVisitForm'

const CONTACTED_RESULTS = new Set(['contacted', 'positive'])

async function registerVisit(campaignId: string, tenantId: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contactId = formData.get('contact_id') as string
  const result = formData.get('result') as string
  const notes = (formData.get('notes') as string) || null
  const territoryId = (formData.get('territory_id') as string) || null
  const addressNotes = (formData.get('address_notes') as string) || null
  const addressConfirmed = formData.get('address_confirmed') !== 'false'

  // GPS capture from client (optional — used to pin the visit and contact on the map)
  const gpsLat = parseFloat(formData.get('gps_lat') as string)
  const gpsLng = parseFloat(formData.get('gps_lng') as string)
  const visitGeo = (!isNaN(gpsLat) && !isNaN(gpsLng) && gpsLat !== 0 && gpsLng !== 0)
    ? `SRID=4326;POINT(${gpsLng} ${gpsLat})`
    : null

  if (!contactId || !result) return

  const isContacted = CONTACTED_RESULTS.has(result)

  const { count } = await supabase
    .from('canvass_visits')
    .select('*', { count: 'exact', head: true })
    .eq('contact_id', contactId)
    .eq('campaign_id', campaignId)

  const attemptNumber = (count ?? 0) + 1

  const sympathyRaw = formData.get('sympathy_level') as string
  const sympathyLevel = isContacted && sympathyRaw ? parseInt(sympathyRaw) : null

  await supabase.from('canvass_visits').insert({
    contact_id: contactId,
    territory_id: territoryId || null,
    zone_id: null,
    volunteer_id: user.id,
    campaign_id: campaignId,
    tenant_id: tenantId,
    result: result as 'positive',
    notes,
    attempt_number: attemptNumber,
    status: 'submitted',
    address_confirmed: addressConfirmed,
    address_notes: addressNotes,
    geo: visitGeo,
    ...(isContacted ? {
      sympathy_level: sympathyLevel,
      vote_intention: (formData.get('vote_intention') as string) || null,
      persuadability: (formData.get('persuadability') as string) || null,
      wants_to_volunteer: formData.get('wants_to_volunteer') === 'on',
      wants_to_donate: formData.get('wants_to_donate') === 'on',
      wants_more_info: formData.get('wants_more_info') === 'on',
      wants_yard_sign: formData.get('wants_yard_sign') === 'on',
      requested_followup: formData.get('requested_followup') === 'on',
      followup_channel: (formData.get('followup_channel') as string) || null,
      followup_notes: (formData.get('followup_notes') as string) || null,
      best_contact_time: (formData.get('best_contact_time') as string) || null,
      household_size: parseInt(formData.get('household_size') as string) || null,
      household_voters: parseInt(formData.get('household_voters') as string) || null,
    } : {}),
  })

  // If GPS was captured and contact doesn't have coordinates yet, update it
  if (visitGeo) {
    await supabase.from('contacts')
      .update({ geo: visitGeo })
      .eq('id', contactId)
      .is('geo', null)
  }

  redirect('/dashboard/canvassing')
}

export default async function NewVisitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeTenantId, activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId
  const tenantId = activeTenantId
  if (!campaignId || !tenantId) notFound()

  const [{ data: contacts }, { data: territories }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, document_number')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('last_name'),
    supabase
      .from('territories')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .neq('status', 'archivado')
      .order('name'),
  ])

  const boundRegister = registerVisit.bind(null, campaignId, tenantId)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/canvassing">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Territorio
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar visita</CardTitle>
        </CardHeader>
        <CardContent>
          <NewVisitForm
            contacts={contacts ?? []}
            territories={territories ?? []}
            action={boundRegister}
          />
        </CardContent>
      </Card>
    </div>
  )
}
