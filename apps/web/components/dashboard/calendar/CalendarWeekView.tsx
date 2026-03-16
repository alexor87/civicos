'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'

const HOUR_HEIGHT = 60   // px per hour
const START_HOUR  = 7    // 7:00
const END_HOUR    = 22   // 22:00
const TOTAL_HOURS = END_HOUR - START_HOUR

const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getMonday(d: Date) {
  const date = new Date(d)
  const day  = (date.getDay() + 6) % 7  // Mon=0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatDayHeader(d: Date) {
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function eventTop(isoStart: string): number {
  const d    = new Date(isoStart)
  const h    = d.getHours() + d.getMinutes() / 60
  const from = Math.max(h - START_HOUR, 0)
  return from * HOUR_HEIGHT
}

function eventHeight(isoStart: string, isoEnd: string): number {
  const startMs  = new Date(isoStart).getTime()
  const endMs    = new Date(isoEnd).getTime()
  const minutes  = Math.max((endMs - startMs) / 60000, 30)
  return (minutes / 60) * HOUR_HEIGHT
}

interface Props {
  events: CalendarEvent[]
  activeDate: Date
  onWeekChange: (d: Date) => void
  onSelectEvent: (e: CalendarEvent) => void
}

export function CalendarWeekView({ events, activeDate, onWeekChange, onSelectEvent }: Props) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const monday     = getMonday(activeDate)
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const today      = new Date()

  // Scroll to current time on mount
  useEffect(() => {
    const now  = new Date()
    const topPx = Math.max((now.getHours() + now.getMinutes() / 60 - START_HOUR - 1) * HOUR_HEIGHT, 0)
    scrollRef.current?.scrollTo({ top: topPx, behavior: 'smooth' })
  }, [])

  function eventsForDay(day: Date) {
    const dateStr = day.toISOString().slice(0, 10)
    return events.filter(e => e.start_at.slice(0, 10) === dateStr && !e.all_day)
  }

  function currentTimeTop() {
    const now = new Date()
    return (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
  }

  const isCurrentWeek = getMonday(today).toISOString().slice(0, 10) === monday.toISOString().slice(0, 10)

  return (
    <div className="flex flex-col h-full">
      {/* Week header + nav */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Semana del {formatDayHeader(monday)} al {formatDayHeader(addDays(monday, 6))}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onWeekChange(addDays(monday, -7))}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onWeekChange(new Date())}
            className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Esta semana
          </button>
          <button
            onClick={() => onWeekChange(addDays(monday, 7))}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day column headers */}
      <div className="grid flex-shrink-0" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
        <div /> {/* empty corner */}
        {weekDays.map((day, i) => {
          const isToday = day.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
          return (
            <div key={i} className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">{DAYS_ES[i]}</p>
              <span className={`text-sm font-bold inline-flex h-7 w-7 items-center justify-center rounded-full mx-auto ${
                isToday ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Time grid — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', display: 'grid' }}>

          {/* Hour labels */}
          <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
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

          {/* Day columns */}
          {weekDays.map((day, colIdx) => {
            const dayEvents = eventsForDay(day)
            const isToday   = day.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
            return (
              <div
                key={colIdx}
                className={`relative border-l border-slate-200 dark:border-slate-700 ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                data-testid={`week-column-${colIdx}`}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-slate-100 dark:border-slate-800"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time indicator */}
                {isCurrentWeek && isToday && (
                  <div
                    className="absolute w-full flex items-center z-10 pointer-events-none"
                    style={{ top: currentTimeTop() }}
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(e => {
                  const cfg    = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
                  const top    = eventTop(e.start_at)
                  const height = Math.max(eventHeight(e.start_at, e.end_at), 24)
                  return (
                    <button
                      key={e.id}
                      onClick={() => onSelectEvent(e)}
                      className="absolute left-0.5 right-0.5 rounded text-left px-1.5 py-0.5 text-[10px] font-medium leading-tight overflow-hidden z-20 hover:brightness-95 transition-all"
                      style={{
                        top,
                        height,
                        backgroundColor: cfg.color + '25',
                        borderLeft: `3px solid ${cfg.color}`,
                        color: cfg.color,
                      }}
                      data-testid="week-event"
                    >
                      <span className="block truncate">{e.title}</span>
                      {height > 36 && (
                        <span className="block text-slate-500" style={{ fontSize: 9 }}>
                          {new Date(e.start_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
