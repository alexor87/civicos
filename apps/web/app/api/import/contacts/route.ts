import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocoding'

// ── Valid DB columns for contacts (excludes auto-generated fields) ───────────

const VALID_CONTACT_FIELDS = new Set([
  'first_name', 'last_name', 'email', 'phone',
  'document_type', 'document_number', 'birth_date', 'gender',
  'address', 'city', 'district', 'department', 'municipality', 'commune',
  'voting_place', 'voting_table',
  'status', 'contact_level', 'campaign_role', 'electoral_priority', 'capture_source', 'notes',
])

// Fields that go into the metadata JSONB column (not direct DB columns)
const META_FIELDS = new Set([
  'phone_alternate', 'marital_status', 'political_affinity',
  'political_orientation', 'vote_intention', 'source_detail',
  'referred_by', 'mobilizes_count', 'main_need',
  'economic_sector', 'beneficiary_program', 'sector',
])

// ── Header alias map (fallback for pre-mapped imports) ──────────────────────

const HEADER_ALIASES: Record<string, string> = {
  nombre: 'first_name', apellido: 'last_name', apellidos: 'last_name',
  first_name: 'first_name', last_name: 'last_name',
  telefono: 'phone', 'teléfono': 'phone', phone: 'phone', celular: 'phone',
  correo: 'email', 'correo electronico': 'email', 'correo electrónico': 'email', email: 'email',
  'nro cc': 'document_number', cedula: 'document_number', 'cédula': 'document_number',
  documento: 'document_number', document_number: 'document_number',
  'puesto de votacion': 'voting_place', 'puesto de votación': 'voting_place', voting_place: 'voting_place',
  mesa: 'voting_table', 'mesa de': 'voting_table', voting_table: 'voting_table',
  'fecha de nacimiento': 'birth_date', birth_date: 'birth_date',
  direccion: 'address', 'dirección': 'address', address: 'address',
  barrio: 'district', 'barrio/vereda': 'district', vereda: 'district',
  district: 'district',
  ciudad: 'municipality', city: 'municipality',
  comuna: 'commune', origen: 'commune', commune: 'commune',
  referido: 'referred_by', 'nombre de lider/referido': 'referred_by',
  'lider que refiere': 'referred_by', 'líder que refiere': 'referred_by',
  referred_by: 'referred_by',
  estado: 'status', status: 'status',
  notes: 'notes',
  'telefono alterno': 'phone_alternate', 'celular alterno': 'phone_alternate',
  phone_alternate: 'phone_alternate',
  sector: 'sector',
  'afinidad politica': 'political_affinity', 'afinidad política': 'political_affinity',
  political_affinity: 'political_affinity',
  'orientacion politica': 'political_orientation', 'orientación política': 'political_orientation',
  political_orientation: 'political_orientation',
  'intencion de voto': 'vote_intention', 'intención de voto': 'vote_intention',
  vote_intention: 'vote_intention',
  'estado civil': 'marital_status', marital_status: 'marital_status',
  'detalle de fuente': 'source_detail', source_detail: 'source_detail',
  'votos que moviliza': 'mobilizes_count', mobilizes_count: 'mobilizes_count',
  'necesidad principal': 'main_need', main_need: 'main_need',
  'sector economico': 'economic_sector', 'sector económico': 'economic_sector',
  economic_sector: 'economic_sector',
  'beneficiario de programa': 'beneficiary_program', beneficiary_program: 'beneficiary_program',
  'nivel de contacto': 'contact_level', nivel: 'contact_level', contact_level: 'contact_level',
  etiquetas: 'tags', tags: 'tags',
}

// ── Merge logic (shared with /api/contacts/merge) ───────────────────────────

const LEVEL_ORDER: Record<string, number> = { anonimo: 0, opinion: 1, completo: 2 }

const MERGE_FIELDS = [
  'first_name', 'last_name', 'phone', 'email',
  'document_type', 'document_number',
  'address', 'department', 'municipality', 'commune',
  'district', 'city',
  'voting_place', 'voting_table',
  'birth_date', 'gender',
  'location_lat', 'location_lng', 'geocoding_status',
] as const

interface SkippedDetail {
  row: number
  name: string
  reason: string
  blockingContact?: string
}

