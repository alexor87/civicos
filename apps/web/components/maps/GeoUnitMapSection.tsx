'use client'

import { useState } from 'react'
import { DrawMapDynamic } from './DrawMapDynamic'
import { MapPin } from 'lucide-react'

interface GeoUnit {
  id: string
  name: string
  type: string
  geojson: object
}

interface Props {
  geoUnits: GeoUnit[]
  height?: string
  color?: string
}

export function GeoUnitMapSection({ geoUnits, height = '540px', color = '#1A6FE8' }: Props) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [mapKey, setMapKey] = useState(0)

  const selectedUnit = geoUnits.find(u => u.id === selectedId)

  function handleSelect(id: string) {
    setSelectedId(id)
    // Force re-mount of DrawMap so it picks up the new initialGeoJson
    setMapKey(k => k + 1)
  }

  return (
    <div className="space-y-3">
      {geoUnits.length > 0 && (
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#6a737d] shrink-0" />
          <select
            value={selectedId}
            onChange={e => handleSelect(e.target.value)}
            className="flex-1 h-8 rounded border border-[#dcdee6] bg-white px-2 text-xs text-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-[#2960ec]/30 focus:border-[#2960ec] transition-colors"
          >
            <option value="">— Prefill desde unidad geográfica —</option>
            {geoUnits.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.type})
              </option>
            ))}
          </select>
        </div>
      )}

      <DrawMapDynamic
        key={mapKey}
        height={height}
        color={color}
        initialGeoJson={selectedUnit?.geojson ?? null}
      />
    </div>
  )
}
