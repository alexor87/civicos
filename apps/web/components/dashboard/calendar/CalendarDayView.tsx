'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'

const HOUR_HEIGHT = 64
const START_HOUR  = 7
const END_HOUR    = 22
const TOTAL_HOURS = END_HOUR - START_HOUR

const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function eventTop(isoStart: string): number {
  const d    = new Date(isoStart)
  const h    = d.getHours() + d.getMinutes() / 60
  return Math.max(h - START_HOUR, 0) * HOUR_HEIGHT
}

function eventHeight(isoStart: string, isoEnd: string): number {
  const minutes = Math.max((new Date(isoEnd).getTime() - new Date(isoStart).getTime()) / 60000, 30)
  return (minutes / 60) * HOUR_HEIGHT
}

interface Props {
  events: CalendarEvent[]
  activeDate: Date
  onDayChange: (d: Date) => void
  onSelectEvent: (e: CalendarEvent) => void
}

export function CalendarDayView({ events, activeDate, onDayChange, onSelectEvent }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today     = new Date()
  const isToday   = activeDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)

  useEffect(() => {
    const now  = new Date()
    const topPx = Math.max((now.getHours() + now.getMinutes() / 60 - START_HOUR - 1) * HOUR_HEIGHT, 0)
    scrollRef.current?.scrollTo({ top: topPx, behavior: 'smooth' })
  }, [])

  const dateStr  = activeDate.toISOString().slice(0, 10)
  const dayEvents = events.filter(e => e.start_at.slice(0, 10) === dateStr && !e.all_day)
  const allDayEvents = events.filter(e => e.start_at.slice(0, 10) === dateStr && e.all_day)

  const dayLabel = activeDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  function currentTimeTop() {
    const now = new Date()
    return (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day header + nav */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
          {dayLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDayChange(addDays(activeDate, -1))}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDayChange(new Date())}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => onDayChange(addDays(activeDate, 1))}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 px-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex-shrink-0">
          {allDayEvents.map(e => {
            const cfg = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
            return (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e)}
                className="text-xs font-medium px-2 py-1 rounded-md"
                style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
              >
                {e.title}
              </button>
            )
          })}
        </div>
      )}

      {/* Time grid — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto border-t border-slate-200 dark:border-slate-700">
        <div className="relative flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>

          {/* Hour labels */}
          <div className="w-14 flex-shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-slate-400 tabular-nums"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 7 }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Events column */}
          <div
            className={`flex-1 relative border-l border-slate-200 dark:border-slate-700 ${isToday ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
            data-testid="day-column"
          >
            {/* Hour lines */}
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full border-t border-slate-100 dark:border-slate-800"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              />
            ))}

            {/* Current time indicator */}
            {isToday && (
              <div
                className="absolute w-full flex items-center z-10 pointer-events-none"
                style={{ top: currentTimeTop() }}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}

            {/* Events */}
            {dayEvents.map(e => {
              const cfg    = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
              const top    = eventTop(e.start_at)
              const height = Math.max(eventHeight(e.start_at, e.end_at), 32)
              const startTime = new Date(e.start_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              const endTime   = new Date(e.end_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent(e)}
                  className="absolute left-1 right-2 rounded-lg text-left px-2.5 py-1.5 overflow-hidden z-20 hover:brightness-95 transition-all"
                  style={{
                    top,
                    height,
                    backgroundColor: cfg.color + '20',
                    borderLeft: `4px solid ${cfg.color}`,
                  }}
                  data-testid="day-event"
                >
                  <p className="text-sm font-semibold truncate" style={{ color: cfg.color }}>{e.title}</p>
                  {height > 44 && (
                    <p className="text-xs text-slate-500 mt-0.5">{startTime} — {endTime}</p>
                  )}
                  {height > 60 && e.location_text && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{e.location_text}</p>
                  )}
                </button>
              )
            })}

            {/* Empty state */}
            {dayEvents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm pointer-events-none">
                Sin eventos este día
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
