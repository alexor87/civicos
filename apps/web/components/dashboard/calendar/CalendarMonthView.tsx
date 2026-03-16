'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface Props {
  events: CalendarEvent[]
  activeDate: Date
  onMonthChange: (d: Date) => void
  onSelectEvent: (e: CalendarEvent) => void
}

function getCalendarGrid(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  // Monday-first: Sun=0 → 6, Mon=1 → 0, Tue=2 → 1 ...
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function CalendarMonthView({ events, activeDate, onMonthChange, onSelectEvent }: Props) {
  const router = useRouter()
  const year  = activeDate.getFullYear()
  const month = activeDate.getMonth()
  const cells = getCalendarGrid(year, month)

  const today = new Date()
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  const eventsForDay = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return events.filter(e => e.start_at.slice(0, 10) === dateStr)
  }

  function prevMonth() {
    onMonthChange(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    onMonthChange(new Date(year, month + 1, 1))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Month header + nav */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {MONTHS_ES[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-slate-200 dark:border-slate-700">
        {cells.map((day, idx) => {
          const dayEvents = day ? eventsForDay(day) : []
          const visible   = dayEvents.slice(0, 3)
          const overflow  = dayEvents.length - 3

          return (
            <div
              key={idx}
              onClick={() => {
                if (!day) return
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                router.push(`/dashboard/calendar/new?date=${dateStr}`)
              }}
              className={`border-b border-r border-slate-200 dark:border-slate-700 min-h-[110px] p-1.5 ${
                day ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-800/20'
              } transition-colors`}
            >
              {day && (
                <>
                  <span
                    className={`text-xs font-medium mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      isToday(day)
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>

                  <div className="space-y-0.5">
                    {visible.map(e => {
                      const cfg = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
                      return (
                        <button
                          key={e.id}
                          onClick={ev => { ev.stopPropagation(); onSelectEvent(e) }}
                          style={{ backgroundColor: cfg.color + '20', borderLeftColor: cfg.color }}
                          className="w-full text-left text-[10px] font-medium truncate px-1.5 py-0.5 rounded border-l-2 leading-tight"
                          data-testid="event-chip"
                        >
                          <span style={{ color: cfg.color }}>{e.title}</span>
                        </button>
                      )
                    })}
                    {overflow > 0 && (
                      <button
                        onClick={ev => { ev.stopPropagation(); onSelectEvent(dayEvents[3]) }}
                        className="w-full text-left text-[10px] text-slate-500 px-1 hover:text-primary transition-colors"
                      >
                        +{overflow} más
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
