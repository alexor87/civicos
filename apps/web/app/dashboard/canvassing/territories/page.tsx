import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Plus, ChevronLeft, Users, Map, List } from 'lucide-react'
import { TerritoryMapDynamic } from '@/components/maps/TerritoryMapDynamic'

const statusConfig: Record<string, { label: string; className: string }> = {
  disponible:  { label: 'Disponible',   className: 'bg-slate-100 text-slate-600' },
  asignado:    { label: 'Asignado',     className: 'bg-blue-100 text-blue-700' },
  en_progreso: { label: 'En progreso',  className: 'bg-amber-100 text-amber-700' },
  completado:  { label: 'Completado',   className: 'bg-green-100 text-green-700' },
  archivado:   { label: 'Archivado',    className: 'bg-slate-50 text-slate-400' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  alta:  { label: 'Alta',  className: 'bg-red-100 text-red-700' },
  media: { label: 'Media', className: 'bg-amber-50 text-amber-600' },
  baja:  { label: 'Baja',  className: 'bg-slate-100 text-slate-500' },
}

export default async function TerritoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId

  const [{ data: territories }, { data: geoUnitsRaw }] = await Promise.all([
    supabase
      .from('territories')
      .select('id, name, color, status, priority, description, estimated_contacts, deadline, geojson')
      .eq('campaign_id', campaignId ?? '')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('geo_units')
      .select('id, name, type, geojson')
      .eq('campaign_id', campaignId ?? '')
      .not('geojson', 'is', null),
  ])

  const geoUnits = (geoUnitsRaw ?? []).map(u => ({
    id: u.id as string,
    name: u.name as string,
    type: u.type as string,
    geojson: u.geojson as object,
  }))

  const { data: visitCounts } = await supabase
    .from('canvass_visits')
    .select('territory_id')
    .eq('campaign_id', campaignId ?? '')
    .not('territory_id', 'is', null)

  const visitsByTerritory = (visitCounts ?? []).reduce<Record<string, number>>((acc, v) => {
    if (v.territory_id) acc[v.territory_id] = (acc[v.territory_id] ?? 0) + 1
    return acc
  }, {})

  // ── Coverage data for choropleth map ────────────────────────────────────────
  const coverageData: Record<string, number> = {}
  const visitDataForMap: Record<string, { visits: number; estimated: number }> = {}

  for (const t of territories ?? []) {
    const visits    = visitsByTerritory[t.id] ?? 0
    const estimated = t.estimated_contacts ?? 0
    const pct       = estimated > 0 ? Math.min(100, Math.round((visits / estimated) * 100)) : 0
    coverageData[t.id]    = pct
    visitDataForMap[t.id] = { visits, estimated }
  }

  // ── Mini summary stats ───────────────────────────────────────────────────────
  const noVisits   = (territories ?? []).filter(t => (visitsByTerritory[t.id] ?? 0) === 0).length
  const inProgress = (territories ?? []).filter(t => {
    const pct = coverageData[t.id] ?? 0
    return pct > 0 && pct < 100
  }).length
  const completed  = (territories ?? []).filter(t => (coverageData[t.id] ?? 0) === 100).length

  const params = await searchParams
  const hasGeoData = territories?.some(t => t.geojson != null)
  const view = params?.view === 'list' ? 'list'
             : (hasGeoData || params?.view === 'map') ? 'map'
             : 'list'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/canvassing">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Territorio
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Territorios</h1>
            <p className="text-sm text-slate-500 mt-0.5">{territories?.length ?? 0} territorios configurados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <Link href="?view=list">
              <button className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
                <List className="h-3.5 w-3.5" />
                Lista
              </button>
            </Link>
            <Link href="?view=map">
              <button className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors border-l border-gray-200 ${
                view === 'map' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
                <Map className="h-3.5 w-3.5" />
                Mapa
              </button>
            </Link>
          </div>
          <Link href="/dashboard/canvassing/territories/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo territorio
            </Button>
          </Link>
        </div>
      </div>

      {!territories?.length ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
            <MapPin className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">Sin territorios configurados</p>
            <p className="text-sm text-slate-400 max-w-[280px] mx-auto">Crea el primer territorio para organizar el trabajo de campo</p>
          </div>
          <Link href="/dashboard/canvassing/territories/new">
            <Button size="sm" className="mt-1">
              <Plus className="h-4 w-4 mr-1.5" />
              Crear territorio
            </Button>
          </Link>
        </div>
      ) : view === 'map' ? (
        <div className="space-y-3">
          {!hasGeoData && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Ningún territorio tiene polígono dibujado aún. Al crear un territorio, usa el mapa para delimitar su área.
            </div>
          )}

          {/* Mini coverage summary */}
          {(territories?.length ?? 0) > 0 && (
            <div className="flex items-center gap-4 px-1 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                <span className="text-slate-600"><strong>{noVisits}</strong> sin visitas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
                <span className="text-slate-600"><strong>{inProgress}</strong> en progreso</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-slate-600"><strong>{completed}</strong> completados</span>
              </span>
            </div>
          )}

          <TerritoryMapDynamic
            territories={(territories ?? []).map(t => ({
              id: t.id,
              name: t.name,
              color: t.color,
              status: t.status,
              geojson: t.geojson as object | null,
            }))}
            coverageData={coverageData}
            visitData={visitDataForMap}
            geoUnits={geoUnits}
            height="560px"
          />
          <div className="flex flex-wrap gap-3 pt-1">
            {(territories ?? []).filter(t => t.geojson).map(t => (
              <Link
                key={t.id}
                href={`/dashboard/canvassing/territories/${t.id}`}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-700"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(territories ?? []).map(territory => {
            const visitCount = visitsByTerritory[territory.id] ?? 0
            const coverage = territory.estimated_contacts > 0
              ? Math.min(100, Math.round((visitCount / territory.estimated_contacts) * 100))
              : 0
            const sc = statusConfig[territory.status] ?? statusConfig.disponible
            const pc = priorityConfig[territory.priority] ?? priorityConfig.media

            return (
              <Link key={territory.id} href={`/dashboard/canvassing/territories/${territory.id}`}>
                <div className="rounded-xl bg-white p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer space-y-4 shadow-sm overflow-hidden"
                     style={{ borderTop: `4px solid ${territory.color}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: territory.color }}
                      />
                      <h3 className="font-semibold text-slate-900 leading-tight">{territory.name}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.className}`}>
                        {sc.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pc.className}`}>
                        Prioridad {pc.label}
                      </span>
                    </div>
                  </div>

                  {territory.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{territory.description}</p>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{visitCount} / {territory.estimated_contacts} visitas</span>
                      </div>
                      <span className="font-medium">{coverage}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-progress ${
                          coverage >= 67 ? 'bg-green-500' : coverage >= 34 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${coverage}%` }}
                      />
                    </div>
                  </div>

                  {territory.deadline && (
                    <p className="text-xs text-slate-400">
                      Fecha límite: {new Date(territory.deadline).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
