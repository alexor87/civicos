'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContactGeoSelector, type GeoValues } from '@/components/contacts/ContactGeoSelector'
import { useGeocoding } from '@/hooks/useGeocoding'
import { Loader2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react'
import type { ContactForm } from '@/lib/schemas/contact-form'
import type { GeocodingState, ManualPin } from '@/hooks/useGeocoding'

const GeocodingMap = dynamic(
  () => import('@/components/contacts/GeocodingMap').then(m => m.GeocodingMap),
  { ssr: false, loading: () => <div className="h-[200px] sm:h-[240px] bg-slate-100 rounded-lg animate-pulse" /> }
)

const COLOMBIA_CENTER = { lat: 4.5709, lng: -74.2973 }

export function StepLocation() {
  const { register, setValue, watch } = useFormContext<ContactForm>()
  const { state, manualPin, geocode, handleMapClick, handlePinDrag, finalCoords } = useGeocoding()

  const address = watch('address')
  const municipality = watch('municipality')
  const department = watch('department')

  const handleGeoChange = (values: GeoValues) => {
    setValue('department', values.department)
    setValue('municipality', values.municipality)
    setValue('commune', values.commune)
    setValue('district_barrio', values.district_barrio)
  }

  // Trigger geocoding when address or municipality changes
  useEffect(() => {
    if (address && municipality) {
      geocode(address, municipality, department)
    }
  }, [address, municipality, department]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync final coordinates to form
  useEffect(() => {
    if (finalCoords) {
      setValue('location_lat', finalCoords.lat)
      setValue('location_lng', finalCoords.lng)
      setValue('geocoding_status', finalCoords.source)
    } else {
      setValue('location_lat', null)
      setValue('location_lng', null)
      setValue('geocoding_status', 'pending')
    }
  }, [finalCoords, setValue])

  const mapCenter = state.status === 'success'
    ? { lat: state.lat, lng: state.lng }
    : state.status === 'approximate'
    ? state.center
    : COLOMBIA_CENTER

  return (
    <div className="space-y-5">
      <ContactGeoSelector
        defaultDepartment={watch('department') || null}
        defaultMunicipality={watch('municipality') || null}
        defaultCommune={watch('commune') || null}
        defaultBarrio={watch('district_barrio') || null}
        onGeoChange={handleGeoChange}
      />

      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" placeholder="Calle 80 #45-23" {...register('address')} />
      </div>

      {/* Map section */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          Ubicación en el mapa
        </Label>

        <GeocodingStatusBadge state={state} manualPin={manualPin} />

        {municipality ? (
          <GeocodingMap
            state={state}
            manualPin={manualPin}
            onMapClick={handleMapClick}
            onPinDrag={handlePinDrag}
            center={mapCenter}
          />
        ) : (
          <div className="h-[200px] sm:h-[240px] rounded-lg border border-dashed border-slate-300 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Selecciona un municipio para ver el mapa
            </p>
          </div>
        )}

        <GeocodingInstruction state={state} manualPin={manualPin} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="voting_place">Puesto de votación</Label>
          <Input id="voting_place" placeholder="IE San Javier" {...register('voting_place')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="voting_table">Mesa</Label>
          <Input id="voting_table" placeholder="001" {...register('voting_table')} />
        </div>
      </div>
    </div>
  )
}

function GeocodingStatusBadge({ state, manualPin }: { state: GeocodingState; manualPin: ManualPin }) {
  if (manualPin) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ubicación marcada manualmente
      </div>
    )
  }
  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Buscando dirección...
      </div>
    )
  }
  if (state.status === 'success') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {state.displayName}
      </div>
    )
  }
  if (state.status === 'approximate') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-700">
        <AlertCircle className="h-3.5 w-3.5" />
        No encontramos esta dirección exacta. Haz clic en el mapa para marcar la ubicación.
      </div>
    )
  }
  return null
}

function GeocodingInstruction({ state, manualPin }: { state: GeocodingState; manualPin: ManualPin }) {
  if (manualPin) return (
    <p className="text-xs text-muted-foreground">
      Arrastra el pin para ajustar la posición exacta.
    </p>
  )
  if (state.status === 'success') return (
    <p className="text-xs text-muted-foreground">
      ¿No es aquí? Arrastra el pin para corregir.
    </p>
  )
  if (state.status === 'approximate') return (
    <p className="text-xs text-muted-foreground">
      El cursor cambia a cruz (+) al pasar por el mapa. Haz clic en el lugar exacto.
    </p>
  )
  return null
}
