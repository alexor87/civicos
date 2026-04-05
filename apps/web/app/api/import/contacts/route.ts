import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ── Header alias map ─────────────────────────────────────────────────────────
// Maps common Spanish (and English) column headers to internal field names.
// Lookup is case-insensitive after trim + toLowerCase.

const HEADER_ALIASES: Record<string, string> = {
  // Required
  nombre: 'first_name',
  apellido: 'last_name',
  apellidos: 'last_name',
  first_name: 'first_name',
  last_name: 'last_name',
  // Contact
  telefono: 'phone',
  'teléfono': 'phone',
  'telefono no': 'phone',
  phone: 'phone',
  celular: 'phone',
  correo: 'email',
  'correo electronico': 'email',
  'correo electrónico': 'email',
  email: 'email',
  // Document
  'nro cc': 'document_number',
  cedula: 'document_number',
  'cédula': 'document_number',
  documento: 'document_number',
  'numero de documento': 'document_number',
  'número de documento': 'document_number',
  document_number: 'document_number',
  // Voting
  'puesto de votacion': 'voting_place',
  'puesto de votación': 'voting_place',
  voting_place: 'voting_place',
  mesa: 'voting_table',
  'mesa de': 'voting_table',
  voting_table: 'voting_table',
  // Demographics
  'fecha de nacimiento': 'birth_date',
  birth_date: 'birth_date',
  // Location
  direccion: 'address',
  'dirección': 'address',
  address: 'address',
  barrio: 'district_barrio',
  'barrio/vereda': 'district_barrio',
  vereda: 'district_barrio',
  district: 'district_barrio',
  district_barrio: 'district_barrio',
  ciudad: 'city',
  city: 'city',
  comuna: 'commune',
  origen: 'commune',
  commune: 'commune',
  // Referral
  referido: 'referred_by',
  'nombre de lider/referido': 'referred_by',
  lider: 'referred_by',
  'líder': 'referred_by',
  referred_by: 'referred_by',
  // Status
  estado: 'status',
  status: 'status',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type NormalizedRow = Record<string, string | undefined>

function normalizeHeaders(rows: Record<string, unknown>[]): NormalizedRow[] {
  return rows.map(row => {
    const normalized: NormalizedRow = {}
    for (const [key, value] of Object.entries(row)) {
      const mapped = HEADER_ALIASES[key.trim().toLowerCase()]
      if (mapped) {
        normalized[mapped] = typeof value === 'number' ? String(value) : (value as string)
      }
    }
    return normalized
  })
}

function parseDateOrNull(val?: string): string | null {
  if (!val?.trim()) return null
  const trimmed = val.trim()
  // DD/MM/YYYY → YYYY-MM-DD
  const dmy = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  // YYYY-MM-DD (ISO) pass through
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

  const { rows }: { rows: Record<string, unknown>[] } = await request.json()
  if (!rows?.length) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const normalizedRows = normalizeHeaders(rows)

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

    contactsToInsert.push({
      tenant_id: profile.tenant_id,
      campaign_id: campaignId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address: row.address?.trim() || null,
      city: row.city?.trim() || null,
      district: row.district_barrio?.trim() || null,
      status: status as 'supporter' | 'undecided' | 'opponent' | 'unknown',
      // Colombian fields
      document_number: documentNumber,
      voting_place: row.voting_place?.trim() || null,
      voting_table: row.voting_table?.trim() || null,
      birth_date: parseDateOrNull(row.birth_date),
      commune: row.commune?.trim() || null,
      district_barrio: row.district_barrio?.trim() || null,
      referred_by: row.referred_by?.trim() || null,
    })

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
