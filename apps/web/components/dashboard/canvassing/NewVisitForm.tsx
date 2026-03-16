'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Territory { id: string; name: string }
interface Contact { id: string; first_name: string; last_name: string; document_number: string | null }

interface Props {
  contacts: Contact[]
  territories: Territory[]
  action: (formData: FormData) => Promise<void>
}

export function NewVisitForm({ contacts, territories, action }: Props) {
  const [showContactedSections, setShowContactedSections] = useState(false)
  const [showFollowupFields, setShowFollowupFields] = useState(false)
  const [gpsLat, setGpsLat] = useState('')
  const [gpsLng, setGpsLng] = useState('')

  // Capture volunteer's GPS silently when form loads
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLat(String(pos.coords.latitude))
        setGpsLng(String(pos.coords.longitude))
      },
      () => { /* permission denied or unavailable — silent, GPS is optional */ },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  return (
    <form action={action} className="space-y-6">
      {/* Hidden GPS fields — populated silently via geolocation */}
      <input type="hidden" name="gps_lat" value={gpsLat} />
      <input type="hidden" name="gps_lng" value={gpsLng} />

      {/* Sección A — Contacto y Resultado */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1.5">
          A — Contacto y Resultado
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="contact_id">Contacto *</Label>
          <select
            id="contact_id"
            name="contact_id"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar contacto…</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>
                {c.last_name}, {c.first_name}{c.document_number ? ` — ${c.document_number}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="result">Resultado de la visita *</Label>
          <select
            id="result"
            name="result"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={e => setShowContactedSections(['contacted', 'positive'].includes(e.target.value))}
          >
            <option value="">Seleccionar resultado…</option>
            <optgroup label="Contacto establecido">
              <option value="contacted">Contactado — se habló con la persona</option>
            </optgroup>
            <optgroup label="Sin contacto">
              <option value="no_home">No estaba — nadie abrió la puerta</option>
              <option value="not_home">No en casa — confirmado por vecino</option>
              <option value="neighbor_absent">Vecino informó ausencia temporal</option>
              <option value="come_back_later">Volver más tarde — pidió que regresen</option>
              <option value="inaccessible">Inaccesible — edificio o zona cerrada</option>
            </optgroup>
            <optgroup label="Rechazo">
              <option value="refused">Rechazó — no quiso hablar</option>
            </optgroup>
            <optgroup label="Datos inválidos">
              <option value="moved">Se mudó — ya no vive ahí</option>
              <option value="wrong_address">Dirección incorrecta</option>
              <option value="deceased">Fallecido</option>
            </optgroup>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas del resultado</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={500}
            placeholder="Observaciones sobre esta visita…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      {/* Secciones B, C, D — solo si Contactado */}
      {showContactedSections && (
        <div className="space-y-6">

          {/* Sección B — Simpatía */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1.5">
              B — Perfil de Simpatía
            </h3>

            <div className="space-y-1.5">
              <Label>Nivel de simpatía con el candidato</Label>
              <div className="flex gap-3">
                {[
                  { value: '5', label: '★★★★★', desc: 'Simpatizante fuerte' },
                  { value: '4', label: '★★★★', desc: 'Simpatizante' },
                  { value: '3', label: '★★★', desc: 'Indeciso' },
                  { value: '2', label: '★★', desc: 'Escéptico' },
                  { value: '1', label: '★', desc: 'Opositor' },
                ].map(opt => (
                  <label key={opt.value} className="flex flex-col items-center gap-1 cursor-pointer group">
                    <input type="radio" name="sympathy_level" value={opt.value} className="sr-only" />
                    <div className="text-lg group-has-[:checked]:text-indigo-600 text-slate-300 font-bold select-none">
                      {opt.label}
                    </div>
                    <span className="text-xs text-slate-400 text-center leading-tight">{opt.desc}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400">Selecciona el nivel de simpatía percibido</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vote_intention">Intención de voto</Label>
                <select
                  id="vote_intention"
                  name="vote_intention"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sin respuesta</option>
                  <option value="will_vote_us">Votará por nosotros</option>
                  <option value="probably_us">Probablemente nosotros</option>
                  <option value="undecided">Indeciso</option>
                  <option value="probably_other">Probablemente otro</option>
                  <option value="will_vote_other">Votará por otro</option>
                  <option value="wont_vote">No piensa votar</option>
                  <option value="refused">No quiso responder</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="persuadability">Persuadabilidad</Label>
                <select
                  id="persuadability"
                  name="persuadability"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sin evaluar</option>
                  <option value="high">Alta — muy abierto a escuchar</option>
                  <option value="medium">Media — escucha con reservas</option>
                  <option value="low">Baja — posición muy fija</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección C — Acciones detectadas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1.5">
              C — Acciones e Intereses Detectados
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'wants_to_volunteer', label: 'Quiere ser voluntario' },
                { name: 'wants_to_donate', label: 'Quiere donar' },
                { name: 'wants_more_info', label: 'Quiere más información' },
                { name: 'wants_yard_sign', label: 'Quiere material de campaña' },
              ].map(item => (
                <label key={item.name} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" name={item.name} className="h-4 w-4 rounded border-input accent-indigo-600" />
                  {item.label}
                </label>
              ))}
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
                <input
                  type="checkbox"
                  name="requested_followup"
                  id="requested_followup"
                  className="h-4 w-4 rounded border-input accent-indigo-600"
                  onChange={e => setShowFollowupFields(e.target.checked)}
                />
                Pidió que lo contacten de nuevo
              </label>
              {showFollowupFields && (
                <div className="pl-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="followup_channel">Canal preferido</Label>
                      <select
                        id="followup_channel"
                        name="followup_channel"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Seleccionar…</option>
                        <option value="call">Llamada telefónica</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="visit">Visita en persona</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="best_contact_time">Mejor horario</Label>
                      <Input
                        id="best_contact_time"
                        name="best_contact_time"
                        placeholder="Ej: Noches después de las 7pm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="followup_notes">Nota del seguimiento</Label>
                    <Input
                      id="followup_notes"
                      name="followup_notes"
                      maxLength={255}
                      placeholder="Detalles del seguimiento solicitado…"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección D — Datos del hogar */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1.5">
              D — Datos del Hogar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="household_size">Personas en la vivienda</Label>
                <Input id="household_size" name="household_size" type="number" min="1" max="99" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="household_voters">Votantes estimados</Label>
                <Input id="household_voters" name="household_voters" type="number" min="0" max="99" placeholder="0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección E — Ubicación */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1.5">
          E — Ubicación
        </h3>

        {territories.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="territory_id">Territorio</Label>
            <select
              id="territory_id"
              name="territory_id"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin territorio asignado</option>
              {territories.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              name="address_confirmed"
              defaultChecked
              className="h-4 w-4 rounded border-input accent-indigo-600"
            />
            La dirección del sistema coincide con lo que vi en terreno
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="address_notes">Corrección de dirección</Label>
            <Input
              id="address_notes"
              name="address_notes"
              placeholder="Ej: El número es 45B, no 45…"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button type="submit" className="flex-1">Guardar visita</Button>
        <Link href="/dashboard/canvassing">
          <Button type="button" variant="outline">Cancelar</Button>
        </Link>
      </div>
    </form>
  )
}
