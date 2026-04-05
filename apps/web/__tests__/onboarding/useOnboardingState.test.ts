import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

import { useOnboardingState } from '@/lib/hooks/useOnboardingState'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useOnboardingState', () => {
  it('returns loading state initially', () => {
    mockSingle.mockResolvedValue({ data: null })
    const { result } = renderHook(() => useOnboardingState('tenant-1'))
    expect(result.current.isLoading).toBe(true)
  })

  it('returns isDemo=true when stage is demo', async () => {
    mockSingle.mockResolvedValue({
      data: { stage: 'demo', demo_started_at: new Date().toISOString() },
    })

    const { result } = renderHook(() => useOnboardingState('tenant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isDemo).toBe(true)
    expect(result.current.stage).toBe('demo')
  })

  it('returns isDemo=false when stage is active', async () => {
    mockSingle.mockResolvedValue({
      data: { stage: 'active', demo_started_at: null },
    })

    const { result } = renderHook(() => useOnboardingState('tenant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isDemo).toBe(false)
    expect(result.current.stage).toBe('active')
  })

  it('calculates daysInDemo correctly', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    mockSingle.mockResolvedValue({
      data: { stage: 'demo', demo_started_at: threeDaysAgo },
    })

    const { result } = renderHook(() => useOnboardingState('tenant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.daysInDemo).toBe(3)
  })

  it('handles null tenantId gracefully', async () => {
    const { result } = renderHook(() => useOnboardingState(null))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isDemo).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('exposes isPendingApproval and rejectionReason', async () => {
    mockSingle.mockResolvedValue({
      data: { stage: 'demo', demo_started_at: null, rejection_reason: 'faltan datos' },
    })

    const { result } = renderHook(() => useOnboardingState('tenant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isPendingApproval).toBe(false)
    expect(result.current.rejectionReason).toBe('faltan datos')
  })

  it('sets isPendingApproval=true when stage is pending_approval', async () => {
    mockSingle.mockResolvedValue({
      data: { stage: 'pending_approval', demo_started_at: null, rejection_reason: null },
    })

    const { result } = renderHook(() => useOnboardingState('tenant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isPendingApproval).toBe(true)
    expect(result.current.isDemo).toBe(false)
  })

  it('handles missing onboarding_state record', async () => {
    mockSingle.mockResolvedValue({ data: null })

    const { result } = renderHook(() => useOnboardingState('tenant-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Defaults to 'active' (existing tenants without onboarding_state)
    expect(result.current.isDemo).toBe(false)
  })
})
