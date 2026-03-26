'use client'

import { useState, useEffect, useCallback } from 'react'
import { GeoSelector } from '@/components/perfil/GeoSelector'

/* DANE code → department name (must match GeoSelector's DEPT_NAMES) */
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

/* Reverse: name → code for pre-populating from existing contact data */
const DEPT_CODES: Record<string, string> = Object.fromEntries(
  Object.entries(DEPT_NAMES).map(([code, name]) => [name, code])
)

interface Ciudad {
  municipio_codigo: string
  municipio_nombre: string
  departamento_codigo: string
}

interface GeoData {
  ciudades: Ciudad[]
}

interface Props {
  defaultDepartment?: string | null
  defaultMunicipality?: string | null
  defaultCommune?: string | null
  defaultBarrio?: string | null
}

export function ContactGeoSelector({
  defaultDepartment,
  defaultMunicipality,
  defaultCommune,
  defaultBarrio,
}: Props) {
  const [geoData, setGeoData] = useState<GeoData | null>(null)

  // Resolved name values for hidden form inputs
  const [departmentName, setDepartmentName] = useState(defaultDepartment ?? '')
  const [municipalityName, setMunicipalityName] = useState(defaultMunicipality ?? '')
  const [communeName, setCommuneName] = useState(defaultCommune ?? '')
  const [barrioName, setBarrioName] = useState(defaultBarrio ?? '')

  // Code values for GeoSelector (resolved from defaults)
  const [deptCode, setDeptCode] = useState<string | null>(null)
  const [muniCode, setMuniCode] = useState<string | null>(null)
  const [initialResolved, setInitialResolved] = useState(false)

  // Load geo data for reverse lookups
  useEffect(() => {
    fetch('/geo/colombia.json')
      .then(r => r.json())
      .then((data: GeoData) => {
        setGeoData(data)

        // Reverse resolve: department name → code
        if (defaultDepartment) {
          const code = DEPT_CODES[defaultDepartment] ?? null
          setDeptCode(code)

          // Reverse resolve: municipality name → code
          if (code && defaultMunicipality && data.ciudades) {
            const city = data.ciudades.find(
              c => c.departamento_codigo === code && c.municipio_nombre === defaultMunicipality
            )
            setMuniCode(city?.municipio_codigo ?? null)
          }
        }
        setInitialResolved(true)
      })
      .catch(() => setInitialResolved(true))
  }, [defaultDepartment, defaultMunicipality])

  const handleChange = useCallback((values: {
    department_code: string | null
    municipality_code: string | null
    locality_name: string | null
    neighborhood_name: string | null
  }) => {
    // Resolve department code → name
    setDepartmentName(values.department_code ? (DEPT_NAMES[values.department_code] ?? '') : '')

    // Resolve municipality code → name from geo data
    if (values.municipality_code && geoData) {
      const city = geoData.ciudades.find(c => c.municipio_codigo === values.municipality_code)
      setMunicipalityName(city?.municipio_nombre ?? '')
    } else {
      setMunicipalityName('')
    }

    setCommuneName(values.locality_name ?? '')
    setBarrioName(values.neighborhood_name ?? '')

    // Keep codes in sync for GeoSelector
    setDeptCode(values.department_code)
    setMuniCode(values.municipality_code)
  }, [geoData])

  // Wait for initial reverse resolution before rendering GeoSelector
  if (!initialResolved) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
    </div>
  }

  return (
    <>
      <GeoSelector
        departmentCode={deptCode}
        municipalityCode={muniCode}
        localityName={defaultCommune ?? null}
        neighborhoodName={defaultBarrio ?? null}
        onChange={handleChange}
      />
      {/* Hidden inputs for FormData submission */}
      <input type="hidden" name="department" value={departmentName} />
      <input type="hidden" name="municipality" value={municipalityName} />
      <input type="hidden" name="commune" value={communeName} />
      <input type="hidden" name="district_barrio" value={barrioName} />
    </>
  )
}
