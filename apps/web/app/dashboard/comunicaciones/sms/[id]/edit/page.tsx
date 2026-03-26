import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SmsCampaignForm } from '@/components/dashboard/SmsCampaignForm'
import { updateSmsCampaign } from '../../../sms-actions'

export default async function EditSmsCampaignPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">
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
          segments={segments ?? []}
          action={updateSmsCampaign.bind(null, id)}
          defaultValues={{
            name:       campaign.name,
            body_text:  campaign.body_text,
            segment_id: campaign.segment_id ?? '',
          }}
        />
      </div>
    </div>
  )
}
