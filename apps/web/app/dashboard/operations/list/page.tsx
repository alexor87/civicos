import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { checkPermission } from '@/lib/auth/check-permission'
import { TaskListView } from '@/components/operations/TaskListView'

export const metadata = { title: 'Lista de Tareas · Scrutix' }

export default async function ListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeTenantId, activeCampaignId } = await getActiveCampaignContext(supabase, user.id)

  // Permission check
  const adminSupabase = createAdminClient()
  const canView = await checkPermission(adminSupabase, user.id, 'operations.view')
  if (!canView) redirect('/dashboard')

  // Parallel data fetching
  const [
    { data: tasks },
    { data: teamMembers },
  ] = await Promise.all([
    // All tasks with assignee info
    adminSupabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)')
      .eq('campaign_id', activeCampaignId)
      .order('created_at', { ascending: false }),

    // Team members for filtering
    adminSupabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('tenant_id', activeTenantId ?? '')
      .order('full_name'),
  ])

  // Map tasks
  const mappedTasks = (tasks ?? []).map((t: any) => ({
    ...t,
    assignee: t.assignee ?? null,
  }))

  return (
    <TaskListView
      tasks={mappedTasks}
      members={(teamMembers ?? []).map((m: any) => ({ id: m.id, full_name: m.full_name }))}
      campaignId={activeCampaignId}
      userId={user.id}
    />
  )
}
