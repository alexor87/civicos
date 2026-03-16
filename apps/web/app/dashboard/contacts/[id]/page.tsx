import { createClient } from '@/lib/supabase/server'
import { ContactProfile } from '@/components/dashboard/ContactProfile'
import { PromoteToMemberButton } from '@/components/dashboard/contacts/PromoteToMemberButton'
import { GDPRActions } from '@/components/dashboard/contacts/GDPRActions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) notFound()

  // Fetch contact (RLS enforces tenant isolation)
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('campaign_id', campaignId!)
    .single()

  if (contactError && contactError.code !== 'PGRST116') {
    throw new Error('Error fetching contact')
  }

  if (!contact) notFound()

  // Fetch canvass visits with volunteer name
  const { data: rawVisits } = await supabase
    .from('canvass_visits')
    .select('*, profiles!volunteer_id(full_name)')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  const visits = (rawVisits ?? []).map(v => ({
    ...v,
    volunteerName: (v.profiles as { full_name: string } | null)?.full_name ?? 'Voluntario',
  }))

  return (
    <div>
      <div className="px-6 pt-6 flex items-center justify-between">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Contactos
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {contact.email && ['super_admin', 'campaign_manager'].includes(profile?.role ?? '') && (
            <PromoteToMemberButton
              contactId={contact.id}
              contactName={`${contact.first_name} ${contact.last_name}`}
            />
          )}
          <Link href={`/dashboard/contacts/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </Link>
        </div>
      </div>
      <ContactProfile contact={contact} visits={visits} />

      {/* GDPR actions — only for managers/admins */}
      {['super_admin', 'campaign_manager'].includes(profile?.role ?? '') && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 mt-4">
          <p className="text-xs text-[#6a737d] mb-2">Privacidad de datos (Ley 1581)</p>
          <GDPRActions
            contactId={id}
            isAnonymized={!!(contact.metadata as Record<string, unknown> | null)?.gdpr_anonymized_at}
          />
        </div>
      )}
    </div>
  )
}
