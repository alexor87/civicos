'use client'

import dynamic from 'next/dynamic'

const DrawMapInner = dynamic(
  () => import('./DrawMap').then(m => m.DrawMap),
  { ssr: false, loading: () => <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: '400px' }} /> }
)

interface Props {
  height?: string
  color?: string
  initialGeoJson?: object | null
}

export function DrawMapDynamic(props: Props) {
  return <DrawMapInner {...props} />
}
