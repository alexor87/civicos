import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RolesPermissionsClient } from '@/components/settings/RolesPermissionsClient'
import { TeamSubNav } from '@/components/settings/TeamSubNav'

export default async function RolesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Permission enforcement is handled by:
  // - TeamSubNav: PermissionGate hides the tab from unauthorized users
  // - /api/roles: all API endpoints verify roles.manage permission

  return (
    <div>
      <TeamSubNav />
      <RolesPermissionsClient />
    </div>
  )
}
