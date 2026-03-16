'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  CheckCircle, XCircle, User, MapPin, Calendar,
  Star, Heart, Phone, Home, FileText,
} from 'lucide-react'

// ── Result labels & colors ────────────────────────────────────────────────────

const RESULT_LABELS: Record<string, string> = {
  contacted:       'Contactado',
  positive:        'Positivo',
  negative:        'Negativo',
  undecided:       'Indeciso',
  no_home:         'No en casa',
  not_home:        'No en casa',
  neighbor_absent: 'Vecino informó',
  follow_up:       'Seguimiento',
  refused:         'Rechazó',
  moved:           'Se mudó',
  wrong_address:   'Dir. incorrecta',
  deceased:        'Fallecido',
  come_back_later: 'Volver después',
  inaccessible:    'Inaccesible',
}

const RESULT_COLORS: Record<string, string> = {
  contacted:       'bg-green-100 text-green-700',
  positive:        'bg-green-100 text-green-700',
  negative:        'bg-red-100 text-red-700',
  refused:         'bg-orange-100 text-orange-700',
  undecided:       'bg-yellow-100 text-yellow-700',
  no_home:         'bg-slate-100 text-slate-600',
  not_home:        'bg-slate-100 text-slate-600',
  neighbor_absent: 'bg-slate-100 text-slate-600',
  follow_up:       'bg-blue-100 text-blue-700',
  come_back_later: 'bg-blue-100 text-blue-700',
  moved:           'bg-purple-100 text-purple-700',
  wrong_address:   'bg-purple-100 text-purple-700',
  deceased:        'bg-slate-100 text-slate-500',
  inaccessible:    'bg-slate-100 text-slate-500',
}

const VOTE_LABELS: Record<string, string> = {
  will_vote_us:     'Vota por nosotros',
  probably_us:      'Probablemente nos vota',
  undecided:        'Indeciso',
  probably_other:   'Probablemente otro',
  will_vote_other:  'Vota por otro',
  wont_vote:        'No votará',
  refused:          'Se negó a responder',
  si:               'Sí',
  no:               'No',
  indeciso:         'Indeciso',
}

const PERSUADABILITY_LABELS: Record<string, string> = {
  high:   'Alta',
  medium: 'Media',
  low:    'Baja',
}

const PERSUADABILITY_COLORS: Record<string, string> = {
  high:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-red-100 text-red-700',
}

const FOLLOWUP_CHANNEL_LABELS: Record<string, string> = {
  call:     'Llamada',
  sms:      'SMS',
  whatsapp: 'WhatsApp',
  email:    'Email',
  visit:    'Visita presencial',
}

// ── Visit type ────────────────────────────────────────────────────────────────

export interface VisitRow {
  id: string
  result: string
  notes: string | null
  attempt_number: number | null
  sympathy_level: number | null
  vote_intention: string | null
  persuadability: string | null
  wants_to_volunteer: boolean | null
  wants_to_donate: boolean | null
  wants_more_info: boolean | null
  wants_yard_sign: boolean | null
  requested_followup: boolean | null
  followup_channel: string | null
  followup_notes: string | null
  best_contact_time: string | null
  household_size: number | null
  household_voters: number | null
  address_confirmed: boolean | null
  address_notes: string | null
  status: string
  rejection_reason: string | null
  created_at: string
  contacts: { first_name: string; last_name: string } | null
  profiles: { full_name: string | null } | null
  territories: { name: string } | null
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  visit: VisitRow | null
  onClose: () => void
  canApprove: boolean
}

