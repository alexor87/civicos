import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronRight, MapPin, CheckCircle, ClipboardList, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { calculatePoints, getLevel, getProgressToNextLevel } from '@/lib/gamification'

const roleLabels: Record<string, string> = {
  super_admin:       'Super Admin',
  campaign_manager:  'Campaign Manager',
  field_coordinator: 'Coordinador de Terreno',
  volunteer:         'Voluntario',
  analyst:           'Analista',
}

const roleColors: Record<string, string> = {
  super_admin:       'bg-purple-50 text-purple-700',
  campaign_manager:  'bg-blue-50 text-blue-700',
  field_coordinator: 'bg-indigo-50 text-indigo-700',
  volunteer:         'bg-emerald-50 text-emerald-700',
  analyst:           'bg-amber-50 text-amber-700',
}

const RESULT_LABELS: Record<string, string> = {
  contacted: 'Contactado', positive: 'Positivo', negative: 'Negativo',
  undecided: 'Indeciso', no_home: 'No en casa', not_home: 'No en casa',
  follow_up: 'Seguimiento', refused: 'Rechazó', moved: 'Se mudó',
  wrong_address: 'Dir. incorrecta', deceased: 'Fallecido',
  come_back_later: 'Volver después', inaccessible: 'Inaccesible',
  neighbor_absent: 'Vecino informó',
}

const RESULT_COLORS: Record<string, string> = {
  contacted: 'bg-emerald-50 text-emerald-600', positive: 'bg-emerald-50 text-emerald-600',
  negative: 'bg-red-50 text-red-600', undecided: 'bg-amber-50 text-amber-600',
  no_home: 'bg-gray-100 text-gray-500', not_home: 'bg-gray-100 text-gray-500',
  follow_up: 'bg-blue-50 text-blue-600', refused: 'bg-orange-50 text-orange-600',
  come_back_later: 'bg-blue-50 text-blue-500',
}

const VISIT_STATUS_COLORS: Record<string, string> = {
  approved:  'text-green-600',
  submitted: 'text-orange-500',
  rejected:  'text-red-500',
}

const VISIT_STATUS_LABELS: Record<string, string> = {
  approved:  'Aprobada',
  submitted: 'Pendiente',
  rejected:  'Rechazada',
}

export default async function VolunteerProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = currentProfile?.campaign_ids?.[0] ?? ''

  // Load target member profile
  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!member) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Miembro no encontrado.</p>
      </div>
    )
  }

  // Load stats in parallel
  const [
    { data: visits },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('canvass_visits')
      .select('id, result, sympathy_level, status, created_at, contacts(first_name, last_name)')
      .eq('volunteer_id', params.id)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('territory_assignments')
      .select('*, territories(name, status, color)')
      .eq('volunteer_id', params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  const totalVisits    = visits?.length ?? 0
  const approvedVisits = visits?.filter(v => v.status === 'approved').length ?? 0
  const approvalRate   = totalVisits > 0 ? Math.round((approvedVisits / totalVisits) * 100) : 0
  const totalTerritories = assignments?.length ?? 0

  const points   = calculatePoints((visits ?? []).map(v => ({ status: v.status, result: v.result ?? null })))
  const level    = getLevel(points)
  const progress = getProgressToNextLevel(points)

  const initials = member.full_name
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb + Header */}
      <div className="pb-8 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/dashboard/team" className="hover:text-foreground">Equipo</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{member.full_name ?? 'Sin nombre'}</span>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-indigo-50 text-indigo-600 text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{member.full_name ?? 'Sin nombre'}</h1>
              {member.id === user.id && (
                <Badge variant="outline" className="text-xs">Tú</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                {roleLabels[member.role] ?? member.role}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-200">
                {level.badge} {level.name}
              </span>
              <span className="text-xs text-muted-foreground">
                Miembro desde {new Date(member.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ClipboardList className="h-4 w-4" />
              <span className="text-xs">Total visitas</span>
            </div>
            <p className="text-2xl font-bold">{totalVisits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">Aprobadas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{approvedVisits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4 text-indigo-500" />
              <span className="text-xs">Territorios activos</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{totalTerritories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs">Tasa aprobación</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{approvalRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xs">Puntos</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: level.color }}>
              {points.toLocaleString()}
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{level.badge} {level.name}</span>
                {progress.next && <span>{progress.next} pts</span>}
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress.pct}%`, backgroundColor: level.color }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territory assignments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Territorios asignados
            <span className="text-sm font-normal text-muted-foreground">({totalTerritories})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!assignments?.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin territorios asignados actualmente
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Territorio</TableHead>
                  <TableHead>Estado territorio</TableHead>
                  <TableHead>Asignado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(assignments as { id: string; created_at: string; territories: { name: string; status: string; color: string } | null }[]).map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {a.territories?.color && (
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: a.territories.color }} />
                      )}
                      {a.territories?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize text-muted-foreground">
                        {a.territories?.status?.replace('_', ' ') ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(a.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent visits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Visitas recientes
            <span className="text-sm font-normal text-muted-foreground">
              (últimas {visits?.length ?? 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!visits?.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin visitas registradas en esta campaña
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Simpatía</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(visits as unknown as { id: string; result: string; sympathy_level: number | null; status: string; created_at: string; contacts: { first_name: string; last_name: string } | null }[]).map(v => {
                  const contact = v.contacts
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {contact ? `${contact.first_name} ${contact.last_name}` : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLORS[v.result] ?? 'bg-gray-100 text-gray-600'}`}>
                          {RESULT_LABELS[v.result] ?? v.result}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.sympathy_level ? `${v.sympathy_level}/5` : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${VISIT_STATUS_COLORS[v.status] ?? 'text-muted-foreground'}`}>
                          {VISIT_STATUS_LABELS[v.status] ?? v.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(v.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
