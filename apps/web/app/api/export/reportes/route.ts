import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, election_date')
    .eq('id', campaignId)
    .single()

  const now = new Date()
  const cutoff30d = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  const cutoff7d  = new Date(now.getTime() -  7 * 86_400_000).toISOString()

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [
    { count: totalContacts },
    { count: supporters },
    { count: opponents },
    { count: undecided },
    { count: totalVisits },
    { data: visitRows },
    { data: contactStatusRows },
    { data: emailReach },
    { data: smsReach },
    { data: activeVolunteerRows },
    { data: allVisitRows },
    { data: contactsByDept },
  ] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).is('deleted_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'supporter').is('deleted_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'opponent').is('deleted_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'undecided').is('deleted_at', null),
    supabase.from('canvass_visits').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId),
    supabase.from('canvass_visits').select('created_at, result').eq('campaign_id', campaignId).gte('created_at', cutoff30d).order('created_at', { ascending: true }),
    supabase.from('contacts').select('status').eq('campaign_id', campaignId).is('deleted_at', null),
    supabase.from('email_campaigns').select('recipient_count').eq('campaign_id', campaignId).eq('status', 'sent'),
    supabase.from('sms_campaigns').select('recipient_count').eq('campaign_id', campaignId).eq('status', 'sent'),
    supabase.from('canvass_visits').select('volunteer_id').eq('campaign_id', campaignId).gte('created_at', cutoff7d),
    supabase.from('canvass_visits').select('volunteer_id, territory_id, territories(name)').eq('campaign_id', campaignId),
    supabase.from('contacts').select('department').eq('campaign_id', campaignId).not('department', 'is', null).is('deleted_at', null),
  ])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const total   = totalContacts ?? 0
  const visits  = totalVisits   ?? 0
  const coverageRate = total ? Math.round((visits / total) * 100) : 0
  const supportRate  = total ? Math.round(((supporters ?? 0) / total) * 100) : 0
  const communicationsReach = [
    ...(emailReach ?? []), ...(smsReach ?? []),
  ].reduce((s, r) => s + (r.recipient_count ?? 0), 0)
  const activeVolunteers = new Set((activeVolunteerRows ?? []).map(r => r.volunteer_id).filter(Boolean)).size
  const daysToElection = campaign?.election_date
    ? Math.ceil((new Date(campaign.election_date).getTime() - now.getTime()) / 86_400_000)
    : null

  // ── Sheet 1: Resumen ejecutivo ────────────────────────────────────────────
  const fechaReporte = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const resumenRows = [
    { 'Indicador': 'Campaña',                    'Valor': campaign?.name ?? '' },
    { 'Indicador': 'Fecha del reporte',           'Valor': fechaReporte },
    { 'Indicador': 'Días para la elección',       'Valor': daysToElection !== null ? `${daysToElection} días` : 'N/A' },
    { 'Indicador': '',                            'Valor': '' },
    { 'Indicador': 'Total contactos',             'Valor': total },
    { 'Indicador': 'Simpatizantes',               'Valor': supporters ?? 0 },
    { 'Indicador': 'Opositores',                  'Valor': opponents ?? 0 },
    { 'Indicador': 'Indecisos',                   'Valor': undecided ?? 0 },
    { 'Indicador': 'Tasa de apoyo',               'Valor': `${supportRate}%` },
    { 'Indicador': '',                            'Valor': '' },
    { 'Indicador': 'Total visitas de canvassing', 'Valor': visits },
    { 'Indicador': 'Cobertura de canvassing',     'Valor': `${coverageRate}%` },
    { 'Indicador': 'Voluntarios activos (7 días)','Valor': activeVolunteers },
    { 'Indicador': 'Alcance comunicaciones',      'Valor': communicationsReach },
  ]

  // ── Sheet 2: Visitas por día (últimos 30 días) ────────────────────────────
  const dayMap: Record<string, number> = {}
  for (const v of visitRows ?? []) {
    const d   = new Date(v.created_at)
    const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    dayMap[key] = (dayMap[key] ?? 0) + 1
  }
  const visitasPorDia = Object.entries(dayMap).map(([fecha, visitas]) => ({ 'Fecha': fecha, 'Visitas': visitas }))

  // ── Sheet 3: Resultados de visitas ────────────────────────────────────────
  const resultLabels: Record<string, string> = {
    positive: 'Positivo', negative: 'Negativo', undecided: 'Indeciso',
    no_home: 'No estaba', refused: 'Rechazó', follow_up: 'Seguimiento',
  }
  const resultMap: Record<string, number> = {}
  for (const v of visitRows ?? []) {
    if (!v.result) continue
    const label = resultLabels[v.result] ?? v.result
    resultMap[label] = (resultMap[label] ?? 0) + 1
  }
  const resultadosVisitas = Object.entries(resultMap)
    .sort(([, a], [, b]) => b - a)
    .map(([resultado, cantidad]) => ({ 'Resultado': resultado, 'Cantidad': cantidad, 'Porcentaje': visits ? `${Math.round((cantidad / visits) * 100)}%` : '0%' }))

  // ── Sheet 4: Intenciones de voto ──────────────────────────────────────────
  const intentionLabels: Record<string, string> = {
    supporter: 'Simpatizante', opponent: 'Opositor', undecided: 'Indeciso', unknown: 'Desconocido',
  }
  const intentionMap: Record<string, number> = {}
  for (const c of contactStatusRows ?? []) {
    const label = intentionLabels[c.status] ?? c.status
    intentionMap[label] = (intentionMap[label] ?? 0) + 1
  }
  const intencionesVoto = Object.entries(intentionMap)
    .sort(([, a], [, b]) => b - a)
    .map(([intencion, cantidad]) => ({ 'Intención': intencion, 'Cantidad': cantidad, 'Porcentaje': total ? `${Math.round((cantidad / total) * 100)}%` : '0%' }))

  // ── Sheet 5: Cobertura por territorio ────────────────────────────────────
  const territoryMap: Record<string, { nombre: string; visitas: number }> = {}
  for (const v of allVisitRows ?? []) {
    if (!v.territory_id) continue
    const name = (v.territories as { name?: string } | null)?.name ?? v.territory_id
    if (!territoryMap[v.territory_id]) territoryMap[v.territory_id] = { nombre: name, visitas: 0 }
    territoryMap[v.territory_id].visitas++
  }
  const coberturaTerritorios = Object.values(territoryMap)
    .sort((a, b) => b.visitas - a.visitas)
    .map(t => ({ 'Territorio': t.nombre, 'Visitas': t.visitas }))

  // ── Sheet 6: Ranking de voluntarios ──────────────────────────────────────
  const volMap: Record<string, number> = {}
  for (const v of allVisitRows ?? []) {
    if (!v.volunteer_id) continue
    volMap[v.volunteer_id] = (volMap[v.volunteer_id] ?? 0) + 1
  }
  const topVolIds = Object.entries(volMap).sort(([, a], [, b]) => b - a).slice(0, 20).map(([id]) => id)
  let rankingVoluntarios: { 'Posición': number; 'Voluntario': string; 'Visitas': number }[] = []
  if (topVolIds.length > 0) {
    const { data: volProfiles } = await supabase.from('profiles').select('id, full_name').in('id', topVolIds)
    const nameMap = Object.fromEntries((volProfiles ?? []).map(p => [p.id, p.full_name ?? 'Sin nombre']))
    rankingVoluntarios = topVolIds.map((id, i) => ({
      'Posición': i + 1,
      'Voluntario': nameMap[id] ?? 'Sin nombre',
      'Visitas': volMap[id],
    }))
  }

  // ── Sheet 7: Distribución geográfica ─────────────────────────────────────
  const geoContactMap: Record<string, number> = {}
  for (const c of contactsByDept ?? []) {
    if (!c.department) continue
    geoContactMap[c.department] = (geoContactMap[c.department] ?? 0) + 1
  }
  const distribucionGeo = Object.entries(geoContactMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([departamento, contactos]) => ({ 'Departamento': departamento, 'Contactos': contactos }))

  // ── Build workbook ────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenRows),         'Resumen Ejecutivo')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(visitasPorDia),        'Visitas por Día')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resultadosVisitas),    'Resultados Visitas')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(intencionesVoto),      'Intenciones de Voto')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coberturaTerritorios), 'Territorios')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rankingVoluntarios),   'Ranking Voluntarios')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distribucionGeo),      'Distribución Geo')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
  const fecha = now.toISOString().slice(0, 10)
  const nombreArchivo = `reporte-campaña-${fecha}.xlsx`

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  })
}
