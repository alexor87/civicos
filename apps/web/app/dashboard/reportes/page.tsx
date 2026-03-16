import { createClient } from '@/lib/supabase/server'
import { ReportesCharts } from '@/components/dashboard/ReportesCharts'
import { ReportesExportButtons } from '@/components/dashboard/ReportesExportButtons'

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''

  // ── Parallel queries ────────────────────────────────────────────────────────
  const [
    { count: totalContacts },
    { count: supporters },
    { count: totalVisits },
    { data: visitRows },
    { data: contactStatusRows },
    { data: emailReach },
    { data: smsReach },
    { data: activeVolunteerRows },
    { data: allVisitRows },
  ] = await Promise.all([
    // KPI: total contacts
    supabase.from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId),

    // KPI: supporters
    supabase.from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'supporter'),

    // KPI: total visits
    supabase.from('canvass_visits')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId),

    // Visits by day (last 30 days) — created_at + result
    supabase.from('canvass_visits')
      .select('created_at, result')
      .eq('campaign_id', campaignId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),

    // Contact status distribution
    supabase.from('contacts')
      .select('status')
      .eq('campaign_id', campaignId),

    // Email campaigns reach
    supabase.from('email_campaigns')
      .select('recipient_count')
      .eq('campaign_id', campaignId)
      .eq('status', 'sent'),

    // SMS campaigns reach
    supabase.from('sms_campaigns')
      .select('recipient_count')
      .eq('campaign_id', campaignId)
      .eq('status', 'sent'),

    // Active volunteers (last 7 days)
    supabase.from('canvass_visits')
      .select('volunteer_id')
      .eq('campaign_id', campaignId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    // All visits with territory + volunteer info
    supabase.from('canvass_visits')
      .select('volunteer_id, territory_id, territories(name)')
      .eq('campaign_id', campaignId),
  ])

  // ── Geo zone stats (contacts + visits per department) ────────────────────────
  const [{ data: contactsByDept }, { data: visitsByDept }] = await Promise.all([
    supabase.from('contacts')
      .select('department')
      .eq('campaign_id', campaignId)
      .not('department', 'is', null),
    supabase.from('canvass_visits')
      .select('contacts(department)')
      .eq('campaign_id', campaignId),
  ])

  const geoContactMap: Record<string, number> = {}
  for (const c of contactsByDept ?? []) {
    if (!c.department) continue
    geoContactMap[c.department] = (geoContactMap[c.department] ?? 0) + 1
  }

  const geoVisitMap: Record<string, number> = {}
  for (const v of visitsByDept ?? []) {
    const dept = (v.contacts as { department?: string } | null)?.department
    if (!dept) continue
    geoVisitMap[dept] = (geoVisitMap[dept] ?? 0) + 1
  }

  const allZones = new Set([...Object.keys(geoContactMap), ...Object.keys(geoVisitMap)])
  const geoZoneStats = Array.from(allZones)
    .map(name => ({ name, contactos: geoContactMap[name] ?? 0, visitas: geoVisitMap[name] ?? 0 }))
    .sort((a, b) => b.contactos - a.contactos)
    .slice(0, 10)

  // ── KPI calculations ────────────────────────────────────────────────────────
  const total  = totalContacts ?? 0
  const visits = totalVisits   ?? 0

  const coverageRate        = total  ? Math.round((visits / total) * 100) : 0
  const supportRate         = total  ? Math.round(((supporters ?? 0) / total) * 100) : 0
  const communicationsReach = [
    ...(emailReach ?? []),
    ...(smsReach   ?? []),
  ].reduce((s, r) => s + (r.recipient_count ?? 0), 0)

  const activeVolunteers = new Set(
    (activeVolunteerRows ?? []).map(r => r.volunteer_id).filter(Boolean)
  ).size

  // ── Visits by day ───────────────────────────────────────────────────────────
  const dayMap: Record<string, number> = {}
  for (const v of visitRows ?? []) {
    const d    = new Date(v.created_at)
    const key  = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    dayMap[key] = (dayMap[key] ?? 0) + 1
  }
  const visitsByDay = Object.entries(dayMap).map(([date, visitas]) => ({ date, visitas }))

  // ── Visit results distribution ──────────────────────────────────────────────
  const resultLabels: Record<string, string> = {
    positive:  'Positivo',
    negative:  'Negativo',
    undecided: 'Indeciso',
    no_home:   'No estaba',
    refused:   'Rechazó',
    follow_up: 'Seguimiento',
  }
  const resultMap: Record<string, number> = {}
  for (const v of visitRows ?? []) {
    if (!v.result) continue
    const label = resultLabels[v.result] ?? v.result
    resultMap[label] = (resultMap[label] ?? 0) + 1
  }
  const visitResults = Object.entries(resultMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // ── Contact intentions ──────────────────────────────────────────────────────
  const intentionLabels: Record<string, string> = {
    supporter: 'Simpatizante',
    opponent:  'Opositor',
    undecided: 'Indeciso',
    unknown:   'Desconocido',
  }
  const intentionMap: Record<string, number> = {}
  for (const c of contactStatusRows ?? []) {
    const label = intentionLabels[c.status] ?? c.status
    intentionMap[label] = (intentionMap[label] ?? 0) + 1
  }
  const contactIntentions = Object.entries(intentionMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // ── Territory coverage ──────────────────────────────────────────────────────
  const territoryMap: Record<string, { name: string; visitas: number }> = {}
  for (const v of allVisitRows ?? []) {
    if (!v.territory_id) continue
    const name = (v.territories as { name?: string } | null)?.name ?? v.territory_id
    if (!territoryMap[v.territory_id]) {
      territoryMap[v.territory_id] = { name, visitas: 0 }
    }
    territoryMap[v.territory_id].visitas++
  }
  const territoryCoverage = Object.values(territoryMap)
    .sort((a, b) => b.visitas - a.visitas)
    .slice(0, 10)

  // ── Volunteer ranking ───────────────────────────────────────────────────────
  const volMap: Record<string, number> = {}
  for (const v of allVisitRows ?? []) {
    if (!v.volunteer_id) continue
    volMap[v.volunteer_id] = (volMap[v.volunteer_id] ?? 0) + 1
  }
  // Fetch names for top 10 volunteers
  const topVolIds = Object.entries(volMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id)

  const volunteerRanking: { id: string; name: string; visitas: number }[] = []
  if (topVolIds.length > 0) {
    const { data: volProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', topVolIds)

    const nameMap = Object.fromEntries((volProfiles ?? []).map(p => [p.id, p.full_name ?? 'Sin nombre']))
    for (const id of topVolIds) {
      volunteerRanking.push({ id, name: nameMap[id] ?? 'Sin nombre', visitas: volMap[id] })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1b1f23]">Reportes</h1>
            <p className="text-sm text-[#6a737d] mt-1">Estado integral de la campaña</p>
          </div>
          <ReportesExportButtons />
        </div>

        <ReportesCharts
          coverageRate={coverageRate}
          supportRate={supportRate}
          activeVolunteers={activeVolunteers}
          communicationsReach={communicationsReach}
          totalContacts={total}
          totalVisits={visits}
          visitsByDay={visitsByDay}
          visitResults={visitResults}
          contactIntentions={contactIntentions}
          territoryCoverage={territoryCoverage}
          volunteerRanking={volunteerRanking}
          geoZoneStats={geoZoneStats}
        />

      </div>
    </div>
  )
}
