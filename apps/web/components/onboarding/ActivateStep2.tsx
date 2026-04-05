'use client'

import { GeoSelector } from '@/components/perfil/GeoSelector'

interface ActivateStep2Data {
  departmentCode: string | null
  municipalityCode: string | null
  departmentName: string
  municipalityName: string
}

interface Props {
  data: ActivateStep2Data
  onChange: (data: ActivateStep2Data) => void
}

export function ActivateStep2({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Territorio</h2>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona el departamento y municipio de tu campaña
        </p>
      </div>

      <GeoSelector
        departmentCode={data.departmentCode}
        municipalityCode={data.municipalityCode}
        localityName={null}
        neighborhoodName={null}
        onChange={values => {
          onChange({
            departmentCode: values.department_code,
            municipalityCode: values.municipality_code,
            departmentName: '', // Will be resolved from the selector display
            municipalityName: '',
          })
        }}
      />

      {data.departmentCode && data.municipalityCode && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-sm text-emerald-700">
            Tu campaña se configurará para este municipio. Podrás ajustar zonas y territorios después.
          </p>
        </div>
      )}
    </div>
  )
}
