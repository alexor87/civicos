import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ContactFormFields } from '@/components/dashboard/ContactFormFields'
import Link from 'next/link'

async function updateContact(id: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()
  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) redirect('/dashboard/contacts')

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const docType   = (formData.get('document_type') as string)?.trim()
  const docNumber = (formData.get('document_number') as string)?.trim()
  const rawPhone  = (formData.get('phone') as string)?.trim()

  if (!firstName || !lastName || !docType || !docNumber || !rawPhone) {
    redirect(`/dashboard/contacts/${id}/edit?error=required`)
  }

  const phone = rawPhone.replace(/\D/g, '')
  const rawEmail = (formData.get('email') as string)?.trim()
  const email = rawEmail ? rawEmail.toLowerCase() : null

  // Dedup: same doc number but different contact
  const { data: existingByDoc } = await supabase
    .from('contacts').select('id')
    .eq('campaign_id', campaignId!).eq('document_number', docNumber)
    .neq('id', id).limit(1).single()
  if (existingByDoc?.id) {
    redirect(`/dashboard/contacts/${id}/edit?error=duplicate&dup=${existingByDoc.id}`)
  }

  const rawTags = (formData.get('tags') as string)?.trim()
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  const metadata: Record<string, unknown> = {}
  const metaFields = [
    'phone_alternate','marital_status','postal_code','political_affinity',
    'vote_intention','preferred_party','electoral_priority','campaign_role',
    'contact_source','source_detail','territorial_manager','referred_by',
    'mobilizes_count','main_need','economic_sector','beneficiary_program',
  ]
  for (const field of metaFields) {
    const val = (formData.get(field) as string)?.trim()
    if (val) metadata[field] = val
  }

  await supabase.from('contacts').update({
    first_name: firstName, last_name: lastName,
    document_type: docType, document_number: docNumber,
    phone, email,
    birth_date: (formData.get('birth_date') as string) || null,
    gender: (formData.get('gender') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    municipality: (formData.get('city') as string)?.trim() || null,
    commune: (formData.get('commune') as string)?.trim() || null,
    city: (formData.get('city') as string)?.trim() || null,
    district: (formData.get('commune') as string)?.trim() || null,
    voting_place: (formData.get('voting_place') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'unknown',
    notes: (formData.get('notes') as string)?.trim() || null,
    tags, metadata,
  }).eq('id', id)

  redirect(`/dashboard/contacts/${id}`)
}

export default async function EditContactPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; dup?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts').select('*').eq('id', id).single()
  if (!contact) notFound()

  // Load electoral zones
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

  const c = contact as Record<string, unknown>
  const boundUpdate = updateContact.bind(null, id)

  // Format last edit timestamp
  const lastEdit = new Date(contact.updated_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <form action={boundUpdate}>
        {/* ── Page header ── */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <Link href="/dashboard/contacts" className="hover:text-slate-600 transition-colors">
                Contactos
              </Link>
              <span>/</span>
              <Link href={`/dashboard/contacts/${id}`} className="hover:text-slate-600 transition-colors">
                {contact.first_name} {contact.last_name}
              </Link>
              <span>/</span>
              <span>Editar</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Ficha del Ciudadano</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Edita los datos del contacto en la red territorial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/contacts/${id}`}>
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

        {/* ── Error banners ── */}
        {(sp.error === 'required' || sp.error === 'duplicate') && (
          <div>
            {sp.error === 'required' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                Los campos <strong>Nombre, Apellido, Tipo de documento, Número y Teléfono</strong> son obligatorios.
              </div>
            )}
            {sp.error === 'duplicate' && sp.dup && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Ya existe otro contacto con ese número de documento.{' '}
                <Link href={`/dashboard/contacts/${sp.dup}`} className="font-semibold underline underline-offset-2">
                  Ver contacto →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Form sections ── */}
        <ContactFormFields
            zones={zones}
            initialData={{
              first_name: contact.first_name,
              last_name: contact.last_name,
              document_type: c.document_type as string ?? '',
              document_number: c.document_number as string ?? '',
              phone: contact.phone ?? '',
              email: contact.email ?? '',
              birth_date: c.birth_date as string ?? '',
              gender: c.gender as string ?? '',
              address: contact.address ?? '',
              city: contact.city ?? (c.municipality as string) ?? '',
              district: contact.district ?? (c.commune as string) ?? '',
              voting_place: c.voting_place as string ?? '',
              status: contact.status,
              tags: contact.tags ?? [],
              notes: contact.notes ?? '',
            }}
          />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Última edición: {lastEdit}
          </p>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/contacts/${id}`}>
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
