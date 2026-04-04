'use client'

import { useContext } from 'react'
import { FeaturesContext } from '@/components/providers/FeaturesProvider'
import type { FeatureKey, FeatureValueMap } from './feature-keys'

/**
 * Returns true/false for a boolean feature flag.
 * For numeric features, returns true if value > 0 or value === -1 (unlimited).
 */
export function useFeature(key: FeatureKey): boolean {
  const { features } = useContext(FeaturesContext)
  const val = features[key]
  if (val === undefined || val === null) return false
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  if (typeof val === 'string') return val === 'true'
  if (Array.isArray(val)) return val.length > 0
  return Boolean(val)
}

/**
 * Returns the typed value for a feature flag.
 * Use for numeric limits, enum arrays, etc.
 */
export function useFeatureValue<K extends FeatureKey>(key: K): FeatureValueMap[K] | null {
  const { features } = useContext(FeaturesContext)
  const val = features[key]
  if (val === undefined || val === null) return null
  return val as FeatureValueMap[K]
}
