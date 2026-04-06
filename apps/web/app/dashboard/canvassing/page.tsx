import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CanvassingStats } from '@/components/dashboard/CanvassingStats'
import { Plus, MapPin, FileText, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { TerritoryAnalysisPanel } from '@/components/dashboard/canvassing/TerritoryAnalysisPanel'
import { CanvassingMapWithPanel } from '@/components/dashboard/canvassing/CanvassingMapWithPanel'
import { CanvassingVisitsTable } from '@/components/dashboard/canvassing/CanvassingVisitsTable'


export default async function CanvassingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]

  const [
    { data: territories },
    { data: recentVisits },
    { count: totalVisits },
    { count: pendingApproval },
    { data: visitCounts },
  ] = await Promise.all([
    supabase.from('territories')
      .select('id, name, color, status, priority, geojson, estimated_contacts')
      .eq('campaign_id', campaignId ?? '')
      .neq('status', 'archivado')
      .order('priority', { ascending: true }),
    supabase.from('canvass_visits')
      .select('*, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name)')
      .eq('campaign_id', campaignId ?? '')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('canvass_visits')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId ?? ''),
    supabase.from('canvass_visits')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId ?? '')
      .eq('status', 'submitted'),
    supabase.from('canvass_visits')
      .select('territory_id')
      .eq('campaign_id', campaignId ?? '')
      .not('territory_id', 'is', null),
  ])

  // NOTE: Contact geo points are NO LONGER loaded server-side.
  // The map component fetches clustered points on-demand via /api/canvassing/map-points
  // based on the current viewport bounds and zoom level.
  // This eliminates loading all contacts with geo into memory (was the main bottleneck).

  const canApprove = ['super_admin', 'campaign_manager', 'field_coordinator'].includes(profile?.role ?? '')

  // ── Coverage data for map ────────────────────────────────────────────────────
  const visitsByTerritory = (visitCounts ?? []).reduce<Record<string, number>>((acc, v) => {
    if (v.territory_id) acc[v.territory_id] = (acc[v.territory_id] ?? 0) + 1
    return acc
  }, {})
  const coverageData: Record<string, number> = {}
  const visitDataForMap: Record<string, { visits: number; estimated: number }> = {}
  for (const t of territories ?? []) {
    const visits    = visitsByTerritory[t.id] ?? 0
    const estimated = (t.estimated_contacts as number | null) ?? 0
    const pct       = estimated > 0 ? Math.min(100, Math.round((visits / estimated) * 100)) : 0
    coverageData[t.id]    = pct
    visitDataForMap[t.id] = { visits, estimated }
  }
  const hasGeoData = (territories ?? []).some(t => t.geojson != null)

  const visitResults = recentVisits ?? []
  const positives = visitResults.filter(v => v.result === 'contacted' || v.result === 'positive').length
  const resultDistribution = [
    { name: 'Contactado', value: visitResults.filter(v => v.result === 'contacted' || v.result === 'positive').length },
    { name: 'Negativo',   value: visitResults.filter(v => v.result === 'negative').length },
    { name: 'Indeciso',   value: visitResults.filter(v => v.result === 'undecided').length },
    { name: 'No en casa', value: visitResults.filter(v => ['no_home', 'not_home', 'neighbor_absent'].includes(v.result)).length },
    { name: 'Seguimiento',value: visitResults.filter(v => v.result === 'follow_up' || v.result === 'come_back_later').length },
    { name: 'Rechazó',    value: visitResults.filter(v => v.result === 'refused').length },
  ].filter(r => r.value > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1b1f23]">Territorio</h1>
            <p className="text-sm text-[#6a737d] mt-1">
              {totalVisits ?? 0} visitas registradas en esta campaña
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/canvassing/scripts">
              <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 bg-slate-50 hover:bg-slate-100">
                <FileText className="h-4 w-4 mr-1.5" />
                Scripts
              </Button>
            </Link>
            <Link href="/dashboard/canvassing/territories">
              <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 bg-slate-50 hover:bg-slate-100">
                <MapPin className="h-4 w-4 mr-1.5" />
                Territorios
              </Button>
            </Link>
            <ExportButton baseUrl="/api/export/canvassing" />
            <Link href="/dashboard/canvassing/visits/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Registrar visita
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stat strip ── */}
        <CanvassingStats
          totalZones={territories?.length ?? 0}
          totalVisits={totalVisits ?? 0}
          pendingApproval={pendingApproval ?? 0}
          positives={positives}
          resultDistribution={resultDistribution}
        />

        {/* ── Coverage map ── */}
        {((territories?.length ?? 0) > 0 || campaignId) && (
          <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
            <div className="px-5 py-3 border-b border-[#dcdee6]">
              <h2 className="text-sm font-semibold text-[#1b1f23]">Cobertura de territorios</h2>
            </div>
            {!hasGeoData && (territories?.length ?? 0) > 0 && (
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                Ningún territorio tiene polígono dibujado aún.{' '}
                <Link href="/dashboard/canvassing/territories/new" className="underline hover:text-amber-900">
                  Crea un territorio y delimita su área en el mapa.
                </Link>
              </div>
            )}
            <CanvassingMapWithPanel
              territories={(territories ?? []).map(t => ({
                id:     t.id,
                name:   t.name,
                color:  t.color as string,
                status: t.status,
                geojson: t.geojson as object | null,
              }))}
              coverageData={coverageData}
              visitData={visitDataForMap}
              campaignId={campaignId ?? ''}
              defaultCenter={[6.1543, -75.3744]}
              defaultZoom={13}
            />
          </div>
        )}

        {/* ── Pending approvals alert ── */}
        {(pendingApproval ?? 0) > 0 && canApprove && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-md px-4 py-3">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 flex-1">
              <span className="font-semibold">{pendingApproval} visitas</span> están esperando tu aprobación
            </p>
            <Link href="#visits-table">
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-100 text-xs">
                Revisar ahora
              </Button>
            </Link>
          </div>
        )}

        {/* ── Main content: 2-column on large screens ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* Left: Visits table */}
          <div id="visits-table" className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dcdee6]">
              <h2 className="text-sm font-semibold text-[#1b1f23]">Actividad reciente</h2>
              <Link
                href="/dashboard/canvassing/visits"
                className="text-xs text-[#2960ec] hover:text-[#0a41cc] flex items-center gap-0.5"
              >
                Ver historial
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <CanvassingVisitsTable
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              visits={visitResults as any}
              canApprove={canApprove}
            />
          </div>

          {/* Right: Territories sidebar */}
          <div className="space-y-4 sticky top-6">
            <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#dcdee6]">
                <h2 className="text-sm font-semibold text-[#1b1f23]">Territorios activos</h2>
                <Link
                  href="/dashboard/canvassing/territories"
                  className="text-xs text-[#2960ec] hover:text-[#0a41cc] flex items-center gap-0.5"
                >
                  Ver todos
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {!territories?.length ? (
                <div className="px-4 py-8 text-center">
                  <MapPin className="h-8 w-8 text-[#dcdee6] mx-auto mb-2" />
                  <p className="text-xs text-[#6a737d]">Sin territorios definidos</p>
                  <Link href="/dashboard/canvassing/territories/new">
                    <Button variant="outline" size="sm" className="mt-3 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Crear territorio
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#dcdee6]">
                  {territories.slice(0, 6).map(t => (
                    <Link key={t.id} href={`/dashboard/canvassing/territories/${t.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.color ?? '#2960ec' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1b1f23] truncate">{t.name}</p>
                          <p className="text-xs text-[#6a737d] capitalize">{t.status.replace('_', ' ')}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-[#dcdee6] shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* New territory CTA */}
            <Link href="/dashboard/canvassing/territories/new" className="block">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#2960ec]/5 border border-[#2960ec]/20 rounded-md hover:bg-[#2960ec]/10 transition-colors cursor-pointer">
                <Plus className="h-4 w-4 text-[#2960ec] shrink-0" />
                <span className="text-sm font-medium text-[#2960ec]">Nuevo territorio</span>
              </div>
            </Link>

            {/* AI territory analysis */}
            <TerritoryAnalysisPanel />
          </div>

        </div>
      </div>
    </div>
  )
}
