import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ContactFormWizard } from '@/components/contacts/ContactFormWizard'
import type { ContactForm, ContactLevel } from '@/lib/schemas/contact-form'

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId
  if (!campaignId) redirect('/dashboard/contacts')

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!contact) notFound()

  const meta = (contact.metadata as Record<string, unknown>) ?? {}
  const contactLevel = ((contact as Record<string, unknown>).contact_level as ContactLevel) ?? 'completo'

  // Map DB row → ContactForm shape
  const initialData: Partial<ContactForm> = {
    first_name: contact.first_name ?? '',
    last_name: contact.last_name ?? '',
    document_type: ((contact as Record<string, unknown>).document_type as ContactForm['document_type']) ?? 'CC',
    document_number: (contact as Record<string, unknown>).document_number as string ?? '',
    phone: contact.phone ?? '',
    email: contact.email ?? '',
    status: (contact.status as ContactForm['status']) ?? 'unknown',
    // Location
    department: (contact as Record<string, unknown>).department as string ?? '',
    municipality: (contact as Record<string, unknown>).municipality as string ?? contact.city ?? '',
    commune: (contact as Record<string, unknown>).commune as string ?? '',
    district_barrio: contact.district ?? '',
    address: contact.address ?? '',
    voting_place: (contact as Record<string, unknown>).voting_place as string ?? '',
    voting_table: (contact as Record<string, unknown>).voting_table as string ?? '',
    // Demographics
    birth_date: (contact as Record<string, unknown>).birth_date as string ?? '',
    gender: (meta.gender ?? (contact as Record<string, unknown>).gender) as ContactForm['gender'],
    marital_status: meta.marital_status as ContactForm['marital_status'],
    // Political
    political_affinity: meta.political_affinity ? Number(meta.political_affinity) : undefined,
    political_orientation: meta.political_orientation as ContactForm['political_orientation'],
    vote_intention: meta.vote_intention as ContactForm['vote_intention'],
    electoral_priority: meta.electoral_priority as ContactForm['electoral_priority'],
    campaign_role: meta.campaign_role as ContactForm['campaign_role'],
    // Source
    contact_source: meta.contact_source as ContactForm['contact_source'],
    source_detail: (meta.source_detail as string) ?? '',
    referred_by: (meta.referred_by as string) ?? '',
    mobilizes_count: meta.mobilizes_count ? Number(meta.mobilizes_count) : undefined,
    main_need: (meta.main_need as string) ?? '',
    economic_sector: (meta.economic_sector as string) ?? '',
    beneficiary_program: (meta.beneficiary_program as string) ?? '',
    // Tags & Notes
    tags: (contact.tags ?? []).join(', '),
    notes: contact.notes ?? '',
    phone_alternate: (meta.phone_alternate as string) ?? '',
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <Link href={`/dashboard/contacts/${id}`}>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al perfil
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Editar Contacto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {((contact as Record<string, unknown>).display_name as string) ?? (`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'Contacto anónimo')}
          </p>
        </div>
      </div>

      <ContactFormWizard
        campaignId={campaignId}
        initialData={initialData}
        contactId={id}
        initialLevel={contactLevel}
      />
    </div>
  )
}
