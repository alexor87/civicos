'use client'

import { useState, useEffect } from 'react'
import { Loader2, Sparkles, AlertCircle, Users, MapPin } from 'lucide-react'

interface LinkedContactInfo {
  id: string
  name: string
  sympathy_level: number | null
  status: string | null
  phone: string | null
  email: string | null
}

interface IntelligenceData {
  contacts: {
    total: number
    sympathyDist: Record<number, number>
    undecidedCount: number
    undecidedPct: number
  }
  linkedContacts: LinkedContactInfo[]
  canvassing: {
    totalVisits: number
    mostFrequentResult: string | null
    resultBreakdown: Record<string, number>
  }
  aiStatus: string
  aiBriefing: {
    summary: string
    audience: string
    risks: string
    talking_points: string[]
    logistics: string
  } | null
  cached_at: string | null
}

interface Props {
  eventId: string
}

const SYMPATHY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Opositor fuerte',  color: '#EF4444' },
  2: { label: 'Opositor leve',   color: '#F97316' },
  3: { label: 'Indeciso',        color: '#F59E0B' },
  4: { label: 'Simpatizante',    color: '#10B981' },
  5: { label: 'Defensor',        color: '#1A6FE8' },
}

export function EventIntelligencePanel({ eventId }: Props) {
  const [data, setData]         = useState<IntelligenceData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar/events/${eventId}/intelligence`)
      if (!res.ok) throw new Error('Error cargando datos')
      setData(await res.json())
    } catch {
      setError('No se pudo cargar la información de inteligencia')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [eventId])

  async function generateBriefing() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar/events/${eventId}/intelligence`, { method: 'POST' })
      if (!res.ok) throw new Error('Error generando briefing')
      await loadData()
    } catch {
      setError('Error al generar el briefing')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-slate-500">Cargando datos de la zona…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg text-red-600 text-sm">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {error}
      </div>
    )
  }

  if (!data) return null

  const { contacts, canvassing, linkedContacts } = data
  const totalSympathy = Object.values(contacts.sympathyDist).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-6">

      {/* Linked Contacts */}
      {linkedContacts && linkedContacts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Contactos vinculados ({linkedContacts.length})
          </h4>
          <div className="space-y-2">
            {linkedContacts.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.status && (
                      <span className="text-[10px] text-slate-500">{c.status}</span>
                    )}
                    {c.sympathy_level && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
                        backgroundColor: (SYMPATHY_LABELS[c.sympathy_level]?.color ?? '#94A3B8') + '20',
                        color: SYMPATHY_LABELS[c.sympathy_level]?.color ?? '#94A3B8',
                      }}>
                        {SYMPATHY_LABELS[c.sympathy_level]?.label ?? `Nivel ${c.sympathy_level}`}
                      </span>
                    )}
                  </div>
                </div>
                {(c.phone || c.email) && (
                  <span className="text-[10px] text-slate-400 text-right">{c.phone || c.email}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRM Zone Data */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Datos de la zona (CRM)
        </h4>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{contacts.total}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Contactos</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{contacts.undecidedPct}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Indecisos</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{canvassing.totalVisits}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Visitas 30d</p>
          </div>
        </div>

        {/* Sympathy distribution bars */}
        {contacts.total > 0 && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(level => {
              const count = contacts.sympathyDist[level] ?? 0
              const pct   = totalSympathy > 0 ? Math.round((count / totalSympathy) * 100) : 0
              const cfg   = SYMPATHY_LABELS[level]
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-24 truncate">{cfg.label}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 w-8 text-right tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Briefing */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Briefing IA
        </h4>

        {!data.aiBriefing && (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Briefing no generado</p>
            <p className="text-xs text-slate-400 mb-4">Genera un briefing ejecutivo basado en los datos del CRM</p>
            <button
              onClick={generateBriefing}
              disabled={generating}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generando…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />Generar briefing</>
              )}
            </button>
          </div>
        )}

        {data.aiBriefing && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Resumen</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{data.aiBriefing.summary}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Audiencia</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{data.aiBriefing.audience}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Puntos clave</p>
              <ul className="space-y-1">
                {data.aiBriefing.talking_points?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Riesgos</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{data.aiBriefing.risks}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Logística</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{data.aiBriefing.logistics}</p>
            </div>

            <button
              onClick={generateBriefing}
              disabled={generating}
              className="w-full text-xs text-slate-400 hover:text-primary transition-colors py-1 flex items-center justify-center gap-1"
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {generating ? 'Regenerando…' : 'Regenerar briefing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
