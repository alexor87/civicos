import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/check-permission'
import { RolesPermissionsClient } from '@/components/settings/RolesPermissionsClient'
import { TeamSubNav } from '@/components/settings/TeamSubNav'

export default async function RolesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const can = await checkPermission(supabase, user.id, 'roles.manage')
  if (!can) redirect('/dashboard/settings/team')

  return (
    <div>
      <TeamSubNav />
      <RolesPermissionsClient />
    </div>
  )
}
