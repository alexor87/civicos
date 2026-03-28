import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'
import { OperationsHome } from '@/components/operations/OperationsHome'

export const metadata = { title: 'Operaciones · CivicOS' }

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
    { data: activeMissions },
    { data: allTasks },
    { data: myTasksToday },
    { data: teamMembers },
    { data: missionTemplates },
  ] = await Promise.all([
    // Active missions (top 5) with progress
    adminSupabase
      .from('missions')
      .select('*, mission_progress(*)')
      .eq('campaign_id', activeCampaignId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),

    // All tasks for KPI calculations
    adminSupabase
      .from('tasks')
      .select('id, status, due_date, mission_id')
      .eq('campaign_id', activeCampaignId),

    // User's tasks due today
    adminSupabase
      .from('tasks')
      .select('*, missions(name)')
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

    // Mission templates for create modal
    adminSupabase
      .from('mission_templates')
      .select('key, name, description, type')
      .or(`is_system.eq.true,tenant_id.eq.${profile.tenant_id}`)
      .order('name'),
  ])

  // Compute KPIs
  const tasks = allTasks ?? []
  const kpiActiveMissions = activeMissions?.length ?? 0
  const totalTasks = tasks.length
  const completedToday = tasks.filter(
    t => t.status === 'completed' && t.due_date === today
  ).length
  const overdueTasks = tasks.filter(
    t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled'
  ).length

  // Map missions with progress
  const missionsWithProgress = (activeMissions ?? []).map((m: any) => {
    const p = Array.isArray(m.mission_progress) ? m.mission_progress[0] : m.mission_progress
    return {
      id: m.id, name: m.name, status: m.status, priority: m.priority, due_date: m.due_date,
      total_tasks: p?.total_tasks ?? 0, completed_tasks: p?.completed_tasks ?? 0, progress_pct: p?.progress_pct ?? 0,
    }
  })

  // Map my tasks to match Task type
  const myTasksMapped = (myTasksToday ?? []).map((t: any) => ({
    ...t,
    mission: t.missions ? { id: t.mission_id, name: t.missions.name } : null,
    assignee: null,
  }))

  // All missions for task creation dropdown
  const allMissions = (activeMissions ?? []).map((m: any) => ({ id: m.id, name: m.name }))

  return (
    <OperationsHome
      kpis={{ activeMissions: kpiActiveMissions, totalTasks, completedToday, overdueTasks }}
      missions={missionsWithProgress}
      myTasks={myTasksMapped}
      allMissions={allMissions}
      members={(teamMembers ?? []).map((m: any) => ({ id: m.id, full_name: m.full_name }))}
      templates={(missionTemplates ?? []).map((t: any) => ({ key: t.key, name: t.name, description: t.description, type: t.type }))}
      campaignId={activeCampaignId}
      userId={user.id}
    />
  )
}
