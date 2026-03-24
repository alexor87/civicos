'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Sparkles, Clock, MapPin, Phone, Mail, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Database } from '@/lib/types/database'
import Link from 'next/link'

type Contact = Database['public']['Tables']['contacts']['Row']
type VisitResult = Database['public']['Enums']['visit_result']

interface RecentVisit {
  id: string
  result: VisitResult
  notes: string | null
  created_at: string
}

interface AIAnalysis {
  tags: string[]
  insight: string
}

const resultLabel: Partial<Record<VisitResult, string>> = {
  positive: 'Positiva',
  negative: 'Negativa',
  undecided: 'Indeciso',
  no_home: 'Sin respuesta',
  follow_up: 'Seguimiento',
  contacted: 'Contactado',
  not_home: 'No en casa',
  refused: 'Rechazó',
}

const resultColor: Partial<Record<VisitResult, string>> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contacted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
  refused: 'bg-red-50 text-red-700 border-red-200',
  undecided: 'bg-amber-50 text-amber-700 border-amber-200',
  follow_up: 'bg-blue-50 text-blue-700 border-blue-200',
  no_home: 'bg-slate-100 text-slate-500 border-slate-200',
  not_home: 'bg-slate-100 text-slate-500 border-slate-200',
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function avatarColor(id: string) {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const sympathyLabel: Record<string, string> = {
  supporter: 'ALTO',
  undecided: 'MEDIO',
  opponent: 'BAJO',
  unknown: 'BAJO',
}

const sympathyClass: Record<string, string> = {
  supporter: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  undecided: 'bg-amber-50 text-amber-700 border-amber-200',
  opponent: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function ContactQuickProfile({
  contact,
  onClose,
}: {
  contact: Contact
  onClose: () => void
}) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [visits, setVisits] = useState<RecentVisit[]>([])
  const [visitsLoading, setVisitsLoading] = useState(true)
  const [planLoading, setPlanLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)

  // Fetch recent visits
  useEffect(() => {
    setVisitsLoading(true)
    setVisits([])
    fetch(`/api/contacts/${contact.id}/visits`)
      .then(r => r.ok ? r.json() : { visits: [] })
      .then(data => setVisits(data.visits ?? []))
      .catch(() => setVisits([]))
      .finally(() => setVisitsLoading(false))
  }, [contact.id])

  // Fetch AI analysis
  useEffect(() => {
    setAnalysis(null)
    setAnalysisLoading(true)
    setPlan(null)
    fetch(`/api/contacts/${contact.id}/ai-analysis`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setAnalysis(data))
      .catch(() => setAnalysis(null))
      .finally(() => setAnalysisLoading(false))
  }, [contact.id])

  async function generatePlan() {
    setPlanLoading(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}/ai-analysis?plan=true`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : null
      setPlan(data?.plan ?? null)
    } catch {
      setPlan(null)
    } finally {
      setPlanLoading(false)
    }
  }

  const initials = getInitials(contact.first_name, contact.last_name)
  const avatarCls = avatarColor(contact.id)

  return (
    <AnimatePresence>
      {/* Backdrop (mobile) */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/10 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.aside
        key="panel"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-100">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${avatarCls}`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 leading-tight">
              {contact.first_name} {contact.last_name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {contact.district && (
                <span className="text-xs text-slate-500 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {contact.district}
                </span>
              )}
              <Badge
                variant="outline"
                className={`text-xs font-semibold tracking-wide ${sympathyClass[contact.status] ?? sympathyClass.unknown}`}
              >
                {sympathyLabel[contact.status] ?? 'BAJO'}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contact info */}
        <div className="px-5 py-4 border-b border-slate-100 space-y-2">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}
          {(contact.address || contact.city) && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {[contact.address, contact.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Análisis IA</h3>
          </div>

          {analysisLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analizando perfil...
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              {analysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">{analysis.insight}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No se pudo cargar el análisis.</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Actividad Reciente</h3>
          </div>

          {visitsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando visitas...
            </div>
          ) : visits.length === 0 ? (
            <p className="text-sm text-slate-400">Sin visitas registradas.</p>
          ) : (
            <div className="space-y-2">
              {visits.slice(0, 3).map(visit => (
                <div key={visit.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    <Badge
                      variant="outline"
                      className={`text-xs ${resultColor[visit.result] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
                    >
                      {resultLabel[visit.result] ?? visit.result}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    {visit.notes && (
                      <p className="text-xs text-slate-600 truncate">{visit.notes}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {new Date(visit.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Plan */}
        {plan && (
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Plan de Alcance</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{plan}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="px-5 py-4 mt-auto space-y-2">
          <Button
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={generatePlan}
            disabled={planLoading}
          >
            {planLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generar Plan de Alcance IA
          </Button>

          <Link href={`/dashboard/contacts/${contact.id}`} className="block">
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver Historial Completo
            </Button>
          </Link>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
