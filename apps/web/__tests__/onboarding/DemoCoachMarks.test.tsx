import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockOnboardingState = vi.fn()
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: (...args: unknown[]) => mockOnboardingState(...args),
}))

let mockPathname = '/dashboard'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

// Mock localStorage for CoachMark
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  },
})

import { DemoCoachMarks } from '@/components/onboarding/DemoCoachMarks'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DemoCoachMarks', () => {
  it('renders nothing when not in demo', () => {
    mockOnboardingState.mockReturnValue({ isDemo: false, isLoading: false })
    mockPathname = '/dashboard/canvassing'
    const { container } = render(<DemoCoachMarks tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing on non-configured routes', () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, isLoading: false })
    mockPathname = '/dashboard/contacts'
    const { container } = render(<DemoCoachMarks tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders canvassing coach mark on /dashboard/canvassing', async () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, isLoading: false })
    mockPathname = '/dashboard/canvassing'
    render(<DemoCoachMarks tenantId="t-1" />)

    await waitFor(() => {
      expect(screen.getByText('Mapa de Territorios')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('renders AI coach mark on /dashboard/ai', async () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, isLoading: false })
    mockPathname = '/dashboard/ai'
    render(<DemoCoachMarks tenantId="t-1" />)

    await waitFor(() => {
      expect(screen.getByText('Centro de Inteligencia')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('renders calendar coach mark on /dashboard/calendar', async () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, isLoading: false })
    mockPathname = '/dashboard/calendar'
    render(<DemoCoachMarks tenantId="t-1" />)

    await waitFor(() => {
      expect(screen.getByText('Calendario Electoral')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('renders nothing when loading', () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, isLoading: true })
    mockPathname = '/dashboard/canvassing'
    const { container } = render(<DemoCoachMarks tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })
})
