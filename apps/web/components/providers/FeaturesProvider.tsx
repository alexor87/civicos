'use client'

import { createContext } from 'react'
import type { PlanName } from '@/lib/features/feature-keys'

export interface FeaturesContextValue {
  features: Record<string, unknown>
  plan: PlanName
}

export const FeaturesContext = createContext<FeaturesContextValue>({
  features: {},
  plan: 'esencial',
})

interface Props {
  features: Record<string, unknown>
  plan: PlanName
  children: React.ReactNode
}

export function FeaturesProvider({ features, plan, children }: Props) {
  return (
    <FeaturesContext.Provider value={{ features, plan }}>
      {children}
    </FeaturesContext.Provider>
  )
}
