'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContactGeoSelector, type GeoValues } from '@/components/contacts/ContactGeoSelector'
import type { ContactForm } from '@/lib/schemas/contact-form'

export function StepLocation() {
  const { register, setValue, watch } = useFormContext<ContactForm>()

  const handleGeoChange = (values: GeoValues) => {
    setValue('department', values.department)
    setValue('municipality', values.municipality)
    setValue('commune', values.commune)
    setValue('district_barrio', values.district_barrio)
  }

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
