import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'
import { MissionDetail } from '@/components/operations/MissionDetail'

export const metadata = { title: 'Detalle de Misión · Operaciones · CivicOS' }

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Permission check
  const adminSupabase = createAdminClient()
  const canView = await checkPermission(adminSupabase, user.id, 'operations.view')
  if (!canView) redirect('/dashboard')

  // Parallel data fetching
  const [
    { data: mission },
    { data: tasks },
    { data: missionMembers },
    { data: teamMembers },
  ] = await Promise.all([
    // Mission with progress
    adminSupabase
      .from('missions')
      .select('*, mission_progress(*)')
      .eq('id', id)
      .single(),

    // All tasks for this mission with assignee info
    adminSupabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)')
      .eq('mission_id', id)
      .order('created_at', { ascending: false }),

    // Mission members
    adminSupabase
      .from('mission_members')
      .select('*, profile:profiles(id, full_name, role, avatar_url)')
      .eq('mission_id', id),

    // Team members for assignment
    adminSupabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('tenant_id', profile.tenant_id)
      .order('full_name'),
  ])

  if (!mission) notFound()

  // Extract progress from joined view
  const p = Array.isArray(mission.mission_progress) ? mission.mission_progress[0] : mission.mission_progress
  const progress = {
    total_tasks: p?.total_tasks ?? 0,
    completed_tasks: p?.completed_tasks ?? 0,
    progress_pct: p?.progress_pct ?? 0,
  }

  // Map tasks with assignee
  const mappedTasks = (tasks ?? []).map((t: any) => ({
    ...t,
    mission: { id: mission.id, name: mission.name },
    assignee: t.assignee ?? null,
  }))

  // Map mission members
  const mappedMembers = (missionMembers ?? []).map((mm: any) => ({
    profile_id: mm.profile_id ?? mm.profile?.id,
    full_name: mm.profile?.full_name ?? 'Desconocido',
  }))

  return (
    <MissionDetail
      campaignId={mission.campaign_id}
      userId={user.id}
      mission={mission}
      tasks={mappedTasks}
      missionMembers={mappedMembers}
      members={(teamMembers ?? []).map((m: any) => ({ id: m.id, full_name: m.full_name }))}
      progress={progress}
    />
  )
}