export function VisitDetailSheet({ visit, onClose, canApprove }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason]       = useState('')

  const isOpen = visit !== null

  const contactName = visit?.contacts
    ? `${visit.contacts.first_name} ${visit.contacts.last_name}`
    : 'Contacto desconocido'

  const isContacted = ['contacted', 'positive'].includes(visit?.result ?? '')

  const hasInterests = visit && (
    visit.wants_to_volunteer || visit.wants_to_donate ||
    visit.wants_more_info    || visit.wants_yard_sign
  )

  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose()
      setRejecting(false)
      setReason('')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[440px] sm:w-[440px] flex flex-col p-0 gap-0">

        {/* ── Header ── */}
        <SheetHeader className="px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold text-slate-900 leading-tight">
                {contactName}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {visit && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLORS[visit.result] ?? 'bg-slate-100 text-slate-600'}`}>
                    {RESULT_LABELS[visit.result] ?? visit.result}
                  </span>
                )}
                {visit && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(visit.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body (scrollable) ── */}
        {visit && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* General info */}
            <div>
              <SectionTitle>Información general</SectionTitle>
              <div className="divide-y divide-slate-50">
                <Field
                  label="Voluntario"
                  value={
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {visit.profiles?.full_name ?? '—'}
                    </span>
                  }
                />
                {visit.territories?.name && (
                  <Field
                    label="Territorio"
                    value={
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {visit.territories.name}
                      </span>
                    }
                  />
                )}
                {visit.attempt_number && (
                  <Field label="Intento nº" value={`#${visit.attempt_number}`} />
                )}
                {visit.notes && (
                  <div className="py-2">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Notas
                    </p>
                    <p className="text-xs text-slate-800 bg-slate-50 rounded-md px-3 py-2 leading-relaxed">
                      {visit.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact profile (only if contacted/positive) */}
            {isContacted && (visit.sympathy_level || visit.vote_intention || visit.persuadability) && (
              <div>
                <SectionTitle>Perfil del contacto</SectionTitle>
                <div className="divide-y divide-slate-50">
                  {visit.sympathy_level && (
                    <Field
                      label="Simpatía"
                      value={<SympathyStars level={visit.sympathy_level} />}
                    />
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
                  {visit.persuadability && (
                    <Field
                      label="Persuadabilidad"
                      value={
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PERSUADABILITY_COLORS[visit.persuadability] ?? 'bg-slate-100 text-slate-600'}`}>
                          {PERSUADABILITY_LABELS[visit.persuadability] ?? visit.persuadability}
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {hasInterests && (
              <div>
                <SectionTitle>Intereses detectados</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {visit.wants_to_volunteer && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 text-violet-700 font-medium border border-violet-100">
                      <Heart className="h-3 w-3" />
                      Quiere voluntariar
                    </span>
                  )}
                  {visit.wants_to_donate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-700 font-medium border border-green-100">
                      Quiere donar
                    </span>
                  )}
                  {visit.wants_more_info && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium border border-blue-100">
                      Quiere más info
                    </span>
                  )}
                  {visit.wants_yard_sign && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-orange-50 text-orange-700 font-medium border border-orange-100">
                      Cartel de jardín
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Followup */}
            {visit.requested_followup && (
              <div>
                <SectionTitle>Seguimiento solicitado</SectionTitle>
                <div className="divide-y divide-slate-50">
                  {visit.followup_channel && (
                    <Field
                      label="Canal"
                      value={
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {FOLLOWUP_CHANNEL_LABELS[visit.followup_channel] ?? visit.followup_channel}
                        </span>
                      }
                    />
                  )}
                  {visit.best_contact_time && (
                    <Field label="Mejor hora" value={visit.best_contact_time} />
                  )}
                  {visit.followup_notes && (
                    <div className="py-2">
                      <p className="text-xs text-slate-800 bg-slate-50 rounded-md px-3 py-2 leading-relaxed">
                        {visit.followup_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Household */}
            {(visit.household_size || visit.household_voters) && (
              <div>
                <SectionTitle>Datos del hogar</SectionTitle>
                <div className="divide-y divide-slate-50">
                  {visit.household_size && (
                    <Field
                      label="Tamaño del hogar"
                      value={
                        <span className="flex items-center gap-1">
                          <Home className="h-3 w-3 text-slate-400" />
                          {visit.household_size} personas
                        </span>
                      }
                    />
                  )}
                  {visit.household_voters && (
                    <Field label="Votantes estimados" value={`${visit.household_voters} personas`} />
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            {(visit.address_confirmed === false || visit.address_notes) && (
              <div>
                <SectionTitle>Dirección</SectionTitle>
                <div className="divide-y divide-slate-50">
                  <Field
                    label="Dirección confirmada"
                    value={
                      visit.address_confirmed
                        ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Sí</span>
                        : <span className="text-red-500">No coincide</span>
                    }
                  />
                  {visit.address_notes && (
                    <div className="py-2">
                      <p className="text-xs text-slate-800 bg-slate-50 rounded-md px-3 py-2 leading-relaxed">
                        {visit.address_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection reason (if already rejected) */}
            {visit.status === 'rejected' && visit.rejection_reason && (
              <div>
                <SectionTitle>Motivo de rechazo</SectionTitle>
                <p className="text-xs text-red-700 bg-red-50 rounded-md px-3 py-2 border border-red-100">
                  {visit.rejection_reason}
                </p>
              </div>
            )}

          </div>
        )}

        {/* ── Footer: approve / reject ── */}
        {visit && canApprove && visit.status === 'submitted' && (
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 bg-white">
            {rejecting ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">Motivo del rechazo</p>
                <Input
                  placeholder="Describe por qué se rechaza esta visita…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <form action="/api/canvassing/approve" method="POST" className="flex-1">
                    <input type="hidden" name="visitId" value={visit.id} />
                    <input type="hidden" name="action" value="reject" />
                    <input type="hidden" name="rejection_reason" value={reason} />
                    <Button type="submit" variant="destructive" className="w-full text-sm" disabled={!reason.trim()}>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Confirmar rechazo
                    </Button>
                  </form>
                  <Button variant="outline" onClick={() => setRejecting(false)} className="text-sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <form action="/api/canvassing/approve" method="POST" className="flex-1">
                  <input type="hidden" name="visitId" value={visit.id} />
                  <input type="hidden" name="action" value="approve" />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Aprobar visita
                  </Button>
                </form>
                <Button
                  variant="outline"
                  onClick={() => setRejecting(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-sm"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        )}

      </SheetContent>
    </Sheet>
  )
}
