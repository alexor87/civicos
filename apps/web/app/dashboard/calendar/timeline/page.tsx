import { ArrowLeft, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { ElectoralTimeline } from '@/components/dashboard/calendar/ElectoralTimeline'

export const metadata = { title: 'Línea de Tiempo Electoral · Scrutix' }

export default function TimelinePage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
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
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Línea de Tiempo Electoral</h1>
            <p className="text-sm text-slate-500">Vista macro de todos los eventos de la campaña — últimos 30 y próximos 90 días</p>
          </div>
        </div>
      </div>

      <ElectoralTimeline />
    </div>
  )
}
