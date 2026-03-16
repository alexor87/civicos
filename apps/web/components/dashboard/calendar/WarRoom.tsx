'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, AlertTriangle, Users, BarChart2, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'
import { EventDetailSheet } from './EventDetailSheet'

interface UpcomingEvent {
  id: string
  title: string
  event_type: string
  status: string
  start_at: string
  location_text: string | null
  municipality_name: string | null
  intelligence_status: string
  all_day: boolean
}

interface WarRoomData {
  upcoming: UpcomingEvent[]
  intelligenceAlerts: UpcomingEvent[]
  field: {
    totalContacts: number
    sympathizersPct: number
    undecidedPct: number
    recentVisits: number
  }
  monthStats: {
    total: number
    completed: number
    pending: number
    cancelled: number
    completedPct: number
    nextElection: string | null
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function WarRoom() {
  const [data, setData]       = useState<WarRoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [generatingId, setGeneratingId]   = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/calendar/warroom')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function generateBriefing(eventId: string) {
    setGeneratingId(eventId)
    try {
      await fetch(`/api/calendar/events/${eventId}/intelligence`, { method: 'POST' })
      await load()
    } finally {
      setGeneratingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-slate-500">Cargando sala de guerra…</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm">{error ?? 'Error desconocido'}</div>
    )
  }

  const { upcoming, intelligenceAlerts, field, monthStats } = data

  return (
    <div className="grid grid-cols-2 gap-5" data-testid="warroom">

      {/* ── Q1: Próximos 7 días ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Próximos 7 días</h3>
            <p className="text-[10px] text-slate-500">{upcoming.length} eventos programados</p>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Sin eventos en los próximos 7 días</p>
        ) : (
          <div className="space-y-2" data-testid="upcoming-events">
            {upcoming.map(e => {
              const cfg = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedEvent(e as unknown as CalendarEvent)}
                  className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {e.all_day ? new Date(e.start_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : formatTime(e.start_at)}
                      </span>
                      {e.intelligence_status === 'ready' && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Briefing listo
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Q2: Alertas de Inteligencia ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            intelligenceAlerts.length > 0 ? 'bg-amber-100' : 'bg-emerald-100'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${intelligenceAlerts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alertas de Inteligencia</h3>
            <p className="text-[10px] text-slate-500">
              {intelligenceAlerts.length === 0 ? 'Todos los briefings preparados' : `${intelligenceAlerts.length} evento(s) sin briefing`}
            </p>
          </div>
        </div>

        {intelligenceAlerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-600">Todo listo</p>
            <p className="text-xs text-slate-400 mt-1">Todos los eventos tienen briefing preparado</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="intelligence-alerts">
            {intelligenceAlerts.map(e => {
              const cfg      = EVENT_TYPE_CONFIG[e.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
              const isGen    = generatingId === e.id
              return (
                <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{e.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(e.start_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => generateBriefing(e.id)}
                    disabled={isGen}
                    className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 flex-shrink-0 disabled:opacity-60"
                  >
                    {isGen ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {isGen ? 'Generando…' : 'Generar'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Q3: Resumen de Campo ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resumen de Campo</h3>
            <p className="text-[10px] text-slate-500">Datos CRM de la campaña</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{field.totalContacts.toLocaleString('es-CO')}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total contactos</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{field.sympathizersPct}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Simpatizantes</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{field.undecidedPct}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Indecisos</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 tabular-nums">{field.recentVisits}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Visitas 14 días</p>
          </div>
        </div>
      </div>

      {/* ── Q4: Estado del Calendario ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Estado del Calendario</h3>
            <p className="text-[10px] text-slate-500">Este mes · {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tasa de completado</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{monthStats.completedPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
              <div
                className="h-2 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${monthStats.completedPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{monthStats.completed}</p>
              <p className="text-[10px] text-slate-500">Completados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary tabular-nums">{monthStats.pending}</p>
              <p className="text-[10px] text-slate-500">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-400 tabular-nums">{monthStats.cancelled}</p>
              <p className="text-[10px] text-slate-500">Cancelados</p>
            </div>
          </div>

          {monthStats.nextElection && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-0.5">Próxima fecha electoral</p>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                {new Date(monthStats.nextElection).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
