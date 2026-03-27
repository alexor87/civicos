import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamMembersClient } from '@/components/settings/TeamMembersClient'
import { TeamSubNav } from '@/components/settings/TeamSubNav'
import { checkPermissions } from '@/lib/auth/check-permission'

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

  const perms = await checkPermissions(supabase, user.id, ['team.manage_roles', 'team.invite', 'roles.manage'])
  const canManage = perms['team.manage_roles'] || perms['team.invite']

  return (
    <div>
      <TeamSubNav />
      <TeamMembersClient
        members={members ?? []}
        currentUserId={user.id}
        canManage={canManage}
        tenantId={profile?.tenant_id ?? ''}
      />
    </div>
  )
}
