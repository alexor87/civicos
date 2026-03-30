'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock, Users, FileText, X, Star, CheckCircle2, Pencil } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EVENT_TYPE_CONFIG, CalendarEvent } from './eventTypes'
import { EventIntelligencePanel } from './EventIntelligencePanel'

interface Props {
  event: CalendarEvent | null
  onClose: () => void
  onComplete?: (eventId: string) => void
}

type Tab = 'details' | 'intelligence' | 'post'

function formatDateTime(iso: string, allDay: boolean) {
  if (allDay) return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return new Date(iso).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function EventDetailSheet({ event, onClose, onComplete }: Props) {
  const [tab, setTab] = useState<Tab>('details')
  const [completing, setCompleting] = useState(false)
  const [postData, setPostData]     = useState({ actual_attendance: '', post_event_notes: '', post_event_rating: 0 })

  if (!event) return null

  const cfg                  = EVENT_TYPE_CONFIG[event.event_type] ?? EVENT_TYPE_CONFIG.internal_meeting
  const hasIntelligence      = cfg.activatesIntelligence
  const isCompleted          = event.status === 'completed'

  async function handleComplete() {
    setCompleting(true)
    try {
      await fetch(`/api/calendar/events/${event!.id}/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          actual_attendance:  postData.actual_attendance ? Number(postData.actual_attendance) : null,
          post_event_notes:   postData.post_event_notes || null,
          post_event_rating:  postData.post_event_rating || null,
        }),
      })
      onComplete?.(event!.id)
      onClose()
    } finally {
      setCompleting(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details',      label: 'Detalles'     },
    { id: 'intelligence', label: 'Inteligencia' },
    { id: 'post',         label: 'Post-evento'  },
  ]

  return (
    <Sheet open={!!event} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: cfg.color + '20' }}
            >
              <CalendarDays className="h-4 w-4" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                >
                  {cfg.label}
                </span>
                {isCompleted && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completado
                  </span>
                )}
              </div>
              <SheetTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {event.title}
              </SheetTitle>
            </div>
            {event.status !== 'completed' && event.status !== 'cancelled' && (
              <Link
                href={`/dashboard/calendar/${event.id}/edit`}
                className="flex-shrink-0 h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
                title="Editar evento"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === t.id
                    ? 'bg-primary text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-5">

          {/* ── Details ───────────────────────────────────────────────── */}
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{formatDateTime(event.start_at, event.all_day)}</p>
                  {!event.all_day && (
                    <p className="text-xs text-slate-500">hasta {formatDateTime(event.end_at, false)}</p>
                  )}
                </div>
              </div>

              {event.location_text && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">{event.location_text}</p>
                    {event.municipality_name && (
                      <p className="text-xs text-slate-500">{event.municipality_name}{event.neighborhood_name ? ` · ${event.neighborhood_name}` : ''}</p>
                    )}
                  </div>
                </div>
              )}

              {event.expected_attendance != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{event.expected_attendance} asistentes esperados</span>
                </div>
              )}

              {event.description && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {event.internal_notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Notas internas</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{event.internal_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Intelligence ──────────────────────────────────────────── */}
          {tab === 'intelligence' && (
            hasIntelligence
              ? <EventIntelligencePanel eventId={event.id} />
              : (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm font-medium">No aplica para este tipo de evento</p>
                  <p className="text-xs mt-1">La inteligencia está disponible para mítines, canvassing, recaudación y visitas institucionales</p>
                </div>
              )
          )}

          {/* ── Post-evento ───────────────────────────────────────────── */}
          {tab === 'post' && (
            <div className="space-y-4">
              {isCompleted ? (
                <>
                  {event.actual_attendance != null && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Asistencia real</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{event.actual_attendance}</p>
                    </div>
                  )}
                  {event.post_event_rating && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valoración</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-5 w-5 ${s <= event.post_event_rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {event.post_event_notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notas post-evento</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{event.post_event_notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asistencia real</label>
                    <input
                      type="number"
                      value={postData.actual_attendance}
                      onChange={e => setPostData(p => ({ ...p, actual_attendance: e.target.value }))}
                      placeholder="Número de asistentes"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valoración del evento</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <button
                          key={s}
                          onClick={() => setPostData(p => ({ ...p, post_event_rating: s }))}
                        >
                          <Star className={`h-6 w-6 transition-colors ${s <= postData.post_event_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notas post-evento</label>
                    <textarea
                      value={postData.post_event_notes}
                      onChange={e => setPostData(p => ({ ...p, post_event_notes: e.target.value }))}
                      rows={4}
                      placeholder="¿Cómo fue el evento? ¿Qué aprendiste?"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completing ? 'Guardando…' : 'Marcar como completado'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
