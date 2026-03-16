'use client'

import { useState, useEffect, useRef } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'
import { EventDetailSheet } from './EventDetailSheet'

const RANGE_DAYS_PAST   = 30
const RANGE_DAYS_FUTURE = 90
const TOTAL_DAYS        = RANGE_DAYS_PAST + RANGE_DAYS_FUTURE

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfDay(d: Date) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function dayOffset(startDate: Date, eventDate: Date): number {
  return Math.round((startDate.valueOf() - eventDate.valueOf()) / 86400000)
}

// Group events by type for the timeline rows
const TIMELINE_TYPES = Object.keys(EVENT_TYPE_CONFIG)

interface TooltipState { event: CalendarEvent; x: number; y: number }

export function ElectoralTimeline() {
  const [events, setEvents]               = useState<CalendarEvent[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [tooltip, setTooltip]             = useState<TooltipState | null>(null)
  const containerRef                      = useRef<HTMLDivElement>(null)

  const today     = startOfDay(new Date())
  const rangeStart = addDays(today, -RANGE_DAYS_PAST)
  const rangeEnd   = addDays(today, RANGE_DAYS_FUTURE)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/calendar/events?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`
        )
        if (res.ok) setEvents(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Compute month markers
  const months: { label: string; leftPct: number }[] = []
  {
    let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
    while (cur < rangeEnd) {
      const offset = Math.round((cur.valueOf() - rangeStart.valueOf()) / 86400000)
      const pct    = (offset / TOTAL_DAYS) * 100
      if (pct >= 0 && pct <= 100) {
        months.push({
          label:   cur.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
          leftPct: pct,
        })
      }
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  }

  // Today position
  const todayLeftPct = (RANGE_DAYS_PAST / TOTAL_DAYS) * 100

  function eventLeftPct(e: CalendarEvent): number {
    const d = startOfDay(new Date(e.start_at))
    const offset = Math.round((d.valueOf() - rangeStart.valueOf()) / 86400000)
    return Math.max(0, Math.min(100, (offset / TOTAL_DAYS) * 100))
  }

  function handleEventMouseEnter(e: CalendarEvent, ev: React.MouseEvent) {
    setTooltip({ event: e, x: ev.clientX, y: ev.clientY })
  }

  function handleEventMouseLeave() {
    setTooltip(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        Cargando línea de tiempo…
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="electoral-timeline">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div ref={containerRef} className="overflow-x-auto">
        <div className="min-w-[800px]">

          {/* Month header row */}
          <div className="relative h-8 mb-1">
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider capitalize"
                style={{ left: `${m.leftPct}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Rows per event type */}
          <div className="space-y-0">
            {TIMELINE_TYPES.map(typeKey => {
              const cfg        = EVENT_TYPE_CONFIG[typeKey]
              const typeEvents = events.filter(e => e.event_type === typeKey)

              return (
                <div key={typeKey} className="flex items-center group">
                  {/* Row label */}
                  <div className="w-28 flex-shrink-0 text-[11px] font-medium text-slate-500 pr-3 text-right leading-tight">
                    {cfg.label}
                  </div>

                  {/* Timeline track */}
                  <div className="flex-1 relative h-8 border-b border-slate-100 dark:border-slate-800 group-last:border-b-0">

                    {/* Month dividers */}
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-slate-100 dark:border-slate-800"
                        style={{ left: `${m.leftPct}%` }}
                      />
                    ))}

                    {/* Today marker */}
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-primary/60 z-10"
                      style={{ left: `${todayLeftPct}%` }}
                      data-testid="today-marker"
                    />

                    {/* Events */}
                    {typeEvents.map(e => {
                      const leftPct = eventLeftPct(e)
                      return (
                        <button
                          key={e.id}
                          className="absolute top-1/2 -translate-y-1/2 z-20 group/dot"
                          style={{ left: `${leftPct}%`, transform: 'translate(-50%, -50%)' }}
                          onClick={() => setSelectedEvent(e)}
                          onMouseEnter={ev => handleEventMouseEnter(e, ev)}
                          onMouseLeave={handleEventMouseLeave}
                          aria-label={e.title}
                          data-testid="timeline-event"
                        >
                          <div
                            className="h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md transition-transform group-hover/dot:scale-125"
                            style={{ backgroundColor: cfg.color }}
                          />
                        </button>
                      )
                    })}

                    {/* Empty row placeholder */}
                    {typeEvents.length === 0 && (
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-800" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom date axis */}
          <div className="relative h-6 mt-1">
            <div className="absolute text-[10px] text-slate-400" style={{ left: 0 }}>
              {rangeStart.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </div>
            <div className="absolute text-[10px] text-slate-400" style={{ left: `${todayLeftPct}%`, transform: 'translateX(-50%)' }}>
              <span className="font-bold text-primary">Hoy</span>
            </div>
            <div className="absolute text-[10px] text-slate-400 right-0">
              {rangeEnd.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl px-3 py-2 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="text-xs font-semibold text-slate-900 dark:text-white">{tooltip.event.title}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {new Date(tooltip.event.start_at).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span className="font-medium tabular-nums">{events.length}</span>
          <span>eventos en los próximos 90 días</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-sm text-slate-600"
        >
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span>Hoy — {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Detail sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
