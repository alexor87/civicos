import { CalendarShell } from '@/components/dashboard/calendar/CalendarShell'

export const metadata = { title: 'Calendario · CivicOS' }

export default function CalendarPage() {
  const now   = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Calendario Electoral</h2>
        <p className="text-sm text-slate-500 mt-0.5">Planifica y coordina todos los eventos de tu campaña</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CalendarShell initialMonth={month} />
      </div>
    </div>
  )
}
