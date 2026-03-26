import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { ContactGeoSelector } from '@/components/contacts/ContactGeoSelector'

async function createContact(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) redirect('/dashboard/contacts')

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const docType   = (formData.get('document_type') as string)?.trim()
  const docNumber = (formData.get('document_number') as string)?.trim()
  const rawPhone  = (formData.get('phone') as string)?.trim()

  if (!firstName || !lastName || !docType || !docNumber || !rawPhone) {
    redirect('/dashboard/contacts/new?error=required')
  }

  const phone = rawPhone.replace(/\D/g, '')
  const rawEmail = (formData.get('email') as string)?.trim()
  const email = rawEmail ? rawEmail.toLowerCase() : null

  // Deduplication: document number is the primary key
  const { data: existingByDoc } = await supabase
    .from('contacts')
    .select('id')
    .eq('campaign_id', campaignId!)
    .eq('document_number', docNumber)
    .limit(1)
    .single()

  if (existingByDoc?.id) {
    redirect(`/dashboard/contacts/new?error=duplicate&id=${existingByDoc.id}`)
  }

  // Secondary dedup: email or phone
  if (email || phone) {
    const orConditions: string[] = []
    if (email) orConditions.push(`email.eq.${email}`)
    if (phone) orConditions.push(`phone.eq.${phone}`)

    const { data: existingByContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId!)
      .or(orConditions.join(','))
      .limit(1)
      .single()

    if (existingByContact?.id) {
      redirect(`/dashboard/contacts/new?error=duplicate&id=${existingByContact.id}`)
    }
  }

  // Tags
  const rawTags = (formData.get('tags') as string)?.trim()
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []

  // Metadata: secondary fields
  const metadata: Record<string, unknown> = {}
  const metaFields: [string, string][] = [
    ['phone_alternate', 'phone_alternate'],
    ['marital_status', 'marital_status'],
    ['postal_code', 'postal_code'],
    ['political_affinity', 'political_affinity'],
    ['vote_intention', 'vote_intention'],
    ['preferred_party', 'preferred_party'],
    ['electoral_priority', 'electoral_priority'],
    ['campaign_role', 'campaign_role'],
    ['contact_source', 'contact_source'],
    ['source_detail', 'source_detail'],
    ['territorial_manager', 'territorial_manager'],
    ['referred_by', 'referred_by'],
    ['mobilizes_count', 'mobilizes_count'],
    ['main_need', 'main_need'],
    ['economic_sector', 'economic_sector'],
    ['beneficiary_program', 'beneficiary_program'],
  ]
  for (const [fieldName, metaKey] of metaFields) {
    const val = (formData.get(fieldName) as string)?.trim()
    if (val) metadata[metaKey] = val
  }

  await supabase.from('contacts').insert({
    tenant_id: profile!.tenant_id,
    campaign_id: campaignId,
    first_name: firstName,
    last_name: lastName,
    document_type: docType,
    document_number: docNumber,
    phone,
    email,
    birth_date: (formData.get('birth_date') as string) || null,
    gender: (formData.get('gender') as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    department: (formData.get('department') as string)?.trim() || null,
    municipality: (formData.get('municipality') as string)?.trim() || null,
    commune: (formData.get('commune') as string)?.trim() || null,
    city: (formData.get('municipality') as string)?.trim() || null,
    district: (formData.get('district_barrio') as string)?.trim() || null,
    voting_place: (formData.get('voting_place') as string)?.trim() || null,
    voting_table: (formData.get('voting_table') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'unknown',
    notes: (formData.get('notes') as string)?.trim() || null,
    tags,
    metadata,
  })

  redirect('/dashboard/contacts')
}

// Reusable collapsible section wrapper
function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between cursor-pointer px-5 py-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-sm text-gray-900">{title}</span>
        <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="mt-1 border rounded-lg bg-white p-5 space-y-4">
        {children}
      </div>
    </details>
  )
}

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; id?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const duplicateId = params.id

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Contactos
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nuevo Contacto</h1>
          <p className="text-sm text-gray-500 mt-0.5">Los campos marcados con * son obligatorios</p>
        </div>
      </div>

      {/* Error banners */}
      {error === 'required' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Los campos <strong>Nombre, Apellido, Tipo de documento, Número de documento y Teléfono</strong> son obligatorios.
        </div>
      )}
      {error === 'duplicate' && duplicateId && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Ya existe un contacto con ese documento, correo o teléfono en la campaña.{' '}
          <Link href={`/dashboard/contacts/${duplicateId}`} className="font-semibold underline underline-offset-2">
            Ver contacto existente →
          </Link>
        </div>
      )}

      <form action={createContact}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* A. Información básica — siempre visible */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">Nombre <span className="text-red-500">*</span></Label>
                    <Input id="first_name" name="first_name" placeholder="Juan" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Apellido <span className="text-red-500">*</span></Label>
                    <Input id="last_name" name="last_name" placeholder="García" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="document_type">Tipo de documento <span className="text-red-500">*</span></Label>
                    <Select name="document_type" required>
                      <SelectTrigger id="document_type" className="w-full">
                        <SelectValue placeholder="CC / CE / TI..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC">CC — Cédula de ciudadanía</SelectItem>
                        <SelectItem value="CE">CE — Cédula de extranjería</SelectItem>
                        <SelectItem value="TI">TI — Tarjeta de identidad</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="document_number">Número de documento <span className="text-red-500">*</span></Label>
                    <Input id="document_number" name="document_number" placeholder="1023456789" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono móvil <span className="text-red-500">*</span></Label>
                    <Input id="phone" name="phone" type="tel" placeholder="3104567890" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                    <Input id="birth_date" name="birth_date" type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Sexo / Género</Label>
                    <Select name="gender">
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
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
                    <Select name="marital_status">
                      <SelectTrigger id="marital_status" className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
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

            {/* B. Información de contacto */}
            <CollapsibleSection title="Información de contacto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone_alternate">Teléfono alterno</Label>
                  <Input id="phone_alternate" name="phone_alternate" type="tel" placeholder="3114567890" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" placeholder="Calle 80 #45-23" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postal_code">Código postal</Label>
                <Input id="postal_code" name="postal_code" placeholder="050016" />
              </div>
            </CollapsibleSection>

            {/* C. Ubicación electoral */}
            <CollapsibleSection title="Ubicación electoral">
              <ContactGeoSelector />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="voting_place">Puesto de votación</Label>
                  <Input id="voting_place" name="voting_place" placeholder="IE San Javier" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voting_table">Mesa</Label>
                  <Input id="voting_table" name="voting_table" placeholder="001" />
                </div>
              </div>
            </CollapsibleSection>

            {/* D. Perfil político */}
            <CollapsibleSection title="Perfil político">
              <div className="space-y-1.5">
                <Label>Afinidad política (1 = Opositor, 5 = Militante)</Label>
                <div className="flex gap-3 pt-1">
                  {[1,2,3,4,5].map(n => (
                    <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                      <input type="radio" name="political_affinity" value={String(n)} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-xs text-gray-500">{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vote_intention">Intención de voto</Label>
                  <Select name="vote_intention">
                    <SelectTrigger id="vote_intention" className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="indeciso">Indeciso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="electoral_priority">Prioridad electoral</Label>
                  <Select name="electoral_priority">
                    <SelectTrigger id="electoral_priority" className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
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
                  <Select name="campaign_role">
                    <SelectTrigger id="campaign_role" className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
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
                  <Input id="preferred_party" name="preferred_party" placeholder="Nombre del partido" />
                </div>
              </div>
            </CollapsibleSection>

            {/* E. Campaña y fuente */}
            <CollapsibleSection title="Fuente y seguimiento">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contact_source">Fuente de captura</Label>
                  <Select name="contact_source">
                    <SelectTrigger id="contact_source" className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
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
                  <Input id="source_detail" name="source_detail" placeholder="Brigada barrio Estadio" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="territorial_manager">Responsable territorial</Label>
                <Input id="territorial_manager" name="territorial_manager" placeholder="Nombre del responsable" />
              </div>
            </CollapsibleSection>

            {/* F. Campos estratégicos Colombia */}
            <CollapsibleSection title="Campos estratégicos (Colombia)">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="referred_by">Líder que lo refiere</Label>
                  <Input id="referred_by" name="referred_by" placeholder="Ana Gómez" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobilizes_count">Votos que moviliza</Label>
                  <Input id="mobilizes_count" name="mobilizes_count" type="number" min="0" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="main_need">Necesidad principal</Label>
                  <Input id="main_need" name="main_need" placeholder="Empleo, salud, vivienda..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="economic_sector">Sector económico</Label>
                  <Input id="economic_sector" name="economic_sector" placeholder="Transporte, comercio..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_program">Beneficiario de programa</Label>
                <Input id="beneficiary_program" name="beneficiary_program" placeholder="Familias en acción, Ser Pilo Paga..." />
              </div>
            </CollapsibleSection>
          </div>

          {/* ── Right column (sidebar) ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <Select name="status">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Etiquetas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Input name="tags" placeholder="lider_juvenil, madre_cabeza, comerciante" />
                <p className="text-xs text-muted-foreground">Separadas por comas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  name="notes"
                  rows={5}
                  placeholder="Observaciones sobre el contacto..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit">Guardar contacto</Button>
          <Link href="/dashboard/contacts">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
