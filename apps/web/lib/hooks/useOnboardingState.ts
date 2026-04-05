'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stage = 'pending' | 'seeding' | 'demo' | 'pending_approval' | 'activating' | 'active' | 'rejected'

interface OnboardingState {
  stage: Stage
  daysInDemo: number
  isDemo: boolean
  isPendingApproval: boolean
  rejectionReason: string | null
  isLoading: boolean
}

export function useOnboardingState(tenantId: string | null): OnboardingState {
  const [stage, setStage] = useState<Stage>('active')
  const [demoStartedAt, setDemoStartedAt] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchState = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('onboarding_state')
      .select('stage, demo_started_at, rejection_reason')
      .eq('tenant_id', tenantId)
      .single()

    if (data) {
      setStage(data.stage as Stage)
      setDemoStartedAt(data.demo_started_at)
      setRejectionReason(data.rejection_reason)
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
    isPendingApproval: stage === 'pending_approval',
    rejectionReason,
    isLoading,
  }
}
