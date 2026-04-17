'use client'

import { useState, useEffect, useMemo } from 'react'

interface GeoData {
  municipio_codigo: string
  municipio_nombre: string
  departamento_codigo: string
}

// DANE department codes
const DEPARTMENTS: Record<string, string> = {
  '05': 'Antioquia', '08': 'Atlántico', '11': 'Bogotá D.C.',
  '13': 'Bolívar', '15': 'Boyacá', '17': 'Caldas',
  '18': 'Caquetá', '19': 'Cauca', '20': 'Cesar',
  '23': 'Córdoba', '25': 'Cundinamarca', '27': 'Chocó',
  '41': 'Huila', '44': 'La Guajira', '47': 'Magdalena',
  '50': 'Meta', '52': 'Nariño', '54': 'Norte de Santander',
  '63': 'Quindío', '66': 'Risaralda', '68': 'Santander',
  '70': 'Sucre', '73': 'Tolima', '76': 'Valle del Cauca',
  '81': 'Arauca', '85': 'Casanare', '86': 'Putumayo',
  '88': 'Archipiélago de San Andrés', '91': 'Amazonas',
  '94': 'Guainía', '95': 'Guaviare', '97': 'Vaupés', '99': 'Vichada',
}

interface MunicipalitySelectorProps {
  department: string
  municipality: string
  onDepartmentChange: (value: string) => void
  onMunicipalityChange: (value: string) => void
  errors?: { department?: string; municipality?: string }
}

export function MunicipalitySelector({
  department,
  municipality,
  onDepartmentChange,
  onMunicipalityChange,
  errors,
}: MunicipalitySelectorProps) {
  const [geoData, setGeoData] = useState<GeoData[]>([])

  useEffect(() => {
    fetch('/geo/colombia.json')
      .then((res) => res.json())
      .then(setGeoData)
      .catch(() => {})
  }, [])

  const sortedDepts = useMemo(
    () => Object.entries(DEPARTMENTS).sort(([, a], [, b]) => a.localeCompare(b)),
    []
  )

  const municipalities = useMemo(() => {
    if (!department || !geoData.length) return []
    return geoData
      .filter((g) => g.departamento_codigo === department)
      .sort((a, b) => a.municipio_nombre.localeCompare(b.municipio_nombre))
  }, [department, geoData])

  const handleDeptChange = (code: string) => {
    onDepartmentChange(code)
    onMunicipalityChange('')
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Departamento <span className="text-red-500">*</span>
        </label>
        <select
          value={department}
          onChange={(e) => handleDeptChange(e.target.value)}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
            errors?.department ? 'border-red-400' : 'border-slate-300'
          }`}
        >
          <option value="">Seleccione...</option>
          {sortedDepts.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        {errors?.department && (
          <p className="text-sm text-red-500 mt-1">{errors.department}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Municipio <span className="text-red-500">*</span>
        </label>
        <select
          value={municipality}
          onChange={(e) => onMunicipalityChange(e.target.value)}
          disabled={!department}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 ${
            errors?.municipality ? 'border-red-400' : 'border-slate-300'
          }`}
        >
          <option value="">Seleccione...</option>
          {municipalities.map((m) => (
            <option key={m.municipio_codigo} value={m.municipio_nombre}>
              {m.municipio_nombre}
            </option>
          ))}
        </select>
        {errors?.municipality && (
          <p className="text-sm text-red-500 mt-1">{errors.municipality}</p>
        )}
      </div>
    </div>
  )
}
