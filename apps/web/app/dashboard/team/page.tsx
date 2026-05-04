import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserPlus, MapPin, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { CopyRegistrationLink } from '@/components/team/CopyRegistrationLink'
import { VolunteerLeaderboard } from '@/components/dashboard/VolunteerLeaderboard'
import { calculatePoints, getLevel, type LeaderboardEntry } from '@/lib/gamification'

const roleLabels: Record<string, string> = {
  super_admin:        'Super Admin',
  campaign_manager:   'Campaign Manager',
  field_coordinator:  'Coordinador de Terreno',
  volunteer:          'Voluntario',
  analyst:            'Analista',
}

const roleColors: Record<string, string> = {
  super_admin:       'bg-purple-50 text-purple-700',
  campaign_manager:  'bg-blue-50 text-blue-700',
  field_coordinator: 'bg-indigo-50 text-indigo-700',
  volunteer:         'bg-emerald-50 text-emerald-700',
  analyst:           'bg-amber-50 text-amber-700',
}

const ROLE_GROUPS: Record<string, string[]> = {
  voluntarios:   ['volunteer'],
  coordinadores: ['field_coordinator'],
  gestion:       ['super_admin', 'campaign_manager', 'analyst'],
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { activeTenantId, activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId

  // Cross-tenant members: tenant_users es la fuente de verdad de membresía.
  // RLS de profiles bloquea profiles cuyo home_tenant_id ≠ activeTenantId, así
  // que usamos admin client estrictamente acotado por tenant_id activo.
  const admin = createAdminClient()
  const { data: memberships } = await admin
    .from('tenant_users')
    .select('user_id, role, custom_role_id, campaign_ids, created_at')
    .eq('tenant_id', activeTenantId ?? '')
    .order('created_at', { ascending: true })

  const memberRows = (memberships ?? []) as Array<{
    user_id:        string
    role:           string
    custom_role_id: string | null
    campaign_ids:   string[] | null
    created_at:     string
  }>
  const memberIds = memberRows.map(m => m.user_id)

  const { data: profilesData } = memberIds.length > 0
    ? await admin.from('profiles').select('id, full_name, avatar_url').in('id', memberIds)
    : { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> }

  const profileById = new Map(
    (profilesData ?? []).map(p => [p.id, p as { id: string; full_name: string | null; avatar_url: string | null }])
  )

  // Merge: el ROL viene de tenant_users (NO de profile.role, que es del HOME).
  const allMembers = memberRows.map(m => ({
    id:           m.user_id,
    full_name:    profileById.get(m.user_id)?.full_name ?? 'Sin nombre',
    avatar_url:   profileById.get(m.user_id)?.avatar_url ?? null,
    role:         m.role,
    custom_role_id: m.custom_role_id,
    campaign_ids: m.campaign_ids ?? [],
    created_at:   m.created_at,
  }))

  const [
    { data: visits },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('canvass_visits')
      .select('volunteer_id, status, result')
      .eq('campaign_id', campaignId),
    supabase.from('territory_assignments')
      .select('volunteer_id')
      .eq('status', 'active'),
  ])

  // Aggregate visits per volunteer
  const visitStats = new Map<string, { total: number; approved: number; visits: { status: string; result: string | null }[] }>()
  for (const v of visits ?? []) {
    if (!v.volunteer_id) continue
    const cur = visitStats.get(v.volunteer_id) ?? { total: 0, approved: 0, visits: [] }
    cur.total++
    if (v.status === 'approved') cur.approved++
    cur.visits.push({ status: v.status, result: v.result ?? null })
    visitStats.set(v.volunteer_id, cur)
  }

  // Count active territory assignments per volunteer
  const territoryCount = new Map<string, number>()
  for (const a of assignments ?? []) {
    if (!a.volunteer_id) continue
    territoryCount.set(a.volunteer_id, (territoryCount.get(a.volunteer_id) ?? 0) + 1)
  }

  // Compute points per volunteer
  const pointsMap = new Map<string, number>()
  for (const [id, stats] of visitStats.entries()) {
    pointsMap.set(id, calculatePoints(stats.visits))
  }

  // Build leaderboard (all members with any visits, sorted by points)
  const leaderboard: LeaderboardEntry[] = (allMembers ?? [])
    .map(m => ({
      id:      m.id,
      name:    m.full_name ?? 'Sin nombre',
      points:  pointsMap.get(m.id) ?? 0,
      level:   getLevel(pointsMap.get(m.id) ?? 0),
      visitas: visitStats.get(m.id)?.total ?? 0,
      rank:    0,
    }))
    .sort((a, b) => b.points - a.points || b.visitas - a.visitas)
    .map((e, i) => ({ ...e, rank: i + 1 }))

  // Filter by role tab
  const roleFilter = params.role
  const isRankingTab = roleFilter === 'ranking'

  const members = (allMembers ?? []).filter(m => {
    if (!roleFilter || roleFilter === 'todos') return true
    const group = ROLE_GROUPS[roleFilter]
    return group ? group.includes(m.role) : true
  })

  const tabs = [
    { key: 'todos',        label: 'Todos',         count: allMembers?.length ?? 0 },
    { key: 'voluntarios',  label: 'Voluntarios',   count: allMembers?.filter(m => m.role === 'volunteer').length ?? 0 },
    { key: 'coordinadores',label: 'Coordinadores', count: allMembers?.filter(m => m.role === 'field_coordinator').length ?? 0 },
    { key: 'gestion',      label: 'Gestión',       count: allMembers?.filter(m => ['super_admin','campaign_manager','analyst'].includes(m.role)).length ?? 0 },
    { key: 'ranking',      label: '🏆 Ranking',    count: null },
  ]

  return (
    <div className="p-6 space-y-4 animate-page-in">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Equipo</h1>
          <p className="text-sm text-slate-500 mt-0.5">{allMembers?.length ?? 0} miembros en la organización</p>
        </div>
        <Link href="/dashboard/team/invite">
          <Button size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Invitar miembro
          </Button>
        </Link>
      </div>

      {/* Registration link banner */}
      <CopyRegistrationLink campaignId={campaignId} />

      {/* Role tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {tabs.map(tab => (
          <Link key={tab.key} href={tab.key === 'todos' ? '/dashboard/team' : `/dashboard/team?role=${tab.key}`}>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                (roleFilter ?? 'todos') === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          </Link>
        ))}
      </div>

      {/* Ranking tab */}
      {isRankingTab ? (
        <VolunteerLeaderboard entries={leaderboard} />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Campañas</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead className="text-center">Aprobadas</TableHead>
                <TableHead className="text-center">Puntos</TableHead>
                <TableHead className="text-center">Territorios</TableHead>
                <TableHead>Se unió</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                    Sin miembros en este filtro
                  </TableCell>
                </TableRow>
              ) : members.map(member => {
                const initials = member.full_name
                  ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                const stats = visitStats.get(member.id)
                const territories = territoryCount.get(member.id) ?? 0
                const points = pointsMap.get(member.id) ?? 0
                const level = getLevel(points)

                return (
                  <TableRow key={member.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell>
                      <Link href={`/dashboard/team/${member.id}`} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.full_name ?? 'Sin nombre'}</span>
                        {member.id === user.id && (
                          <Badge variant="outline" className="text-xs">Tú</Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {roleLabels[member.role] ?? member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {member.campaign_ids?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {stats?.total ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {(stats?.approved ?? 0) > 0 ? (
                        <span className="flex items-center justify-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {stats!.approved}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {points > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <span>{level.badge}</span>
                          <span style={{ color: level.color }}>{points}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {territories > 0 ? (
                        <span className="flex items-center justify-center gap-1 text-indigo-600 text-sm">
                          <MapPin className="h-3.5 w-3.5" />
                          {territories}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(member.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
