import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ── Valid DB columns for contacts (excludes auto-generated fields) ───────────

const VALID_CONTACT_FIELDS = new Set([
  'first_name', 'last_name', 'email', 'phone',
  'document_type', 'document_number', 'birth_date', 'gender',
  'address', 'city', 'district', 'department', 'municipality', 'commune',
  'voting_place', 'voting_table',
  'status', 'campaign_role', 'electoral_priority', 'capture_source', 'notes',
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
  ciudad: 'city', city: 'city',
  comuna: 'commune', origen: 'commune', commune: 'commune',
  referido: 'notes', 'nombre de lider/referido': 'notes',
  estado: 'status', status: 'status',
  notes: 'notes',
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
  const dmy = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
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

  // If rows come from the column mapper UI, they're already mapped to DB field names.
  // Otherwise, apply header alias normalization as fallback.
  const normalizedRows: NormalizedRow[] = preMapped
    ? rawRows.map(row => {
        const nr: NormalizedRow = {}
        for (const [k, v] of Object.entries(row)) {
          nr[k] = typeof v === 'number' ? String(v) : (v as string)
        }
        return nr
      })
    : normalizeHeaders(rawRows)

  const adminSupabase = await createAdminClient()

  const VALID_STATUSES = ['supporter', 'undecided', 'opponent', 'unknown']
  const imported: number[] = []
  const skipped: string[] = []
  const errors: string[] = []
  const BATCH_SIZE = 500

  // Fetch existing emails, phones and document numbers for deduplication
  const { data: existingContacts } = await adminSupabase
    .from('contacts')
    .select('email, phone, document_number')
    .eq('campaign_id', campaignId)

  const existingEmails = new Set(existingContacts?.map(c => c.email?.toLowerCase()).filter(Boolean))
  const existingPhones = new Set(existingContacts?.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean))
  const existingDocs = new Set(existingContacts?.map(c => c.document_number?.trim()).filter(Boolean))

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

    // Deduplication
    if (email && existingEmails.has(email)) {
      skipped.push(`Fila ${i + 2}: Email duplicado (${email})`)
      continue
    }
    if (phone && existingPhones.has(phone)) {
      skipped.push(`Fila ${i + 2}: Teléfono duplicado (${phone})`)
      continue
    }
    if (documentNumber && existingDocs.has(documentNumber)) {
      skipped.push(`Fila ${i + 2}: Documento duplicado (${documentNumber})`)
      continue
    }

    const status = VALID_STATUSES.includes(row.status ?? '') ? row.status! : 'unknown'

    // Build contact object with only valid DB columns
    const contact: Record<string, unknown> = {
      tenant_id: profile.tenant_id,
      campaign_id: campaignId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      status: status as 'supporter' | 'undecided' | 'opponent' | 'unknown',
      document_number: documentNumber,
    }

    // Add optional fields that exist in DB
    for (const field of VALID_CONTACT_FIELDS) {
      if (contact[field] !== undefined) continue // already set above
      const val = row[field]?.trim()
      if (!val) continue
      if (field === 'birth_date') {
        contact[field] = parseDateOrNull(val)
      } else {
        contact[field] = val
      }
    }

    contactsToInsert.push(contact)
    if (email) existingEmails.add(email)
    if (phone) existingPhones.add(phone)
    if (documentNumber) existingDocs.add(documentNumber)
  }

  // Batch insert
  for (let i = 0; i < contactsToInsert.length; i += BATCH_SIZE) {
    const batch = contactsToInsert.slice(i, i + BATCH_SIZE)
    const { error } = await adminSupabase.from('contacts').insert(batch)
    if (error) {
      errors.push(`Error en lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
    } else {
      imported.push(...batch.map((_, idx) => i + idx))
    }
  }

  return NextResponse.json({
    imported: imported.length,
    skipped: skipped.length,
    errors: errors.slice(0, 20),
  })
}
