import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { importGeoRows } from '@/lib/geo/colombia-import'

const VALID_TYPES = ['departamento', 'municipio', 'localidad', 'upz', 'comuna', 'corregimiento', 'barrio', 'vereda'] as const
type GeoType = typeof VALID_TYPES[number]

interface GeoRow {
  tipo?: string
  nombre?: string
  codigo?: string
  padre?: string
  poblacion?: string | number
  [key: string]: string | number | undefined
}

// ── Nested JSON normalizer ─────────────────────────────────────────────────────
function normalizeNested(data: unknown[]): GeoRow[] {
  const flat: GeoRow[] = []
  for (const dept of data) {
    if (typeof dept !== 'object' || !dept) continue
    const d = dept as Record<string, unknown>
    flat.push({ tipo: 'departamento', nombre: String(d.nombre ?? d.name ?? ''), codigo: String(d.codigo ?? d.code ?? '') })
    const municipios = (d.municipios ?? d.cities ?? []) as unknown[]
    for (const mun of municipios) {
      if (typeof mun !== 'object' || !mun) continue
      const m = mun as Record<string, unknown>
      flat.push({ tipo: 'municipio', nombre: String(m.nombre ?? m.name ?? ''), padre: String(d.nombre ?? d.name ?? ''), codigo: String(m.codigo ?? m.code ?? '') })
      const barrios = (m.barrios ?? m.neighborhoods ?? []) as unknown[]
      for (const bar of barrios) {
        const barName = typeof bar === 'string' ? bar : String((bar as Record<string, unknown>).nombre ?? (bar as Record<string, unknown>).name ?? '')
        flat.push({ tipo: 'barrio', nombre: barName, padre: String(m.nombre ?? m.name ?? '') })
      }
    }
  }
  return flat
}

// ── POST /api/import/geo-units ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'campaign_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const campaignId = profile.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No campaign assigned' }, { status: 400 })

  const body = await request.json()
  let rawRows: GeoRow[] = body.rows ?? []

  // Accept nested JSON format and normalize it
  if (rawRows.length === 0 && Array.isArray(body)) {
    rawRows = normalizeNested(body)
  } else if (rawRows.length > 0 && !rawRows[0].tipo && (rawRows[0] as Record<string, unknown>).municipios) {
    rawRows = normalizeNested(rawRows as unknown[])
  }

  if (!rawRows.length) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  // ── Validate rows ─────────────────────────────────────────────────────────────
  const errors: string[] = []
  const validRows: GeoRow[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i]
    const tipo  = row.tipo?.trim().toLowerCase() as GeoType | undefined
    const nombre = row.nombre?.toString().trim()

    if (!nombre) { errors.push(`Fila ${i + 2}: 'nombre' es requerido`); continue }
    if (!tipo || !VALID_TYPES.includes(tipo)) {
      errors.push(`Fila ${i + 2}: 'tipo' inválido ("${tipo}"). Debe ser: ${VALID_TYPES.join(', ')}`)
      continue
    }
    validRows.push(row)
  }

  // ── Batch insert via shared helper ────────────────────────────────────────────
  const adminSupabase = await createAdminClient()
  const { imported, skipped } = await importGeoRows(adminSupabase, validRows, profile.tenant_id, campaignId)

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) })
}

// ── DELETE /api/import/geo-units — limpiar base geográfica ────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids, role').eq('id', user.id).single()

  if (!profile || !['super_admin', 'campaign_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const campaignId = profile.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No campaign assigned' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const confirm = searchParams.get('confirm')
  if (confirm !== 'true') return NextResponse.json({ error: 'Requiere ?confirm=true' }, { status: 400 })

  const adminSupabase = await createAdminClient()
  const { count } = await adminSupabase
    .from('geo_units').delete().eq('campaign_id', campaignId).select('id', { count: 'exact', head: true })

  return NextResponse.json({ deleted: count ?? 0 })
}

// ── GET /api/import/geo-units — stats de la base actual ───────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()

  const campaignId = profile?.campaign_ids?.[0]
  const empty = { departamentos: 0, municipios: 0, localidades: 0, upzs: 0, comunas: 0, corregimientos: 0, barrios: 0, veredas: 0 }
  if (!campaignId) return NextResponse.json(empty)

  const GEO_TYPES = ['departamento', 'municipio', 'localidad', 'upz', 'comuna', 'corregimiento', 'barrio', 'vereda'] as const
  const counts = await Promise.all(
    GEO_TYPES.map(t =>
      supabase.from('geo_units').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('type', t)
    )
  )
  const result = Object.fromEntries(GEO_TYPES.map((t, i) => [`${t}s`, counts[i].count ?? 0]))
  return NextResponse.json(result)
}
