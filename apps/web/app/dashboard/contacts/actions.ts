'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()

  const { data: contact } = await supabase
    .from('contacts').select('campaign_id').eq('id', id).single()
  if (!contact || !profile?.campaign_ids?.includes(contact.campaign_id)) redirect('/dashboard/contacts')

  await supabase.from('contacts').delete().eq('id', id)
  redirect('/dashboard/contacts')
}
