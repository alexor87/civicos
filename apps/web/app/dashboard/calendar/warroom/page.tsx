import { ArrowLeft, Swords } from 'lucide-react'
import Link from 'next/link'
import { WarRoom } from '@/components/dashboard/calendar/WarRoom'

export const metadata = { title: 'Sala de Guerra · Scrutix' }

export default function WarRoomPage() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
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
            <Swords className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sala de Guerra</h1>
            <p className="text-sm text-slate-500">Panel operativo de campaña — próximos 7 días y estado en tiempo real</p>
          </div>
        </div>
      </div>

      <WarRoom />
    </div>
  )
}
