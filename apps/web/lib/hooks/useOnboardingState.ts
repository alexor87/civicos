'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = 'pending' | 'seeding' | 'demo' | 'activating' | 'active'

interface OnboardingState {
  stage: Stage
  daysInDemo: number
  isDemo: boolean
  isLoading: boolean
}

export function useOnboardingState(tenantId: string | null): OnboardingState {
  const [stage, setStage] = useState<Stage>('active')
  const [demoStartedAt, setDemoStartedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchState = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('onboarding_state')
      .select('stage, demo_started_at')
      .eq('tenant_id', tenantId)
      .single()

    if (data) {
      setStage(data.stage as Stage)
      setDemoStartedAt(data.demo_started_at)
    }
    setIsLoading(false)
  }, [tenantId, supabase])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  const daysInDemo = demoStartedAt
    ? Math.floor((Date.now() - new Date(demoStartedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    stage,
    daysInDemo,
    isDemo: stage === 'demo',
    isLoading,
  }
}
