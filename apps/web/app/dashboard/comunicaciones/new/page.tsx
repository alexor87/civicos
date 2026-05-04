import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { EmailCampaignEditor } from '@/components/dashboard/EmailCampaignEditor'
import { createCampaign } from '../actions'

type SearchParams = Promise<{ type?: string }>

export default async function NewCampaignPage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams
  const isTemplate = type === 'template'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId

  const { data: segments } = await supabase
    .from('contact_segments')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .order('name', { ascending: true })

  return (
    <EmailCampaignEditor
      segments={segments ?? []}
      action={createCampaign}
      isTemplate={isTemplate}
      submitLabel={isTemplate ? 'Guardar plantilla' : 'Guardar borrador'}
      campaignId={campaignId}
      userEmail={user.email ?? ''}
    />
  )
}
