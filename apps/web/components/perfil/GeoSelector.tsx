'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeoData {
  metadata: Record<string, unknown>
  cities: Record<string, CityData>
}

interface CityData {
  [key: string]: unknown
}

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

  // Extract city names from geo data
  const cities = geoData ? Object.keys(geoData.cities).sort() : []

  // Extract localities for selected city
  const localities = geoData && municipality
    ? Object.keys(geoData.cities[municipality] ?? {}).filter(k => k !== 'metadata').sort()
    : []

  // Extract neighborhoods for selected locality
  const neighborhoods = geoData && municipality && locality
    ? (() => {
        const cityData = geoData.cities[municipality]
        if (!cityData || !cityData[locality]) return []
        const locData = cityData[locality]
        if (Array.isArray(locData)) return (locData as string[]).sort()
        if (typeof locData === 'object' && locData !== null) {
          return Object.keys(locData).sort()
        }
        return []
      })()
    : []

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
          {/* Colombia departments - using cities as proxy since geo data is city-based */}
          <option value="bogota">Bogotá D.C.</option>
          <option value="antioquia">Antioquia</option>
          <option value="valle">Valle del Cauca</option>
          <option value="atlantico">Atlántico</option>
          <option value="santander">Santander</option>
          <option value="bolivar">Bolívar</option>
          <option value="cundinamarca">Cundinamarca</option>
          <option value="norte_santander">Norte de Santander</option>
          <option value="tolima">Tolima</option>
          <option value="risaralda">Risaralda</option>
          <option value="caldas">Caldas</option>
          <option value="nariño">Nariño</option>
          <option value="meta">Meta</option>
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
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Localidad</label>
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
        <label className="text-sm font-medium text-slate-700 mb-1 block">Barrio</label>
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
