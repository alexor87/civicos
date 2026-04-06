'use client'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Phone, Mail, MapPin, Calendar, Star, Tag,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContactMapData {
  contact: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    status: string | null
    tags: string[] | null
    document_number: string | null
    department: string | null
    municipality: string | null
  }
  lastVisit: {
    id: string
    result: string
    notes: string | null
    created_at: string
    sympathy_level: number | null
    vote_intention: string | null
  } | null
}

// ── Labels ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  supporter: 'Simpatizante',
  undecided: 'Indeciso',
  opponent: 'Opositor',
  unknown: 'Desconocido',
}

const STATUS_COLORS: Record<string, string> = {
  supporter: 'bg-green-100 text-green-700',
  undecided: 'bg-yellow-100 text-yellow-700',
  opponent: 'bg-red-100 text-red-700',
  unknown: 'bg-slate-100 text-slate-600',
}

const RESULT_LABELS: Record<string, string> = {
  contacted: 'Contactado',
  positive: 'Positivo',
  negative: 'Negativo',
  undecided: 'Indeciso',
  no_home: 'No en casa',
  not_home: 'No en casa',
  follow_up: 'Seguimiento',
  refused: 'Rechazó',
  moved: 'Se mudó',
  come_back_later: 'Volver después',
}

const RESULT_COLORS: Record<string, string> = {
  contacted: 'bg-green-100 text-green-700',
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-red-100 text-red-700',
  undecided: 'bg-yellow-100 text-yellow-700',
  no_home: 'bg-slate-100 text-slate-600',
  not_home: 'bg-slate-100 text-slate-600',
  follow_up: 'bg-blue-100 text-blue-700',
  refused: 'bg-orange-100 text-orange-700',
  moved: 'bg-purple-100 text-purple-700',
  come_back_later: 'bg-blue-100 text-blue-700',
}

const VOTE_LABELS: Record<string, string> = {
  will_vote_us: 'Vota por nosotros',
  probably_us: 'Probablemente nos vota',
  undecided: 'Indeciso',
  probably_other: 'Probablemente otro',
  will_vote_other: 'Vota por otro',
  wont_vote: 'No votará',
  si: 'Sí',
  no: 'No',
  indeciso: 'Indeciso',
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
      {children}
    </p>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 text-right">{value}</span>
    </div>
  )
}

function SympathyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= level ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  data: ContactMapData | null
  onClose: () => void
}

export function ContactMapSheet({ data, onClose }: Props) {
  const isOpen = data !== null
  const contact = data?.contact
  const visit = data?.lastVisit

  const contactName = contact
    ? `${contact.first_name} ${contact.last_name}`
    : ''

  const address = [contact?.address, contact?.city, contact?.municipality, contact?.department]
    .filter(Boolean)
    .join(', ')

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-[440px] sm:w-[440px] flex flex-col p-0 gap-0">

        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <SheetTitle className="text-base font-semibold text-slate-900 leading-tight">
              {contactName}
            </SheetTitle>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {contact?.status && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[contact.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABELS[contact.status] ?? contact.status}
                </span>
              )}
              {contact?.document_number && (
                <span className="text-xs text-slate-400">
                  {contact.document_number}
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        {contact && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Contact info */}
            <div>
              <SectionTitle>Información de contacto</SectionTitle>
              <div className="divide-y divide-slate-50">
                {contact.phone && (
                  <Field
                    label="Teléfono"
                    value={
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {contact.phone}
                      </span>
                    }
                  />
                )}
                {contact.email && (
                  <Field
                    label="Email"
                    value={
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {contact.email}
                      </span>
                    }
                  />
                )}
                {address && (
                  <Field
                    label="Dirección"
                    value={
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {address}
                      </span>
                    }
                  />
                )}
              </div>
            </div>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <div>
                <SectionTitle>Etiquetas</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Last visit */}
            {visit ? (
              <div>
                <SectionTitle>Última visita</SectionTitle>
                <div className="divide-y divide-slate-50">
                  <Field
                    label="Resultado"
                    value={
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLORS[visit.result] ?? 'bg-slate-100 text-slate-600'}`}>
                        {RESULT_LABELS[visit.result] ?? visit.result}
                      </span>
                    }
                  />
                  <Field
                    label="Fecha"
                    value={
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(visit.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    }
                  />
                  {visit.sympathy_level && (
                    <Field label="Simpatía" value={<SympathyStars level={visit.sympathy_level} />} />
                  )}
                  {visit.vote_intention && (
                    <Field
                      label="Intención de voto"
                      value={
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                          {VOTE_LABELS[visit.vote_intention] ?? visit.vote_intention}
                        </span>
                      }
                    />
                  )}
                  {visit.notes && (
                    <div className="py-2">
                      <p className="text-xs text-slate-500 mb-1">Notas</p>
                      <p className="text-xs text-slate-800 bg-slate-50 rounded-md px-3 py-2 leading-relaxed">
                        {visit.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <SectionTitle>Visitas</SectionTitle>
                <p className="text-xs text-slate-400 italic">Sin visitas registradas</p>
              </div>
            )}

          </div>
        )}

      </SheetContent>
    </Sheet>
  )
}
