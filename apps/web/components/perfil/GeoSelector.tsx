'use client'

import { useState, useEffect, useCallback } from 'react'

/* ── Tipos que reflejan la estructura real de colombia.json ── */

interface UPZ {
  codigo: string
  nombre: string
  barrios: string[]
}

interface Localidad {
  codigo: string
  nombre: string
  barrios?: (string | { nombre: string })[]
  upz?: UPZ[]
}

interface Corregimiento {
  codigo: string
  nombre: string
  veredas: string[]
}

interface Ciudad {
  municipio_codigo: string
  municipio_nombre: string
  departamento_codigo: string
  tipo_division_urbana: string
  localidades?: Localidad[]
  comunas?: Localidad[]
  corregimientos?: Corregimiento[]
}

interface GeoData {
  metadata: Record<string, unknown>
  ciudades: Ciudad[]
}

/* ── Mapeo código DANE → nombre departamento ── */

const DEPT_NAMES: Record<string, string> = {
  '05': 'Antioquia',
  '08': 'Atlántico',
  '11': 'Bogotá D.C.',
  '13': 'Bolívar',
  '17': 'Caldas',
  '50': 'Meta',
  '54': 'Norte de Santander',
  '63': 'Quindío',
  '66': 'Risaralda',
  '68': 'Santander',
  '73': 'Tolima',
  '76': 'Valle del Cauca',
}

/* ── Props ── */

interface Props {
  departmentCode: string | null
  municipalityCode: string | null
  localityName: string | null
  neighborhoodName: string | null
  onChange: (values: {
    department_code: string | null
    municipality_code: string | null
    locality_name: string | null
    neighborhood_name: string | null
  }) => void
}

export function GeoSelector({ departmentCode, municipalityCode, localityName, neighborhoodName, onChange }: Props) {
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [department, setDepartment] = useState(departmentCode ?? '')
  const [municipality, setMunicipality] = useState(municipalityCode ?? '')
  const [locality, setLocality] = useState(localityName ?? '')
  const [neighborhood, setNeighborhood] = useState(neighborhoodName ?? '')

  useEffect(() => {
    fetch('/geo/colombia.json')
      .then(r => r.json())
      .then((data: GeoData) => { setGeoData(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  /* ── Derivar opciones ── */

  // Departamentos únicos
  const departments = geoData
    ? [...new Map(geoData.ciudades.map(c => [c.departamento_codigo, DEPT_NAMES[c.departamento_codigo] ?? c.departamento_codigo])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
    : []

  // Municipios del departamento seleccionado
  const municipalities = geoData && department
    ? geoData.ciudades
        .filter(c => c.departamento_codigo === department)
        .sort((a, b) => a.municipio_nombre.localeCompare(b.municipio_nombre))
    : []

  // Localidades/comunas del municipio seleccionado
  const selectedCity = geoData && municipality
    ? geoData.ciudades.find(c => c.municipio_codigo === municipality)
    : null

  const divisionNames = selectedCity
    ? (selectedCity.localidades ?? selectedCity.comunas ?? []).map(l => l.nombre)
    : []
  const corrNames = selectedCity
    ? (selectedCity.corregimientos ?? []).map(c => c.nombre)
    : []
  const localities = [...divisionNames, ...corrNames].sort()

  // Barrios de la localidad/comuna, o veredas del corregimiento seleccionado
  const getBarrios = (): string[] => {
    if (!selectedCity || !locality) return []

    // Comunas/localidades
    const divs = selectedCity.localidades ?? selectedCity.comunas ?? []
    const div = divs.find(l => l.nombre === locality)
    if (div) {
      if (div.upz) return div.upz.flatMap(u => u.barrios).sort()
      if (div.barrios) return div.barrios.map(b => typeof b === 'string' ? b : b.nombre).sort()
    }

    // Corregimientos → veredas
    const corr = selectedCity.corregimientos?.find(c => c.nombre === locality)
    if (corr) return [...corr.veredas].sort()

    return []
  }

  const isCorregimiento = !!selectedCity?.corregimientos?.find(c => c.nombre === locality)

  const neighborhoods = getBarrios()

  /* ── Handlers ── */

  const handleChange = useCallback((field: string, value: string) => {
    let newDept = department
    let newMuni = municipality
    let newLoc = locality
    let newNeigh = neighborhood

    if (field === 'department') {
      newDept = value; newMuni = ''; newLoc = ''; newNeigh = ''
      setDepartment(value); setMunicipality(''); setLocality(''); setNeighborhood('')
    } else if (field === 'municipality') {
      newMuni = value; newLoc = ''; newNeigh = ''
      setMunicipality(value); setLocality(''); setNeighborhood('')
    } else if (field === 'locality') {
      newLoc = value; newNeigh = ''
      setLocality(value); setNeighborhood('')
    } else {
      newNeigh = value
      setNeighborhood(value)
    }

    onChange({
      department_code: newDept || null,
      municipality_code: newMuni || null,
      locality_name: newLoc || null,
      neighborhood_name: newNeigh || null,
    })
  }, [department, municipality, locality, neighborhood, onChange])

  /* ── Render ── */

  if (error) {
    return <p className="text-sm text-slate-400">Datos geográficos no disponibles</p>
  }

  const selectClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Departamento</label>
        <select
          value={department}
          onChange={e => handleChange('department', e.target.value)}
          disabled={loading}
          className={selectClass}
        >
          <option value="">Seleccionar...</option>
          {departments.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Municipio</label>
        <select
          value={municipality}
          onChange={e => handleChange('municipality', e.target.value)}
          disabled={loading || !department}
          className={selectClass}
        >
          <option value="">Seleccionar...</option>
          {municipalities.map(city => (
            <option key={city.municipio_codigo} value={city.municipio_codigo}>
              {city.municipio_nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">
          {corrNames.length > 0 && divisionNames.length > 0
            ? 'Comuna / Corregimiento'
            : selectedCity?.tipo_division_urbana === 'localidad' ? 'Localidad' : 'Comuna'}
        </label>
        <select
          value={locality}
          onChange={e => handleChange('locality', e.target.value)}
          disabled={loading || !municipality || localities.length === 0}
          className={selectClass}
        >
          <option value="">Seleccionar...</option>
          {localities.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">{isCorregimiento ? 'Vereda' : 'Barrio'}</label>
        <select
          value={neighborhood}
          onChange={e => handleChange('neighborhood', e.target.value)}
          disabled={loading || !locality || neighborhoods.length === 0}
          className={selectClass}
        >
          <option value="">Seleccionar...</option>
          {neighborhoods.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
