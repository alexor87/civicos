import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useFeature, useFeatureValue } from '@/lib/features/use-feature'
import { FeaturesProvider } from '@/components/providers/FeaturesProvider'
import type { PlanName } from '@/lib/features/feature-keys'

function createWrapper(features: Record<string, unknown>, plan: PlanName = 'pro') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FeaturesProvider features={features} plan={plan}>
        {children}
      </FeaturesProvider>
    )
  }
}

describe('useFeature()', () => {
  it('returns true for a boolean feature set to true', () => {
    const wrapper = createWrapper({ territory_map: true })
    const { result } = renderHook(() => useFeature('territory_map'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns false for a boolean feature set to false', () => {
    const wrapper = createWrapper({ territory_map: false })
    const { result } = renderHook(() => useFeature('territory_map'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns false for a missing/undefined feature', () => {
    const wrapper = createWrapper({})
    const { result } = renderHook(() => useFeature('territory_map'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns false for a null feature', () => {
    const wrapper = createWrapper({ territory_map: null })
    const { result } = renderHook(() => useFeature('territory_map'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns true for a numeric feature > 0', () => {
    const wrapper = createWrapper({ contact_limit: 500 })
    const { result } = renderHook(() => useFeature('contact_limit'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns true for a numeric feature = -1 (unlimited)', () => {
    const wrapper = createWrapper({ contact_limit: -1 })
    const { result } = renderHook(() => useFeature('contact_limit'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns false for a numeric feature = 0', () => {
    const wrapper = createWrapper({ contact_limit: 0 })
    const { result } = renderHook(() => useFeature('contact_limit'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns true for string "true"', () => {
    const wrapper = createWrapper({ territory_map: 'true' })
    const { result } = renderHook(() => useFeature('territory_map'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns false for string "false"', () => {
    const wrapper = createWrapper({ territory_map: 'false' })
    const { result } = renderHook(() => useFeature('territory_map'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns true for a non-empty array', () => {
    const wrapper = createWrapper({ ai_providers: ['openai', 'anthropic'] })
    const { result } = renderHook(() => useFeature('ai_providers'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns false for an empty array', () => {
    const wrapper = createWrapper({ ai_providers: [] })
    const { result } = renderHook(() => useFeature('ai_providers'), { wrapper })
    expect(result.current).toBe(false)
  })
})

describe('useFeatureValue()', () => {
  it('returns the boolean value for a boolean feature', () => {
    const wrapper = createWrapper({ territory_map: true })
    const { result } = renderHook(() => useFeatureValue('territory_map'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns the numeric value for a numeric feature', () => {
    const wrapper = createWrapper({ contact_limit: 1000 })
    const { result } = renderHook(() => useFeatureValue('contact_limit'), { wrapper })
    expect(result.current).toBe(1000)
  })

  it('returns the array value for an array feature', () => {
    const wrapper = createWrapper({ ai_providers: ['openai', 'anthropic'] })
    const { result } = renderHook(() => useFeatureValue('ai_providers'), { wrapper })
    expect(result.current).toEqual(['openai', 'anthropic'])
  })

  it('returns null for a missing feature', () => {
    const wrapper = createWrapper({})
    const { result } = renderHook(() => useFeatureValue('contact_limit'), { wrapper })
    expect(result.current).toBeNull()
  })

  it('returns null for a null feature', () => {
    const wrapper = createWrapper({ contact_limit: null })
    const { result } = renderHook(() => useFeatureValue('contact_limit'), { wrapper })
    expect(result.current).toBeNull()
  })
})