function buildMergeUpdate(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const updateObj: Record<string, unknown> = {}

  for (const field of MERGE_FIELDS) {
    const targetVal = target[field]
    const sourceVal = source[field]
    if (!targetVal && sourceVal) {
      updateObj[field] = sourceVal
    }
  }

  // contact_level: keep the higher one
  const targetLevel = LEVEL_ORDER[target.contact_level as string] ?? 0
  const sourceLevel = LEVEL_ORDER[source.contact_level as string] ?? 0
  if (sourceLevel > targetLevel) {
    updateObj.contact_level = source.contact_level
  }

  // tags: union without duplicates
  const targetTags: string[] = (target.tags as string[]) ?? []
  const sourceTags: string[] = (source.tags as string[]) ?? []
  const mergedTags = [...new Set([...targetTags, ...sourceTags])]
  if (mergedTags.length > targetTags.length) {
    updateObj.tags = mergedTags
  }

  // metadata: deep merge (source as base, target overwrites)
  const sourceMetadata = (source.metadata ?? {}) as Record<string, unknown>
  const targetMetadata = (target.metadata ?? {}) as Record<string, unknown>
  const mergedMetadata = { ...sourceMetadata, ...targetMetadata }
  if (Object.keys(mergedMetadata).length > Object.keys(targetMetadata).length) {
    updateObj.metadata = mergedMetadata
  }

  // notes: concatenate if both have content
  if (source.notes && target.notes && source.notes !== target.notes) {
    updateObj.notes = `${target.notes}\n---\n${source.notes}`
  } else if (source.notes && !target.notes) {
    updateObj.notes = source.notes
  }

  return updateObj
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type NormalizedRow = Record<string, string | undefined>

function normalizeHeaders(rows: Record<string, unknown>[]): NormalizedRow[] {
  return rows.map(row => {
    const normalized: NormalizedRow = {}
    for (const [key, value] of Object.entries(row)) {
      const mapped = HEADER_ALIASES[key.trim().toLowerCase()]
      if (mapped) {
        const strVal = typeof value === 'number' ? String(value) : (value as string)
        // If field already has a value (e.g. two columns map to 'notes'), concatenate
        if (normalized[mapped] && strVal?.trim()) {
          normalized[mapped] = `${normalized[mapped]} | ${strVal.trim()}`
        } else if (!normalized[mapped]) {
          normalized[mapped] = strVal
        }
      }
    }
    return normalized
  })
}

function parseDateOrNull(val?: string): string | null {
  if (!val?.trim()) return null
  const trimmed = val.trim()
  const parts = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (parts) {
    const [, a, b, year] = parts
    let day: string, month: string
    if (parseInt(b) > 12) {
      // Second number can't be a month → format is MM/DD/YYYY
      month = a
      day = b
    } else {
      // DD/MM/YYYY (default Colombian convention)
      day = a
      month = b
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return null
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'campaign_manager', 'field_coordinator'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const campaignId = profile.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No campaign assigned' }, { status: 400 })

  const body = await request.json()
  const rawRows: Record<string, unknown>[] = body.rows
  const preMapped: boolean = body.preMapped === true
  if (!rawRows?.length) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  // DoS prevention: limit rows per import
  const MAX_ROWS = 5_000
  if (rawRows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Máximo ${MAX_ROWS} filas por importación` }, { status: 400 })
  }

  // If rows come from the column mapper UI, they're already mapped to DB field names.
  // Apply the same field allowlist in both paths to prevent preMapped field injection bypass.
  const normalizedRows: NormalizedRow[] = preMapped
    ? rawRows.map(row => {
        const nr: NormalizedRow = {}
        for (const [k, v] of Object.entries(row)) {
          // Only allow known fields — prevents arbitrary column injection
          if (VALID_CONTACT_FIELDS.has(k) || META_FIELDS.has(k) || k === 'tags' || k === 'contact_level') {
            nr[k] = typeof v === 'number' ? String(v) : (v as string)
          }
        }
        return nr
      })
    : normalizeHeaders(rawRows)

  const adminSupabase = await createAdminClient()

  const VALID_STATUSES = ['supporter', 'undecided', 'opponent', 'unknown']
  let importedCount = 0
  let skippedCount = 0
  const errors: string[] = []
  const BATCH_SIZE = 500

  // Build contact objects with validation (JS-side) — dedup handled by DB via ON CONFLICT
  const contactsToInsert = []

  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i]
    const firstName = row.first_name?.trim()
    const lastName = row.last_name?.trim()

    if (!firstName || !lastName) {
      errors.push(`Fila ${i + 2}: nombre y apellido son requeridos`)
      continue
    }

    const email = row.email?.trim().toLowerCase() || null
    const phone = row.phone?.replace(/\D/g, '') || null
    const documentNumber = row.document_number?.trim() || null

    const status = VALID_STATUSES.includes(row.status ?? '') ? row.status! : 'unknown'

    // Resolve contact_level: use explicit value or auto-detect
    const VALID_LEVELS = ['completo', 'opinion', 'anonimo']
    let contactLevel = row.contact_level?.trim().toLowerCase() ?? ''
    if (!VALID_LEVELS.includes(contactLevel)) {
      // Auto-detect level based on available data
      if (!firstName) {
        contactLevel = 'anonimo'
      } else if (!documentNumber && !phone) {
        contactLevel = 'opinion'
      } else {
        contactLevel = 'completo'
      }
    }

    // Build contact object with only valid DB columns
    const contact: Record<string, unknown> = {
      tenant_id: profile.tenant_id,
      campaign_id: campaignId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      status: status as 'supporter' | 'undecided' | 'opponent' | 'unknown',
      contact_level: contactLevel,
      document_number: documentNumber,
      metadata: {},
    }

    // Field length limits (prevent DoS via oversized strings)
    const MAX_FIELD_LEN = 500
    const MAX_NOTES_LEN = 3_000

    // Add optional fields that exist in DB
    for (const field of VALID_CONTACT_FIELDS) {
      if (contact[field] !== undefined) continue // already set above
      const val = row[field]?.trim()
      if (!val) continue
      if (field === 'birth_date') {
        contact[field] = parseDateOrNull(val)
      } else {
        contact[field] = val.slice(0, field === 'notes' ? MAX_NOTES_LEN : MAX_FIELD_LEN)
      }
    }

    // Add metadata fields (stored in JSONB column)
    const metadata: Record<string, unknown> = {}
    for (const field of META_FIELDS) {
      const val = row[field]?.trim()
      if (val) metadata[field] = val.slice(0, MAX_FIELD_LEN)
    }
    if (Object.keys(metadata).length) contact.metadata = metadata

    // Tags (comma-separated → array)
    const tagsVal = row.tags?.trim()
    if (tagsVal) contact.tags = tagsVal.split(',').map((t: string) => t.trim()).filter(Boolean)

    contactsToInsert.push(contact)
  }

  // Pre-check for duplicates by document_number, then insert or merge
  const allInserted: { id: string; address?: string; municipality?: string; department?: string }[] = []
  let mergedCount = 0
  const skippedDetails: SkippedDetail[] = []

  // 1. Batch-load existing contacts by document_number for this campaign
  const docNumbers = contactsToInsert
    .map(c => c.document_number as string)
    .filter(Boolean)

  const existingByDoc = new Map<string, Record<string, unknown>>()
  if (docNumbers.length > 0) {
    // Query in chunks of 500 to avoid URL length limits
    for (let i = 0; i < docNumbers.length; i += 500) {
      const chunk = docNumbers.slice(i, i + 500)
      const { data: existing } = await adminSupabase
        .from('contacts')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .in('document_number', chunk)

      if (existing) {
        for (const c of existing) {
          existingByDoc.set(c.document_number as string, c)
        }
      }
    }
  }

  // 2. Process each contact: merge if duplicate doc, insert if new
  const toInsert: Record<string, unknown>[] = []
  const toInsertIndexes: number[] = [] // track original row index for error reporting

  for (let idx = 0; idx < contactsToInsert.length; idx++) {
    const contact = contactsToInsert[idx]
    const docNum = contact.document_number as string | null

    if (docNum && existingByDoc.has(docNum)) {
      // Merge: existing contact wins, import data fills gaps
      const existing = existingByDoc.get(docNum)!
      const mergeUpdate = buildMergeUpdate(existing, contact)

      if (Object.keys(mergeUpdate).length > 0) {
        const { error: mergeErr } = await adminSupabase
          .from('contacts')
          .update(mergeUpdate)
          .eq('id', existing.id as string)
          .eq('campaign_id', campaignId)

        if (mergeErr) {
          errors.push(`Fila ${idx + 2}: error al fusionar con ${existing.first_name} ${existing.last_name}`)
          continue
        }
      }
      mergedCount++
      continue
    }

    toInsert.push(contact)
    toInsertIndexes.push(idx)
  }

  // 3. Batch insert new contacts
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    const batchIndexes = toInsertIndexes.slice(i, i + BATCH_SIZE)

    const { data: insertedData, error } = await adminSupabase
      .from('contacts')
      .insert(batch)
      .select('id, address, municipality, department')

    if (error) {
      if (error.code === '23505') {
        // Insert one by one to identify which rows conflict
        for (let j = 0; j < batch.length; j++) {
          const row = batch[j]
          const rowIdx = batchIndexes[j]
          const { data: singleInsert, error: singleErr } = await adminSupabase
            .from('contacts')
            .insert([row])
            .select('id, address, municipality, department')

          if (singleErr) {
            skippedCount++
            const rowName = `${row.first_name} ${row.last_name}`
            // Try to find what's blocking
            let reason = 'Dato duplicado'
            let blockingName: string | undefined
            const phone = row.phone as string | null
            const email = row.email as string | null

            if (phone || email) {
              const orParts: string[] = []
              if (phone) orParts.push(`phone.eq.${phone}`)
              if (email) orParts.push(`email.eq.${email}`)
              const { data: blocker } = await adminSupabase
                .from('contacts')
                .select('id, first_name, last_name, phone, email')
                .eq('campaign_id', campaignId)
                .is('deleted_at', null)
                .or(orParts.join(','))
                .limit(1)
                .single()

              if (blocker) {
                blockingName = `${blocker.first_name} ${blocker.last_name}`
                if (phone && blocker.phone === phone) {
                  reason = `Mismo teléfono que ${blockingName}`
                } else if (email && blocker.email === email) {
                  reason = `Mismo correo que ${blockingName}`
                }
              }
            }
            skippedDetails.push({
              row: rowIdx + 2,
              name: rowName,
              reason,
              blockingContact: blockingName,
            })
          } else if (singleInsert?.length) {
            importedCount++
            allInserted.push(...singleInsert)
          } else {
            skippedCount++
          }
        }
      } else {
        errors.push(`Error en lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      }
    } else {
      importedCount += insertedData?.length ?? 0
      if (insertedData) allInserted.push(...insertedData)
    }
  }

  // Fire-and-forget: geocode contacts that have an address
  const toGeocode = allInserted.filter(c => c.address)
  if (toGeocode.length) {
    geocodeBatch(toGeocode, adminSupabase).catch(console.error)
  }

  return NextResponse.json({
    imported: importedCount,
    merged: mergedCount,
    skipped: skippedCount,
    skippedDetails: skippedDetails.slice(0, 50),
    errors: errors.slice(0, 20),
  })
}

// ── Background geocoding ──────────────────────────────────────────────────────

async function geocodeBatch(
  contacts: { id: string; address?: string; municipality?: string; department?: string }[],
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
) {
  for (const contact of contacts) {
    try {
      const result = await geocodeAddress(
        contact.address!,
        contact.municipality,
        contact.department,
      )
      if (result) {
        await supabase.from('contacts').update({
          location_lat: result.lat,
          location_lng: result.lng,
          geocoding_status: 'geocoded',
          geocoding_type: 'import',
          geocoding_precision: result.locationType,
        }).eq('id', contact.id)
        await supabase.rpc('update_contact_geo', {
          p_contact_id: contact.id,
          p_lat: result.lat,
          p_lng: result.lng,
        })
      } else {
        await supabase.from('contacts').update({
          geocoding_status: 'failed',
        }).eq('id', contact.id)
      }
    } catch {
      await supabase.from('contacts').update({
        geocoding_status: 'failed',
      }).eq('id', contact.id).then(() => {})
    }
    // Rate limit: 100ms between Google Maps API calls
    await new Promise(r => setTimeout(r, 100))
  }
}
