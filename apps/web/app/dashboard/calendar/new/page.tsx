import { ArrowLeft, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { EventForm } from '@/components/dashboard/calendar/EventForm'

export const metadata = { title: 'Nuevo evento · CivicOS' }

export default async function NewCalendarEventPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo evento</h1>
            <p className="text-sm text-slate-500">Añade un evento a tu calendario electoral</p>
          </div>
        </div>
      </div>

      <EventForm defaultDate={date} />
    </div>
  )
}
