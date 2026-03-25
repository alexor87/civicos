import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { ChevronLeft, ChevronDown } from 'lucide-react'

async function updateContact(id: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()
  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) redirect('/dashboard/contacts')

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const docType   = (formData.get('document_type') as string)?.trim()
  const docNumber = (formData.get('document_number') as string)?.trim()
  const rawPhone  = (formData.get('phone') as string)?.trim()

  if (!firstName || !lastName || !docType || !docNumber || !rawPhone) {
    redirect(`/dashboard/contacts/${id}/edit?error=required`)
  }

  const phone = rawPhone.replace(/\D/g, '')
  const rawEmail = (formData.get('email') as string)?.trim()
  const email = rawEmail ? rawEmail.toLowerCase() : null

  // Dedup: same doc number but different contact
  const { data: existingByDoc } = await supabase
    .from('contacts').select('id')
    .eq('campaign_id', campaignId!).eq('document_number', docNumber)
    .neq('id', id).limit(1).single()
  if (existingByDoc?.id) {
    redirect(`/dashboard/contacts/${id}/edit?error=duplicate&dup=${existingByDoc.id}`)
  }

  const rawTags = (formData.get('tags') as string)?.trim()
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  const metadata: Record<string, unknown> = {}
  const metaFields = [
    'phone_alternate','marital_status','postal_code','political_affinity',
    'vote_intention','preferred_party','electoral_priority','campaign_role',
    'contact_source','source_detail','territorial_manager','referred_by',
    'mobilizes_count','main_need','economic_sector','beneficiary_program',
  ]
  for (const field of metaFields) {
    const val = (formData.get(field) as string)?.trim()
    if (val) metadata[field] = val
  }

  await supabase.from('contacts').update({
    first_name: firstName, last_name: lastName,
    document_type: docType, document_number: docNumber,
    phone, email,
    birth_date: (formData.get('birth_date') as string) || null,
    gender: (formData.get('gender') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    department: (formData.get('department') as string)?.trim() || null,
    municipality: (formData.get('municipality') as string)?.trim() || null,
    commune: (formData.get('commune') as string)?.trim() || null,
    city: (formData.get('municipality') as string)?.trim() || null,
    district: (formData.get('commune') as string)?.trim() || null,
    voting_place: (formData.get('voting_place') as string)?.trim() || null,
    voting_table: (formData.get('voting_table') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'unknown',
    notes: (formData.get('notes') as string)?.trim() || null,
    tags, metadata,
  }).eq('id', id)

  redirect(`/dashboard/contacts/${id}`)
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group" open>
      <summary className="flex items-center justify-between cursor-pointer px-5 py-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-sm text-gray-900">{title}</span>
        <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="mt-1 border rounded-lg bg-white p-5 space-y-4">{children}</div>
    </details>
  )
}

