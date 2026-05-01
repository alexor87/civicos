import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SmsCampaignForm } from '@/components/dashboard/SmsCampaignForm'
import { updateSmsCampaign } from '../../../sms-actions'
import { SMS_CHANNEL_ENABLED } from '@/lib/features/messaging-channels'

export default async function EditSmsCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  if (!SMS_CHANNEL_ENABLED) redirect('/dashboard/comunicaciones?tab=email')

  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''

  const [{ data: campaign }, { data: segments }] = await Promise.all([
    supabase.from('sms_campaigns').select('*').eq('id', id).single(),
    supabase.from('contact_segments').select('id, name').eq('campaign_id', campaignId).order('name', { ascending: true }),
  ])

  if (!campaign || campaign.status !== 'draft') redirect(`/dashboard/comunicaciones/sms/${id}`)

  let manualContacts: { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null }[] = []
  if (campaign.recipient_ids?.length) {
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .in('id', campaign.recipient_ids)
    manualContacts = (data ?? []) as typeof manualContacts
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <Link href={`/dashboard/comunicaciones/sms/${id}`}>
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6a737d] hover:text-[#1b1f23]">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {campaign.name}
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-[#1b1f23] mt-3">Editar campaña SMS</h1>
        </div>

        <SmsCampaignForm
          campaignId={campaignId}
          segments={segments ?? []}
          action={updateSmsCampaign.bind(null, id)}
          defaultValues={{
            name:            campaign.name,
            body_text:       campaign.body_text,
            segment_id:      campaign.segment_id ?? '',
            recipient_ids:   campaign.recipient_ids ?? [],
            manual_contacts: manualContacts,
          }}
        />
      </div>
    </div>
  )
}
