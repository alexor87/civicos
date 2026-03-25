import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ContactFormFields } from '@/components/dashboard/ContactFormFields'
import Link from 'next/link'

async function createContact(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) redirect('/dashboard/contacts')

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const docType   = (formData.get('document_type') as string)?.trim()
  const docNumber = (formData.get('document_number') as string)?.trim()
  const rawPhone  = (formData.get('phone') as string)?.trim()

  if (!firstName || !lastName || !docType || !docNumber || !rawPhone) {
    redirect('/dashboard/contacts/new?error=required')
  }

  const phone = rawPhone.replace(/\D/g, '')
  const rawEmail = (formData.get('email') as string)?.trim()
  const email = rawEmail ? rawEmail.toLowerCase() : null

  // Deduplication: document number is the primary key
  const { data: existingByDoc } = await supabase
    .from('contacts')
    .select('id')
    .eq('campaign_id', campaignId!)
    .eq('document_number', docNumber)
    .limit(1)
    .single()

  if (existingByDoc?.id) {
    redirect(`/dashboard/contacts/new?error=duplicate&id=${existingByDoc.id}`)
  }

  // Secondary dedup: email or phone
  if (email || phone) {
    const orConditions: string[] = []
    if (email) orConditions.push(`email.eq.${email}`)
    if (phone) orConditions.push(`phone.eq.${phone}`)

    const { data: existingByContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId!)
      .or(orConditions.join(','))
      .limit(1)
      .single()

    if (existingByContact?.id) {
      redirect(`/dashboard/contacts/new?error=duplicate&id=${existingByContact.id}`)
    }
  }

  // Tags
  const rawTags = (formData.get('tags') as string)?.trim()
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  // Metadata: secondary fields
  const metadata: Record<string, unknown> = {}
  const metaFields: [string, string][] = [
    ['phone_alternate', 'phone_alternate'],
    ['marital_status', 'marital_status'],
    ['postal_code', 'postal_code'],
    ['political_affinity', 'political_affinity'],
    ['vote_intention', 'vote_intention'],
    ['preferred_party', 'preferred_party'],
    ['electoral_priority', 'electoral_priority'],
    ['campaign_role', 'campaign_role'],
    ['contact_source', 'contact_source'],
    ['source_detail', 'source_detail'],
    ['territorial_manager', 'territorial_manager'],
    ['referred_by', 'referred_by'],
    ['mobilizes_count', 'mobilizes_count'],
    ['main_need', 'main_need'],
    ['economic_sector', 'economic_sector'],
    ['beneficiary_program', 'beneficiary_program'],
  ]
  for (const [fieldName, metaKey] of metaFields) {
    const val = (formData.get(fieldName) as string)?.trim()
    if (val) metadata[metaKey] = val
  }

  await supabase.from('contacts').insert({
    tenant_id: profile!.tenant_id,
    campaign_id: campaignId,
    first_name: firstName,
    last_name: lastName,
    document_type: docType,
    document_number: docNumber,
    phone,
    email,
    birth_date: (formData.get('birth_date') as string) || null,
    gender: (formData.get('gender') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    department: (formData.get('department') as string)?.trim() || null,
    municipality: (formData.get('city') as string)?.trim() || null,
    commune: (formData.get('commune') as string)?.trim() || null,
    city: (formData.get('city') as string)?.trim() || null,
    district: (formData.get('commune') as string)?.trim() || null,
    voting_place: (formData.get('voting_place') as string)?.trim() || null,
    voting_table: null,
    status: (formData.get('status') as string) || 'unknown',
    notes: (formData.get('notes') as string)?.trim() || null,
    tags,
    metadata,
  })

  redirect('/dashboard/contacts')
}

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; id?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const duplicateId = params.id

  // Load electoral zones for the campaign
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let zones: string[] = []
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('campaign_ids').eq('id', user.id).single()
    const campaignId = profile?.campaign_ids?.[0]
    if (campaignId) {
      const { data: geoUnits } = await supabase
        .from('geo_units')
        .select('name')
        .eq('campaign_id', campaignId)
        .in('type', ['zona', 'municipio', 'commune'])
        .order('name')
      zones = (geoUnits ?? []).map(u => u.name as string)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <form action={createContact}>
        {/* ── Page header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                <Link href="/dashboard/contacts" className="hover:text-slate-600 transition-colors">
                  Contactos
                </Link>
                <span>/</span>
                <span>Nuevo</span>
              </div>
              <h1 className="text-lg font-semibold text-slate-900">Ficha del Ciudadano</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete los datos para integrar al contacto en la red territorial.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/contacts">
                <Button type="button" variant="outline" size="sm">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Guardar Contacto
              </Button>
            </div>
          </div>
        </div>

        {/* ── Error banners ── */}
        {(error === 'required' || error === 'duplicate') && (
          <div className="max-w-3xl mx-auto px-6 pt-5">
            {error === 'required' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                Los campos <strong>Nombre, Apellido, Tipo de documento, Número y Teléfono</strong> son obligatorios.
              </div>
            )}
            {error === 'duplicate' && duplicateId && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Ya existe un contacto con ese documento, correo o teléfono.{' '}
                <Link href={`/dashboard/contacts/${duplicateId}`} className="font-semibold underline underline-offset-2">
                  Ver contacto existente →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Form sections ── */}
        <div className="max-w-3xl mx-auto px-6 py-6">
          <ContactFormFields zones={zones} />
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-end gap-2">
            <Link href="/dashboard/contacts">
              <Button type="button" variant="outline" size="sm">
                Ver Cambios
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Guardar y Salir
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