export default async function EditContactPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; dup?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts').select('*').eq('id', id).single()
  if (!contact) notFound()

  const meta = (contact.metadata as Record<string, unknown>) ?? {}
  const boundUpdate = updateContact.bind(null, id)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <Link href={`/dashboard/contacts/${id}`}>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al perfil
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Editar Contacto</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contact.first_name} {contact.last_name}</p>
        </div>
      </div>

      {sp.error === 'required' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Los campos <strong>Nombre, Apellido, Tipo de documento, Número de documento y Teléfono</strong> son obligatorios.
        </div>
      )}
      {sp.error === 'duplicate' && sp.dup && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Ya existe otro contacto con ese número de documento.{' '}
          <Link href={`/dashboard/contacts/${sp.dup}`} className="font-semibold underline underline-offset-2">
            Ver contacto →
          </Link>
        </div>
      )}

      <form action={boundUpdate}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">Nombre <span className="text-red-500">*</span></Label>
                    <Input id="first_name" name="first_name" defaultValue={contact.first_name} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Apellido <span className="text-red-500">*</span></Label>
                    <Input id="last_name" name="last_name" defaultValue={contact.last_name} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="document_type">Tipo de documento <span className="text-red-500">*</span></Label>
                    <Select name="document_type" defaultValue={(contact as Record<string, unknown>).document_type as string ?? ''}>
                      <SelectTrigger id="document_type"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC">Cédula de ciudadanía (CC)</SelectItem>
                        <SelectItem value="CE">Cédula de extranjería (CE)</SelectItem>
                        <SelectItem value="TI">Tarjeta de identidad (TI)</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="document_number">Número de documento <span className="text-red-500">*</span></Label>
                    <Input id="document_number" name="document_number" defaultValue={(contact as Record<string, unknown>).document_number as string ?? ''} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono móvil <span className="text-red-500">*</span></Label>
                    <Input id="phone" name="phone" type="tel" defaultValue={contact.phone ?? ''} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                    <Input id="birth_date" name="birth_date" type="date" defaultValue={(contact as Record<string, unknown>).birth_date as string ?? ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Sexo / Género</Label>
                    <Select name="gender" defaultValue={(contact as Record<string, unknown>).gender as string ?? ''}>
                      <SelectTrigger id="gender"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="NB">No binario</SelectItem>
                        <SelectItem value="NE">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="marital_status">Estado civil</Label>
                    <Select name="marital_status" defaultValue={meta.marital_status as string ?? ''}>
                      <SelectTrigger id="marital_status"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero/a</SelectItem>
                        <SelectItem value="casado">Casado/a</SelectItem>
                        <SelectItem value="union_libre">Unión libre</SelectItem>
                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                        <SelectItem value="viudo">Viudo/a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CollapsibleSection title="Información de contacto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone_alternate">Teléfono alterno</Label>
                  <Input id="phone_alternate" name="phone_alternate" type="tel" defaultValue={meta.phone_alternate as string ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" name="email" type="email" defaultValue={contact.email ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" defaultValue={contact.address ?? ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="district_barrio">Barrio / Vereda</Label>
                  <Input id="district_barrio" name="district_barrio" defaultValue={contact.district ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal_code">Código postal</Label>
                  <Input id="postal_code" name="postal_code" defaultValue={meta.postal_code as string ?? ''} />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Ubicación electoral">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" name="department" defaultValue={(contact as Record<string, unknown>).department as string ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="municipality">Municipio</Label>
                  <Input id="municipality" name="municipality" defaultValue={(contact as Record<string, unknown>).municipality as string ?? contact.city ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commune">Comuna / Localidad</Label>
                <Input id="commune" name="commune" defaultValue={(contact as Record<string, unknown>).commune as string ?? ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="voting_place">Puesto de votación</Label>
                  <Input id="voting_place" name="voting_place" defaultValue={(contact as Record<string, unknown>).voting_place as string ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voting_table">Mesa</Label>
                  <Input id="voting_table" name="voting_table" defaultValue={(contact as Record<string, unknown>).voting_table as string ?? ''} />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Perfil político">
              <div className="space-y-1.5">
                <Label>Afinidad política (1 = Opositor, 5 = Militante)</Label>
                <div className="flex gap-3 pt-1">
                  {[1,2,3,4,5].map(n => (
                    <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                      <input type="radio" name="political_affinity" value={String(n)} defaultChecked={String(meta.political_affinity) === String(n)} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-xs text-gray-500">{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vote_intention">Intención de voto</Label>
                  <Select name="vote_intention" defaultValue={meta.vote_intention as string ?? ''}>
                    <SelectTrigger id="vote_intention"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="indeciso">Indeciso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="electoral_priority">Prioridad electoral</Label>
                  <Select name="electoral_priority" defaultValue={meta.electoral_priority as string ?? ''}>
                    <SelectTrigger id="electoral_priority"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="campaign_role">Rol en campaña</Label>
                  <Select name="campaign_role" defaultValue={meta.campaign_role as string ?? ''}>
                    <SelectTrigger id="campaign_role"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="votante">Votante</SelectItem>
                      <SelectItem value="lider_barrial">Líder barrial</SelectItem>
                      <SelectItem value="coordinador">Coordinador</SelectItem>
                      <SelectItem value="voluntario">Voluntario</SelectItem>
                      <SelectItem value="donante">Donante</SelectItem>
                      <SelectItem value="testigo">Testigo electoral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_party">Partido preferido</Label>
                  <Input id="preferred_party" name="preferred_party" defaultValue={meta.preferred_party as string ?? ''} />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Fuente y seguimiento">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contact_source">Fuente de captura</Label>
                  <Select name="contact_source" defaultValue={meta.contact_source as string ?? ''}>
                    <SelectTrigger id="contact_source"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="puerta_a_puerta">Puerta a puerta</SelectItem>
                      <SelectItem value="evento">Evento</SelectItem>
                      <SelectItem value="referido">Referido</SelectItem>
                      <SelectItem value="formulario_web">Formulario web</SelectItem>
                      <SelectItem value="importado">Base importada</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="source_detail">Detalle de fuente</Label>
                  <Input id="source_detail" name="source_detail" defaultValue={meta.source_detail as string ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="territorial_manager">Responsable territorial</Label>
                <Input id="territorial_manager" name="territorial_manager" defaultValue={meta.territorial_manager as string ?? ''} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Campos estratégicos (Colombia)">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="referred_by">Líder que lo refiere</Label>
                  <Input id="referred_by" name="referred_by" defaultValue={meta.referred_by as string ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobilizes_count">Votos que moviliza</Label>
                  <Input id="mobilizes_count" name="mobilizes_count" type="number" min="0" defaultValue={meta.mobilizes_count as string ?? ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="main_need">Necesidad principal</Label>
                  <Input id="main_need" name="main_need" defaultValue={meta.main_need as string ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="economic_sector">Sector económico</Label>
                  <Input id="economic_sector" name="economic_sector" defaultValue={meta.economic_sector as string ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_program">Beneficiario de programa</Label>
                <Input id="beneficiary_program" name="beneficiary_program" defaultValue={meta.beneficiary_program as string ?? ''} />
              </div>
            </CollapsibleSection>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Estado</CardTitle></CardHeader>
              <CardContent>
                <Select name="status" defaultValue={contact.status ?? 'unknown'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Sin definir</SelectItem>
                    <SelectItem value="supporter">Simpatizante</SelectItem>
                    <SelectItem value="undecided">Indeciso</SelectItem>
                    <SelectItem value="opponent">Opositor</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Etiquetas</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                <Input name="tags" defaultValue={(contact.tags ?? []).join(', ')} />
                <p className="text-xs text-muted-foreground">Separadas por comas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Notas</CardTitle></CardHeader>
              <CardContent>
                <textarea name="notes" rows={5} defaultValue={contact.notes ?? ''}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit">Guardar cambios</Button>
          <Link href={`/dashboard/contacts/${id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
