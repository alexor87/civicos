'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, Users, MapPin, UserPlus } from 'lucide-react'
import { TerritoryMapDynamic } from '@/components/maps/TerritoryMapDynamic'

async function assignVolunteer(
  territoryId: string,
  tenantId: string,
  assignedBy: string,
  formData: FormData
) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const volunteerId = formData.get('volunteer_id') as string
  if (!volunteerId) return

  await supabase.from('territory_assignments').insert({
    territory_id: territoryId,
    tenant_id: tenantId,
    volunteer_id: volunteerId,
    assigned_by: assignedBy,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
    status: 'active',
  })

  redirect(`/dashboard/canvassing/territories/${territoryId}`)
}

const statusConfig: Record<string, { label: string; className: string }> = {
  disponible:  { label: 'Disponible',   className: 'bg-slate-100 text-slate-600' },
  asignado:    { label: 'Asignado',     className: 'bg-blue-100 text-blue-700' },
  en_progreso: { label: 'En progreso',  className: 'bg-amber-100 text-amber-700' },
  completado:  { label: 'Completado',   className: 'bg-green-100 text-green-700' },
  archivado:   { label: 'Archivado',    className: 'bg-slate-50 text-slate-400' },
}

const resultLabels: Record<string, string> = {
  contacted: 'Contactado', positive: 'Positivo', negative: 'Negativo',
  undecided: 'Indeciso', no_home: 'No estaba', not_home: 'No en casa',
  neighbor_absent: 'Vecino informó', moved: 'Se mudó', wrong_address: 'Dir. incorrecta',
  deceased: 'Fallecido', come_back_later: 'Volver después', inaccessible: 'Inaccesible',
  follow_up: 'Seguimiento', refused: 'Rechazó',
}

export default async function TerritoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, tenant_id, role')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id
  const canManage = ['super_admin', 'campaign_manager', 'field_coordinator'].includes(profile?.role ?? '')

  const [
    { data: territory },
    { data: assignments },
    { data: recentVisits },
  ] = await Promise.all([
    supabase.from('territories').select('*').eq('id', id).single(),
    supabase
      .from('territory_assignments')
      .select('*, profiles!volunteer_id(full_name, role)')
      .eq('territory_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('canvass_visits')
      .select('*, contacts(first_name, last_name), profiles!volunteer_id(full_name)')
      .eq('territory_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!territory) notFound()

  const sc = statusConfig[territory.status] ?? statusConfig.disponible
  const visitCount = recentVisits?.length ?? 0
  const coverage = territory.estimated_contacts > 0
    ? Math.min(100, Math.round((visitCount / territory.estimated_contacts) * 100))
    : 0

  const { data: volunteers } = canManage
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('tenant_id', tenantId ?? '')
        .in('role', ['volunteer', 'field_coordinator'])
        .order('full_name')
    : { data: [] }

  const boundAssign = assignVolunteer.bind(null, id, tenantId ?? '', user.id)

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/dashboard/canvassing/territories">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Territorios
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-4 h-4 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: territory.color }}
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{territory.name}</h1>
            {territory.description && (
              <p className="text-slate-500 text-sm mt-1">{territory.description}</p>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${sc.className}`}>
          {sc.label}
        </span>
      </div>

      {/* Mini map — only if geojson exists */}
      {territory.geojson && (
        <Card>
          <CardContent className="p-3">
            <TerritoryMapDynamic
              territories={[{
                id: territory.id,
                name: territory.name,
                color: territory.color,
                status: territory.status,
                geojson: territory.geojson as object | null,
              }]}
              height="250px"
              interactive={false}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: stats + assignments */}
        <div className="space-y-4">
          {/* Coverage */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-4 w-4 text-slate-400" />
                  Cobertura
                </div>
                <span className="font-semibold">{coverage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${coverage >= 67 ? 'bg-green-500' : coverage >= 34 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{visitCount} visitas</span>
                <span>Meta: {territory.estimated_contacts}</span>
              </div>
              {territory.deadline && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Fecha límite: {new Date(territory.deadline).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assigned volunteers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Voluntarios asignados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {!assignments?.length ? (
                <p className="text-sm text-slate-400">Sin voluntarios asignados</p>
              ) : (
                <ul className="space-y-2">
                  {assignments.map(a => {
                    const vol = a.profiles as { full_name: string | null; role: string } | null
                    return (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{vol?.full_name ?? 'Voluntario'}</span>
                        {a.end_date && (
                          <span className="text-xs text-slate-400">
                            hasta {new Date(a.end_date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {canManage && (
                <details className="mt-2">
                  <summary className="text-sm text-indigo-600 cursor-pointer flex items-center gap-1.5 hover:text-indigo-800">
                    <UserPlus className="h-3.5 w-3.5" />
                    Asignar voluntario
                  </summary>
                  <form action={boundAssign} className="mt-3 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="volunteer_id" className="text-xs">Voluntario *</Label>
                      <select
                        id="volunteer_id"
                        name="volunteer_id"
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Seleccionar…</option>
                        {(volunteers ?? []).map(v => (
                          <option key={v.id} value={v.id}>{v.full_name ?? v.id}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="start_date" className="text-xs">Inicio</Label>
                        <Input id="start_date" name="start_date" type="date" className="text-xs h-8" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="end_date" className="text-xs">Fin</Label>
                        <Input id="end_date" name="end_date" type="date" className="text-xs h-8" />
                      </div>
                    </div>
                    <Button type="submit" size="sm" className="w-full">Asignar</Button>
                  </form>
                </details>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: recent visits */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visitas recientes en este territorio</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!recentVisits?.length ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Sin visitas registradas en este territorio
                </div>
              ) : (
                <div className="divide-y">
                  {recentVisits.map(visit => {
                    const contact = visit.contacts as { first_name: string; last_name: string } | null
                    const volunteer = visit.profiles as { full_name: string | null } | null
                    return (
                      <div key={visit.id} className="px-5 py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {contact ? `${contact.first_name} ${contact.last_name}` : '—'}
                          </p>
                          <p className="text-xs text-slate-400">{volunteer?.full_name ?? 'Voluntario'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-slate-600">{resultLabels[visit.result] ?? visit.result}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(visit.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
