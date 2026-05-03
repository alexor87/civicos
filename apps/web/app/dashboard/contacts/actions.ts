'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { campaignIds } = await getActiveCampaignContext(supabase, user.id)

  const { data: contact } = await supabase
    .from('contacts').select('campaign_id').eq('id', id).is('deleted_at', null).single()
  if (!contact || !campaignIds.includes(contact.campaign_id)) redirect('/dashboard/contacts')

  await supabase.from('contacts').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  redirect('/dashboard/contacts')
}
