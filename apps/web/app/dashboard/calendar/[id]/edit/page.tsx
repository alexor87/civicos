import { ArrowLeft, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '@/components/dashboard/calendar/EventForm'

export const metadata = { title: 'Editar evento · CivicOS' }

export default async function EditCalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) redirect('/dashboard/calendar')

  // Fetch linked contacts for this event
  const { data: participants } = await supabase
    .from('event_participants')
    .select('contact_id, contacts(id, first_name, last_name)')
    .eq('event_id', id)
    .not('contact_id', 'is', null)

  const linkedContacts = (participants ?? [])
    .filter((p: any) => p.contacts)
    .map((p: any) => ({
      id: p.contacts.id,
      first_name: p.contacts.first_name,
      last_name: p.contacts.last_name,
    }))

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al calendario
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Editar evento</h1>
            <p className="text-sm text-slate-500">Modifica los detalles del evento</p>
          </div>
        </div>
      </div>

      <EventForm eventId={event.id} initialEvent={event} campaignId={event.campaign_id} initialContacts={linkedContacts} />
    </div>
  )
}
