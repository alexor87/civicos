import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'
import { KanbanBoard } from '@/components/operations/KanbanBoard'

export const metadata = { title: 'Tablero Kanban · Operaciones · CivicOS' }

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Determine active campaign
  const cookieStore = await cookies()
  const cookieCampaignId = cookieStore.get('active_campaign_id')?.value
  const campaignIds: string[] = profile.campaign_ids ?? []
  const activeCampaignId = (cookieCampaignId && campaignIds.includes(cookieCampaignId))
    ? cookieCampaignId
    : campaignIds[0] ?? ''

  // Permission check
  const adminSupabase = createAdminClient()
  const canView = await checkPermission(adminSupabase, user.id, 'operations.view')
  if (!canView) redirect('/dashboard')

  // Parallel data fetching
  const [
    { data: tasks },
    { data: teamMembers },
  ] = await Promise.all([
    // All tasks for the campaign with assignee info
    adminSupabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)')
      .eq('campaign_id', activeCampaignId)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false }),

    // Team members for filter
    adminSupabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('tenant_id', profile.tenant_id)
      .order('full_name'),
  ])

  // Map tasks
  const mappedTasks = (tasks ?? []).map((t: any) => ({
    ...t,
    assignee: t.assignee ?? null,
  }))

  return (
    <KanbanBoard
      tasks={mappedTasks}
      members={(teamMembers ?? []).map((m: any) => ({ id: m.id, full_name: m.full_name }))}
      campaignId={activeCampaignId}
      userId={user.id}
    />
  )
}
