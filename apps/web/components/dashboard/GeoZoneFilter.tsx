'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface GeoZoneFilterProps {
  departments: string[]
  municipiosByDept: Record<string, string[]>
  currentDept: string
  currentMunicipality: string
}

export function GeoZoneFilter({ departments, municipiosByDept, currentDept, currentMunicipality }: GeoZoneFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildUrl = useCallback((dept: string, mun: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (dept) params.set('department', dept); else params.delete('department')
    if (mun)  params.set('municipality', mun); else params.delete('municipality')
    return `/dashboard/contacts?${params.toString()}`
  }, [searchParams])

  const availableMunicipios = currentDept ? (municipiosByDept[currentDept] ?? []) : []

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentDept}
        onChange={e => router.push(buildUrl(e.target.value, ''))}
        className="h-8 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Departamento</option>
        {departments.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {availableMunicipios.length > 0 && (
        <select
          value={currentMunicipality}
          onChange={e => router.push(buildUrl(currentDept, e.target.value))}
          className="h-8 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Municipio</option>
          {availableMunicipios.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      )}

      {(currentDept || currentMunicipality) && (
        <button
          onClick={() => router.push(buildUrl('', ''))}
          className="text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Limpiar
        </button>
      )}
    </div>
  )
}
