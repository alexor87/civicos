'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Tag, FileText, Calendar, IdCard, Users, Landmark, Zap, Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { deleteContact } from '@/app/dashboard/contacts/actions'
import type { Database } from '@/lib/types/database'

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  document_type?: string | null
  document_number?: string | null
  birth_date?: string | null
  gender?: string | null
  department?: string | null
  municipality?: string | null
  commune?: string | null
  voting_place?: string | null
  voting_table?: string | null
}
type VisitResult = Database['public']['Tables']['canvass_visits']['Row']['result']

export type VisitWithVolunteer =
  Database['public']['Tables']['canvass_visits']['Row'] & { volunteerName: string }

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  supporter: { label: 'Simpatizante', variant: 'default' },
  undecided:  { label: 'Indeciso',    variant: 'secondary' },
  opponent:   { label: 'Opositor',    variant: 'destructive' },
  unknown:    { label: 'Desconocido', variant: 'outline' },
}

const resultConfig: Partial<Record<VisitResult, { label: string; className: string }>> = {
  positive:  { label: 'Positivo',    className: 'bg-green-100 text-green-700' },
  negative:  { label: 'Negativo',    className: 'bg-red-100 text-red-700' },
  undecided: { label: 'Indeciso',    className: 'bg-yellow-100 text-yellow-700' },
  no_home:   { label: 'No en casa',  className: 'bg-slate-100 text-slate-600' },
  follow_up: { label: 'Seguimiento', className: 'bg-blue-100 text-blue-700' },
  refused:   { label: 'Rechazó',     className: 'bg-orange-100 text-orange-700' },
}

const GENDER_LABELS: Record<string, string> = {
  M: 'Masculino', F: 'Femenino', NB: 'No binario', NE: 'Prefiero no decir',
}

const ROLE_LABELS: Record<string, string> = {
  votante: 'Votante', lider_barrial: 'Líder barrial', coordinador: 'Coordinador',
  voluntario: 'Voluntario', donante: 'Donante', testigo: 'Testigo electoral',
}

const SOURCE_LABELS: Record<string, string> = {
  puerta_a_puerta: 'Puerta a puerta', evento: 'Evento', referido: 'Referido',
  formulario_web: 'Formulario web', importado: 'Base importada', whatsapp: 'WhatsApp', otro: 'Otro',
}

interface Props {
  contact: Contact
  visits: VisitWithVolunteer[]
}

export function ContactProfile({ contact, visits }: Props) {
  const [isPending, startTransition] = useTransition()
  const status = statusConfig[contact.status] ?? statusConfig.unknown
  const meta = (contact.metadata as Record<string, string | null | undefined>) ?? {}

  function handleDelete() {
    if (!window.confirm(`¿Eliminar a ${contact.first_name} ${contact.last_name}? Esta acción no se puede deshacer.`)) return
    startTransition(() => deleteContact(contact.id))
  }

  const locationParts = [contact.department, contact.municipality ?? contact.city, contact.commune ?? contact.district].filter(Boolean)
  const votingInfo = [contact.voting_place, contact.voting_table ? `Mesa ${contact.voting_table}` : null].filter(Boolean)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {contact.first_name} {contact.last_name}
          </h1>
          {(contact.document_type || contact.document_number) && (
            <p className="text-slate-500 text-sm mt-0.5">
              {contact.document_type} {contact.document_number}
            </p>
          )}
          <p className="text-slate-400 text-xs mt-1">
            Registrado el {new Date(contact.created_at).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 flex-wrap justify-end">
            <Badge variant={status.variant}>{status.label}</Badge>
            {!!meta.campaign_role && (
              <Badge variant="outline">{ROLE_LABELS[String(meta.campaign_role)] ?? String(meta.campaign_role)}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-lg bg-white p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Contacto</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{contact.phone ?? '—'}</span>
              </div>
              {meta.phone_alternate && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-slate-300" />
                  <span>{String(meta.phone_alternate)}</span>
                  <span className="text-xs text-slate-400">alterno</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{contact.email ?? '—'}</span>
              </div>
              {contact.address && (
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <span>{contact.address}</span>
                </div>
              )}
              {contact.birth_date && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{new Date(contact.birth_date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</span>
                  {contact.gender && <span className="text-slate-400">· {GENDER_LABELS[contact.gender] ?? contact.gender}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Ubicación electoral */}
          {(locationParts.length > 0 || votingInfo.length > 0) && (
            <div className="border rounded-lg bg-white p-5 space-y-3">
              <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> Ubicación electoral
              </h2>
              <div className="space-y-1.5 text-sm text-slate-600">
                {locationParts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{locationParts.join(' › ')}</span>
                  </div>
                )}
                {votingInfo.length > 0 && (
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{votingInfo.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Perfil político */}
          {(meta.political_affinity || meta.vote_intention || meta.electoral_priority || meta.mobilizes_count) && (
            <div className="border rounded-lg bg-white p-5 space-y-3">
              <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Perfil político
              </h2>
              <div className="space-y-2 text-sm">
                {meta.political_affinity && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Afinidad</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <div
                          key={n}
                          className={`w-4 h-4 rounded-sm ${Number(meta.political_affinity) >= n ? 'bg-indigo-500' : 'bg-slate-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {meta.vote_intention && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Intención voto</span>
                    <span className="font-medium capitalize">{String(meta.vote_intention)}</span>
                  </div>
                )}
                {meta.electoral_priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Prioridad</span>
                    <Badge variant="outline" className="capitalize text-xs">{String(meta.electoral_priority)}</Badge>
                  </div>
                )}
                {meta.mobilizes_count && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Moviliza</span>
                    <div className="flex items-center gap-1 font-medium">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {String(meta.mobilizes_count)} votos
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fuente */}
          {(meta.contact_source || meta.referred_by || meta.territorial_manager) && (
            <div className="border rounded-lg bg-white p-5 space-y-2">
              <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Origen</h2>
              <div className="space-y-1.5 text-sm text-slate-600">
                {meta.contact_source && (
                  <div>{SOURCE_LABELS[meta.contact_source as string] ?? String(meta.contact_source)}{meta.source_detail ? ` — ${meta.source_detail}` : ''}</div>
                )}
                {meta.referred_by && <div className="text-slate-500">Referido por: <span className="text-slate-700">{String(meta.referred_by)}</span></div>}
                {meta.territorial_manager && <div className="text-slate-500">Responsable: <span className="text-slate-700">{String(meta.territorial_manager)}</span></div>}
              </div>
            </div>
          )}

          {/* Tags */}
          {(contact.tags ?? []).length > 0 && (
            <div className="border rounded-lg bg-white p-5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Etiquetas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(contact.tags ?? []).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="border rounded-lg bg-white p-5 space-y-2">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notas</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Canvassing timeline */}
        <div className="lg:col-span-2 border rounded-lg bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Historial de canvassing</h2>
            <span className="text-xs text-slate-400">{visits.length} visita{visits.length !== 1 ? 's' : ''}</span>
          </div>

          {visits.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Sin visitas registradas
            </div>
          ) : (
            <ol className="space-y-4">
              {visits.map(visit => {
                const result = resultConfig[visit.result] ?? { label: visit.result, className: 'bg-slate-100 text-slate-600' }
                return (
                  <li key={visit.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div className="w-px flex-1 bg-slate-100 mt-1" />
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${result.className}`}>
                          {result.label}
                        </span>
                        <span className="text-xs text-slate-500">{visit.volunteerName}</span>
                        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(visit.created_at).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                        </span>
                      </div>
                      {visit.notes && (
                        <p className="text-sm text-slate-600 mt-1">{visit.notes}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
