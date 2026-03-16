/**
 * Server-side Colombia geographic data helpers.
 * Used by both the import API route and the onboarding route.
 */
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Shared row type ────────────────────────────────────────────────────────────

export interface GeoRow {
  tipo: string
  nombre: string
  codigo?: string
  padre?: string
  poblacion?: string | number
}

// ── Department code → name lookup ─────────────────────────────────────────────

const DEPT_NAMES: Record<string, string> = {
  '05': 'Antioquia',
  '08': 'Atlántico',
  '11': 'Bogotá D.C.',
  '13': 'Bolívar',
  '17': 'Caldas',
  '50': 'Meta',
  '54': 'Norte de Santander',
  '63': 'Quindío',
  '66': 'Risaralda',
  '68': 'Santander',
  '73': 'Tolima',
  '76': 'Valle del Cauca',
}

// ── Colombia JSON parser ───────────────────────────────────────────────────────

export function parseColombiaFormat(data: { ciudades: unknown[] }): GeoRow[] {
  const rows: GeoRow[] = []
  const deptosSeen = new Set<string>()

  for (const rawCiudad of data.ciudades) {
    const ciudad = rawCiudad as Record<string, unknown>
    const deptCodigo = String(ciudad.departamento_codigo ?? '')
    const deptNombre = DEPT_NAMES[deptCodigo] ?? `Departamento ${deptCodigo}`

    if (!deptosSeen.has(deptCodigo)) {
      rows.push({ tipo: 'departamento', nombre: deptNombre, codigo: deptCodigo })
      deptosSeen.add(deptCodigo)
    }

    const munNombre = String(ciudad.municipio_nombre ?? '')
    rows.push({ tipo: 'municipio', nombre: munNombre, codigo: String(ciudad.municipio_codigo ?? ''), padre: deptNombre })

    // Localidades (Bogotá, Barranquilla, Cartagena)
    for (const rawLoc of (ciudad.localidades as unknown[]) ?? []) {
      const loc = rawLoc as Record<string, unknown>
      const locNombre = String(loc.nombre ?? '')
      rows.push({ tipo: 'localidad', nombre: locNombre, codigo: String(loc.codigo ?? ''), padre: munNombre })
      if (Array.isArray(loc.upz) && loc.upz.length > 0) {
        for (const rawUpz of loc.upz as unknown[]) {
          const upz = rawUpz as Record<string, unknown>
          const upzNombre = String(upz.nombre ?? '')
          rows.push({ tipo: 'upz', nombre: upzNombre, codigo: String(upz.codigo ?? ''), padre: locNombre })
          for (const barrio of (upz.barrios as string[]) ?? []) {
            rows.push({ tipo: 'barrio', nombre: barrio, padre: upzNombre })
          }
        }
      } else {
        for (const barrio of (loc.barrios as string[]) ?? []) {
          rows.push({ tipo: 'barrio', nombre: barrio, padre: locNombre })
        }
      }
    }

    // Comunas
    for (const rawComuna of (ciudad.comunas as unknown[]) ?? []) {
      const comuna = rawComuna as Record<string, unknown>
      const comunaNombre = String(comuna.nombre ?? '')
      rows.push({ tipo: 'comuna', nombre: comunaNombre, codigo: String(comuna.codigo ?? ''), padre: munNombre })
      for (const barrio of (comuna.barrios as unknown[]) ?? []) {
        if (typeof barrio === 'string') {
          rows.push({ tipo: 'barrio', nombre: barrio, padre: comunaNombre })
        } else {
          const b = barrio as Record<string, unknown>
          const bNombre = String(b.nombre ?? '')
          rows.push({ tipo: 'barrio', nombre: bNombre, padre: comunaNombre })
          for (const sector of (b.sectores as string[]) ?? []) {
            rows.push({ tipo: 'barrio', nombre: sector, padre: bNombre })
          }
        }
      }
    }

    // Corregimientos
    for (const rawCorr of (ciudad.corregimientos as unknown[]) ?? []) {
      const corr = rawCorr as Record<string, unknown>
      const corrNombre = String(corr.nombre ?? '')
      rows.push({ tipo: 'corregimiento', nombre: corrNombre, codigo: String(corr.codigo ?? ''), padre: munNombre })
      for (const vereda of (corr.veredas as string[]) ?? []) {
        rows.push({ tipo: 'vereda', nombre: vereda, padre: corrNombre })
      }
    }
  }

  return rows
}

