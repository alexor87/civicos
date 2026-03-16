import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface CSVRow {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  district?: string
  status?: string
  [key: string]: string | undefined
}

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

  const { rows }: { rows: CSVRow[] } = await request.json()
  if (!rows?.length) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const adminSupabase = await createAdminClient()

  const VALID_STATUSES = ['supporter', 'undecided', 'opponent', 'unknown']
  const imported: number[] = []
  const skipped: string[] = []
  const errors: string[] = []
  const BATCH_SIZE = 500

  // Fetch existing emails and phones for deduplication
  const { data: existingContacts } = await adminSupabase
    .from('contacts')
    .select('email, phone')
    .eq('campaign_id', campaignId)

  const existingEmails = new Set(existingContacts?.map(c => c.email?.toLowerCase()).filter(Boolean))
  const existingPhones = new Set(existingContacts?.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean))

  const contactsToInsert = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const firstName = row.first_name?.trim()
    const lastName = row.last_name?.trim()

    if (!firstName || !lastName) {
      errors.push(`Fila ${i + 2}: first_name y last_name son requeridos`)
      continue
    }

    const email = row.email?.trim().toLowerCase() || null
    const phone = row.phone?.replace(/\D/g, '') || null

    // Deduplication
    if (email && existingEmails.has(email)) {
      skipped.push(`Fila ${i + 2}: Email duplicado (${email})`)
      continue
    }
    if (phone && existingPhones.has(phone)) {
      skipped.push(`Fila ${i + 2}: Teléfono duplicado (${phone})`)
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
      district: row.district?.trim() || null,
      status: status as 'supporter' | 'undecided' | 'opponent' | 'unknown',
    })

    if (email) existingEmails.add(email)
    if (phone) existingPhones.add(phone)
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
