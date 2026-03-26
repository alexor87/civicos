import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamMembersClient } from '@/components/settings/TeamMembersClient'

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('tenant_id', profile?.tenant_id ?? '')
    .order('created_at', { ascending: true })

  const canManage = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')

  return (
    <TeamMembersClient
      members={members ?? []}
      currentUserId={user.id}
      canManage={canManage}
      tenantId={profile?.tenant_id ?? ''}
    />
  )
}