// ── Read Colombia JSON from public/ ───────────────────────────────────────────

export function readColombiaRows(): GeoRow[] {
  const jsonPath = join(process.cwd(), 'public', 'geo', 'colombia.json')
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8')) as { ciudades: unknown[] }
  return parseColombiaFormat(data)
}

// ── Generic batch import ───────────────────────────────────────────────────────
// Inserts GeoRows in dependency order, resolving parent IDs by name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function importGeoRows(
  adminSupabase: any,
  rows: GeoRow[],
  tenantId: string,
  campaignId: string
): Promise<{ imported: number; skipped: number }> {
  const BATCH_SIZE = 500
  let imported = 0
  let skipped = 0
  const idByName: Record<string, string> = {}

  function buildPayload(row: GeoRow, parentId: string | null) {
    return {
      tenant_id:   tenantId,
      campaign_id: campaignId,
      type:        row.tipo.trim().toLowerCase(),
      name:        row.nombre.toString().trim(),
      code:        row.codigo?.toString().trim() || null,
      parent_id:   parentId,
      geojson:     null,
      population:  row.poblacion ? Number(row.poblacion) || null : null,
    }
  }

  async function insertLevel(levelRows: GeoRow[]) {
    for (let i = 0; i < levelRows.length; i += BATCH_SIZE) {
      const batch = levelRows.slice(i, i + BATCH_SIZE).map(r => {
        const parentId = r.padre ? (idByName[r.padre.toLowerCase()] ?? null) : null
        return buildPayload(r, parentId)
      })
      const { data, error } = await adminSupabase.from('geo_units').insert(batch).select('id, name')
      if (error) {
        skipped += batch.length
      } else {
        imported += data?.length ?? 0
        for (const d of data ?? []) idByName[d.name.toLowerCase()] = d.id
      }
    }
  }

  async function fetchExisting(types: string[]) {
    for (const type of types) {
      const { data } = await adminSupabase
        .from('geo_units').select('id, name')
        .eq('campaign_id', campaignId).eq('type', type)
      for (const d of data ?? []) idByName[d.name.toLowerCase()] = d.id
    }
  }

  // Bucket by type
  const byType: Record<string, GeoRow[]> = {}
  for (const row of rows) {
    const t = row.tipo.trim().toLowerCase()
    if (!byType[t]) byType[t] = []
    byType[t].push(row)
  }

  // Insert in dependency order
  await insertLevel(byType['departamento'] ?? [])
  await fetchExisting(['departamento'])

  await insertLevel(byType['municipio'] ?? [])
  await fetchExisting(['municipio'])

  // Level 2: localidad, comuna, corregimiento (all children of municipio)
  await insertLevel([
    ...(byType['localidad']    ?? []),
    ...(byType['comuna']       ?? []),
    ...(byType['corregimiento'] ?? []),
  ])
  await fetchExisting(['localidad', 'comuna', 'corregimiento'])

  // Level 3: upz (child of localidad)
  await insertLevel(byType['upz'] ?? [])
  await fetchExisting(['upz'])

  // Level 4: barrio (child of localidad/upz/comuna/corregimiento)
  await insertLevel(byType['barrio'] ?? [])

  // Level 5: vereda (child of corregimiento)
  await insertLevel(byType['vereda'] ?? [])

  return { imported, skipped }
}
