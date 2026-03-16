'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, List, Columns, Clock, GitBranch, Swords } from 'lucide-react'
import Link from 'next/link'
import { CalendarMonthView }  from './CalendarMonthView'
import { CalendarWeekView }   from './CalendarWeekView'
import { CalendarDayView }    from './CalendarDayView'
import { CalendarAgendaView } from './CalendarAgendaView'
import { EventDetailSheet }   from './EventDetailSheet'
import { CalendarEvent } from './eventTypes'

type View = 'month' | 'week' | 'day' | 'agenda'

interface Props {
  initialMonth: string  // YYYY-MM
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day  = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function CalendarShell({ initialMonth }: Props) {
  const router = useRouter()
  const [view, setView]                   = useState<View>('month')
  const [activeDate, setActiveDate]       = useState(() => {
    const [y, m] = initialMonth.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })
  const [events, setEvents]               = useState<CalendarEvent[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const fetchEvents = useCallback(async (date: Date, currentView: View) => {
    setLoading(true)
    let url: string
    if (currentView === 'month' || currentView === 'agenda') {
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      url = `/api/calendar/events?month=${month}`
    } else if (currentView === 'week') {
      const monday = getMonday(date)
      const sunday = addDays(monday, 7)
      url = `/api/calendar/events?start=${monday.toISOString()}&end=${sunday.toISOString()}`
    } else {
      // day view
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = addDays(start, 1)
      url = `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
    }
    try {
      const res = await fetch(url)
      if (res.ok) setEvents(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents(activeDate, view) }, [activeDate, view, fetchEvents])

  function handleComplete(eventId: string) {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' } : e))
    setSelectedEvent(null)
  }

  const VIEW_BUTTONS: { id: View; label: string; Icon: React.ElementType }[] = [
    { id: 'month',  label: 'Mes',    Icon: LayoutGrid },
    { id: 'week',   label: 'Semana', Icon: Columns    },
    { id: 'day',    label: 'Día',    Icon: Clock      },
    { id: 'agenda', label: 'Agenda', Icon: List       },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 gap-3">

        {/* View switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {VIEW_BUTTONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === id
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/calendar/timeline"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Línea del Tiempo
          </Link>
          <Link
            href="/dashboard/calendar/warroom"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Swords className="h-3.5 w-3.5" />
            Sala de Guerra
          </Link>
          <button
            onClick={() => router.push('/dashboard/calendar/new')}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        </div>
      </div>

      {/* Calendar area */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            Cargando eventos…
          </div>
        ) : view === 'month' ? (
          <CalendarMonthView
            events={events}
            activeDate={activeDate}
            onMonthChange={d => setActiveDate(d)}
            onSelectEvent={setSelectedEvent}
          />
        ) : view === 'week' ? (
          <CalendarWeekView
            events={events}
            activeDate={activeDate}
            onWeekChange={d => setActiveDate(d)}
            onSelectEvent={setSelectedEvent}
          />
        ) : view === 'day' ? (
          <CalendarDayView
            events={events}
            activeDate={activeDate}
            onDayChange={d => setActiveDate(d)}
            onSelectEvent={setSelectedEvent}
          />
        ) : (
          <CalendarAgendaView
            events={events}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </div>

      {/* Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onComplete={handleComplete}
      />
    </div>
  )
}
