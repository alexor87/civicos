import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'
import { OperationsHome } from '@/components/operations/OperationsHome'

export const metadata = { title: 'Tareas · Scrutix' }

export default async function OperationsPage() {
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

  const today = new Date().toISOString().split('T')[0]

  // Parallel data fetching
  const [
    { data: allTasks },
    { data: myTasksToday },
    { data: teamMembers },
  ] = await Promise.all([
    // All tasks for KPI calculations
    adminSupabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('campaign_id', activeCampaignId),

    // User's tasks due today
    adminSupabase
      .from('tasks')
      .select('*')
      .eq('campaign_id', activeCampaignId)
      .eq('assignee_id', user.id)
      .lte('due_date', today)
      .not('status', 'in', '("completed","cancelled")')
      .order('due_date', { ascending: true }),

    // Team members for assignment
    adminSupabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('tenant_id', profile.tenant_id)
      .order('full_name'),
  ])

  // Compute KPIs
  const tasks = allTasks ?? []
  const totalTasks = tasks.length
  const completedToday = tasks.filter(
    t => t.status === 'completed' && t.due_date === today
  ).length
  const overdueTasks = tasks.filter(
    t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled'
  ).length

  // Map my tasks to match Task type
  const myTasksMapped = (myTasksToday ?? []).map((t: any) => ({
    ...t,
    assignee: null,
  }))

  return (
    <OperationsHome
      kpis={{ totalTasks, completedToday, overdueTasks }}
      myTasks={myTasksMapped}
      members={(teamMembers ?? []).map((m: any) => ({ id: m.id, full_name: m.full_name }))}
      campaignId={activeCampaignId}
      userId={user.id}
    />
  )
}
