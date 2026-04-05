import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, FileText, Settings2, MapPin } from 'lucide-react'
import { GeoUnitMapSection } from '@/components/maps/GeoUnitMapSection'
import { updateTerritory } from '../../actions'

export default async function EditTerritoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, tenant_id')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) notFound()

  const { data: territory } = await supabase
    .from('territories')
    .select('*')
    .eq('id', id)
    .single()

  if (!territory) notFound()

  const { data: geoUnitsRaw } = await supabase
    .from('geo_units')
    .select('id, name, type, geojson')
    .eq('campaign_id', campaignId)
    .not('geojson', 'is', null)
    .order('type')
    .order('name')

  const geoUnits = (geoUnitsRaw ?? []).map(u => ({
    id: u.id as string,
    name: u.name as string,
    type: u.type as string,
    geojson: u.geojson as object,
  }))

  const boundUpdate = updateTerritory.bind(null, id)

  const deadlineValue = territory.deadline
    ? new Date(territory.deadline).toISOString().slice(0, 10)
    : ''

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* Page header */}
        <div>
          <Link href={`/dashboard/canvassing/territories/${id}`}>
            <Button variant="ghost" size="sm" className="-ml-2 text-[#6a737d] hover:text-[#1b1f23]">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver al territorio
            </Button>
          </Link>
          <div className="mt-3">
            <h1 className="text-2xl font-semibold text-[#1b1f23]">Editar territorio</h1>
            <p className="text-sm text-[#6a737d] mt-1">
              Modifica las propiedades o redibuja el polígono en el mapa
            </p>
          </div>
        </div>

        <form action={boundUpdate}>
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">

            {/* ── Left column: form sections ── */}
            <div className="space-y-4">

              {/* Section: Información básica */}
              <Card>
                <CardHeader className="pb-3 border-b border-[#dcdee6]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded bg-[#2960ec]/10 flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-[#2960ec]" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-[#1b1f23]">Información básica</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-[#1b1f23]">
                      Nombre del territorio <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={territory.name ?? ''}
                      placeholder="Ej: Barrio Centro, Sector Norte…"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-[#1b1f23]">
                      Descripción
                    </Label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={territory.description ?? ''}
                      placeholder="Notas sobre el área, características del sector, estrategia…"
                      className="w-full rounded border border-[#dcdee6] bg-white px-3 py-2.5 text-sm text-[#1b1f23] placeholder:text-[#6a737d] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30 focus:border-[#2960ec] resize-none transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section: Configuración */}
              <Card>
                <CardHeader className="pb-3 border-b border-[#dcdee6]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded bg-[#6f42c1]/10 flex items-center justify-center shrink-0">
                      <Settings2 className="h-3.5 w-3.5 text-[#6f42c1]" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-[#1b1f23]">Configuración</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-[#1b1f23]">Estado</Label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={territory.status ?? 'disponible'}
                        className="w-full h-10 rounded border border-[#dcdee6] bg-white px-3 text-sm text-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30 focus:border-[#2960ec] transition-colors"
                      >
                        <option value="disponible">Disponible</option>
                        <option value="asignado">Asignado</option>
                        <option value="en_progreso">En progreso</option>
                        <option value="completado">Completado</option>
                        <option value="archivado">Archivado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium text-[#1b1f23]">Prioridad</Label>
                      <select
                        id="priority"
                        name="priority"
                        defaultValue={territory.priority ?? 'media'}
                        className="w-full h-10 rounded border border-[#dcdee6] bg-white px-3 text-sm text-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30 focus:border-[#2960ec] transition-colors"
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimated_contacts" className="text-sm font-medium text-[#1b1f23]">
                        Contactos estimados
                      </Label>
                      <Input
                        id="estimated_contacts"
                        name="estimated_contacts"
                        type="number"
                        min="0"
                        defaultValue={territory.estimated_contacts ?? 0}
                        placeholder="0"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline" className="text-sm font-medium text-[#1b1f23]">Fecha límite</Label>
                      <Input
                        id="deadline"
                        name="deadline"
                        type="date"
                        defaultValue={deadlineValue}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm font-medium text-[#1b1f23]">Color identificador</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="color"
                        name="color"
                        type="color"
                        defaultValue={territory.color ?? '#1A6FE8'}
                        className="h-10 w-16 rounded border border-[#dcdee6] cursor-pointer p-1 bg-white"
                      />
                      <p className="text-xs text-[#6a737d] leading-relaxed">
                        Este color se usará para resaltar el polígono en el mapa
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <SubmitButton className="flex-1 h-10">Guardar cambios</SubmitButton>
                <Link href={`/dashboard/canvassing/territories/${id}`}>
                  <Button type="button" variant="outline" className="h-10 px-6">Cancelar</Button>
                </Link>
              </div>
            </div>

            {/* ── Right column: map ── */}
            <div className="sticky top-6">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 border-b border-[#dcdee6]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-[#28a745]/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-[#28a745]" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-[#1b1f23]">Delimitación geográfica</CardTitle>
                        <p className="text-xs text-[#6a737d] mt-0.5">Redibuja o ajusta los vértices del polígono</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#6a737d] bg-muted border border-[#dcdee6] px-2 py-1 rounded-full">
                      Editable
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <GeoUnitMapSection
                    geoUnits={geoUnits}
                    height="500px"
                    color={territory.color ?? '#1A6FE8'}
                    initialGeoJson={territory.geojson as object | null}
                  />
                </CardContent>
              </Card>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
