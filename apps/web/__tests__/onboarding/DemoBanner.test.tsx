import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the hook
const mockOnboardingState = vi.fn()
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: (...args: unknown[]) => mockOnboardingState(...args),
}))

import { DemoBanner } from '@/components/onboarding/DemoBanner'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DemoBanner', () => {
  it('renders nothing when loading', () => {
    mockOnboardingState.mockReturnValue({ isDemo: false, daysInDemo: 0, isLoading: true })
    const { container } = render(<DemoBanner tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when not in demo', () => {
    mockOnboardingState.mockReturnValue({ isDemo: false, daysInDemo: 0, isLoading: false })
    const { container } = render(<DemoBanner tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders discrete banner when in demo (days 1-3)', () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, daysInDemo: 2, isLoading: false })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.getByText('Explorando con datos de ejemplo')).toBeInTheDocument()
    expect(screen.getByText(/activar mi campaña real/i)).toBeInTheDocument()
  })

  it('renders urgent banner after 4+ days', () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, daysInDemo: 5, isLoading: false })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.getByText(/llevas 5 días/i)).toBeInTheDocument()
  })

  it('can be dismissed in non-urgent mode', async () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, daysInDemo: 1, isLoading: false })
    render(<DemoBanner tenantId="t-1" />)
    const closeBtn = screen.getByLabelText('Cerrar banner')
    await userEvent.click(closeBtn)
    expect(screen.queryByText('Explorando con datos de ejemplo')).not.toBeInTheDocument()
  })

  it('cannot be dismissed in urgent mode', () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, daysInDemo: 5, isLoading: false })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.queryByLabelText('Cerrar banner')).not.toBeInTheDocument()
  })

  it('has link to activation wizard', () => {
    mockOnboardingState.mockReturnValue({ isDemo: true, daysInDemo: 1, isLoading: false })
    render(<DemoBanner tenantId="t-1" />)
    const link = screen.getByText(/activar mi campaña real/i).closest('a')
    expect(link).toHaveAttribute('href', '/onboarding/activate')
  })
})
