import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmailCampaignEditor } from '@/components/dashboard/EmailCampaignEditor'
import { createCampaign } from '../actions'

type SearchParams = Promise<{ type?: string }>

export default async function NewCampaignPage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams
  const isTemplate = type === 'template'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''

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
    />
  )
}
