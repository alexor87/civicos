'use client'

import dynamic from 'next/dynamic'
import type { ColorMode, ContactPoint } from './MapFilterPanel'

const TerritoryMapInner = dynamic(
  () => import('./TerritoryMap').then(m => m.TerritoryMap),
  { ssr: false, loading: () => <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: '100%', minHeight: '500px' }} /> }
)

interface Territory {
  id: string
  name: string
  color: string
  status: string
  geojson: object | null
}

interface GeoUnit {
  id: string
  name: string
  type: string
  geojson: object
}

interface Props {
  territories: Territory[]
  height?: string
  interactive?: boolean
  coverageData?: Record<string, number>
  visitData?: Record<string, { visits: number; estimated: number }>
  geoUnits?: GeoUnit[]
  contactPoints?: ContactPoint[]
  defaultCenter?: [number, number]
  defaultZoom?: number
  colorMode?: ColorMode
}

export function TerritoryMapDynamic(props: Props) {
  return <TerritoryMapInner {...props} />
}
