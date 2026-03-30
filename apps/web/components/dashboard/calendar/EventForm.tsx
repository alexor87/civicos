'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, MapPin, FileText, Loader2 } from 'lucide-react'
import { EVENT_TYPE_CONFIG, type CalendarEvent } from './eventTypes'

interface Props {
  defaultDate?: string  // YYYY-MM-DD
  eventId?: string
  initialEvent?: CalendarEvent
}

type EventTypeKey = keyof typeof EVENT_TYPE_CONFIG

const EVENT_TYPES = Object.entries(EVENT_TYPE_CONFIG) as [EventTypeKey, (typeof EVENT_TYPE_CONFIG)[EventTypeKey]][]

function toLocalInput(iso: string) {
  return iso.slice(0, 16) // "YYYY-MM-DDTHH:mm"
}

export function EventForm({ defaultDate, eventId, initialEvent }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const isEdit = !!eventId

  const todayDate  = defaultDate ?? new Date().toISOString().slice(0, 10)
  const defaultStart = `${todayDate}T09:00`
  const defaultEnd   = `${todayDate}T10:00`

  const [form, setForm] = useState({
    event_type:          (initialEvent?.event_type ?? 'internal_meeting') as EventTypeKey,
    title:               initialEvent?.title ?? '',
    all_day:             initialEvent?.all_day ?? false,
    start_at:            initialEvent ? toLocalInput(initialEvent.start_at) : defaultStart,
    end_at:              initialEvent ? toLocalInput(initialEvent.end_at) : defaultEnd,
    location_text:       initialEvent?.location_text ?? '',
    municipality_name:   initialEvent?.municipality_name ?? '',
    neighborhood_name:   initialEvent?.neighborhood_name ?? '',
    description:         initialEvent?.description ?? '',
    internal_notes:      initialEvent?.internal_notes ?? '',
    expected_attendance: initialEvent?.expected_attendance != null ? String(initialEvent.expected_attendance) : '',
  })

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('El título es obligatorio'); return }

    setSubmitting(true)
    setError(null)

    try {
      const url = isEdit ? `/api/calendar/events/${eventId}` : '/api/calendar/events'
      const res = await fetch(url, {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          start_at:           new Date(form.start_at).toISOString(),
          end_at:             new Date(form.end_at).toISOString(),
          expected_attendance: form.expected_attendance ? Number(form.expected_attendance) : null,
          location_text:      form.location_text || null,
          municipality_name:  form.municipality_name || null,
          neighborhood_name:  form.neighborhood_name || null,
          description:        form.description || null,
          internal_notes:     form.internal_notes || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? (isEdit ? 'Error guardando cambios' : 'Error creando evento'))
        return
      }

      router.push('/dashboard/calendar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* ── Sección 1: Tipo de evento ─────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          Tipo de evento
        </h3>
        <div className="grid grid-cols-3 gap-2" data-testid="event-type-grid">
          {EVENT_TYPES.map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => set('event_type', key)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                form.event_type === key
                  ? 'border-current shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
              style={form.event_type === key ? { borderColor: cfg.color, backgroundColor: cfg.color + '10' } : {}}
              data-testid={`event-type-${key}`}
            >
              <div
                className="h-2 w-2 rounded-full mb-2"
                style={{ backgroundColor: cfg.color }}
              />
              <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{cfg.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Sección 2: Información básica ────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Información básica</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ej. Mitin en la Plaza Central"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
            data-testid="title-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="all_day"
            type="checkbox"
            checked={form.all_day}
            onChange={e => set('all_day', e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor="all_day" className="text-sm text-slate-700 dark:text-slate-300">Todo el día</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type={form.all_day ? 'date' : 'datetime-local'}
              value={form.all_day ? form.start_at.slice(0, 10) : form.start_at}
              onChange={e => set('start_at', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
              data-testid="start-at-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Fin <span className="text-red-500">*</span>
            </label>
            <input
              type={form.all_day ? 'date' : 'datetime-local'}
              value={form.all_day ? form.end_at.slice(0, 10) : form.end_at}
              onChange={e => set('end_at', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
              data-testid="end-at-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Asistencia esperada
          </label>
          <input
            type="number"
            min="0"
            value={form.expected_attendance}
            onChange={e => set('expected_attendance', e.target.value)}
            placeholder="Número de personas"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* ── Sección 3: Ubicación ──────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          Ubicación
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Dirección / Lugar</label>
          <input
            type="text"
            value={form.location_text}
            onChange={e => set('location_text', e.target.value)}
            placeholder="Ej. Plaza Central de Rionegro"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Municipio</label>
            <input
              type="text"
              value={form.municipality_name}
              onChange={e => set('municipality_name', e.target.value)}
              placeholder="Ej. Rionegro"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
              data-testid="municipality-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Barrio / Sector</label>
            <input
              type="text"
              value={form.neighborhood_name}
              onChange={e => set('neighborhood_name', e.target.value)}
              placeholder="Ej. El Centro"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* ── Sección 4: Notas ─────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Notas
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Descripción pública</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Descripción del evento…"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none bg-white dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Notas internas (equipo)</label>
          <textarea
            value={form.internal_notes}
            onChange={e => set('internal_notes', e.target.value)}
            rows={3}
            placeholder="Solo visibles para el equipo…"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          data-testid="submit-button"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? 'Guardando…' : 'Creando…'}</>
          ) : (
            isEdit ? 'Guardar cambios' : 'Crear evento'
          )}
        </button>
      </div>
    </form>
  )
}
