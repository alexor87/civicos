'use client'

import { MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'

interface Props {
  events: CalendarEvent[]
  onSelectEvent: (e: CalendarEvent) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const key = e.start_at.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function CalendarAgendaView({ events, onSelectEvent }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p className="text-sm font-medium">Sin eventos este mes</p>
        <p className="text-xs mt-1">Crea un nuevo evento con el botón superior</p>
      </div>
    )
  }

  const grouped = groupByDay(events)

  return (
    <div className="space-y-6">
      {grouped.map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 capitalize">
            {formatDate(dayEvents[0].start_at)}
          </h4>
          <div className="space-y-2">
            {dayEvents.map(e => {
              const cfg = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent(e)}
                  className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-3 w-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {e.title}
                        </span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        {e.intelligence_status === 'ready' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Briefing listo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {!e.all_day && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(e.start_at)} — {formatTime(e.end_at)}
                          </span>
                        )}
                        {e.location_text && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {e.location_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
