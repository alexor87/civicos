import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the hook
const mockOnboardingState = vi.fn()
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: (...args: unknown[]) => mockOnboardingState(...args),
}))

import { DemoBanner } from '@/components/onboarding/DemoBanner'

const BASE_STATE = {
  isDemo: false,
  isPendingApproval: false,
  daysInDemo: 0,
  rejectionReason: null,
  isLoading: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DemoBanner', () => {
  it('renders nothing when loading', () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isLoading: true })
    const { container } = render(<DemoBanner tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when active (not demo, not pending)', () => {
    mockOnboardingState.mockReturnValue(BASE_STATE)
    const { container } = render(<DemoBanner tenantId="t-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders discrete banner when in demo (days 1-3)', () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isDemo: true, daysInDemo: 2 })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.getByText('Explorando con datos de ejemplo')).toBeInTheDocument()
    expect(screen.getByText(/activar mi campaña real/i)).toBeInTheDocument()
  })

  it('renders urgent banner after 4+ days', () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isDemo: true, daysInDemo: 5 })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.getByText(/llevas 5 días/i)).toBeInTheDocument()
  })

  it('can be dismissed in non-urgent mode', async () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isDemo: true, daysInDemo: 1 })
    render(<DemoBanner tenantId="t-1" />)
    const closeBtn = screen.getByLabelText('Cerrar banner')
    await userEvent.click(closeBtn)
    expect(screen.queryByText('Explorando con datos de ejemplo')).not.toBeInTheDocument()
  })

  it('cannot be dismissed in urgent mode', () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isDemo: true, daysInDemo: 5 })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.queryByLabelText('Cerrar banner')).not.toBeInTheDocument()
  })

  it('has link to activation wizard', () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isDemo: true, daysInDemo: 1 })
    render(<DemoBanner tenantId="t-1" />)
    const link = screen.getByText(/activar mi campaña real/i).closest('a')
    expect(link).toHaveAttribute('href', '/onboarding/activate')
  })

  it('renders pending approval banner (blue, no action)', () => {
    mockOnboardingState.mockReturnValue({ ...BASE_STATE, isPendingApproval: true })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.getByText(/en revisión/i)).toBeInTheDocument()
    expect(screen.queryByText(/activar mi campaña real/i)).not.toBeInTheDocument()
  })

  it('renders rejection banner with reason and edit link', () => {
    mockOnboardingState.mockReturnValue({
      ...BASE_STATE,
      isDemo: true,
      rejectionReason: 'Faltan datos del candidato',
    })
    render(<DemoBanner tenantId="t-1" />)
    expect(screen.getByText(/rechazada/i)).toBeInTheDocument()
    expect(screen.getByText(/faltan datos del candidato/i)).toBeInTheDocument()
    const link = screen.getByText(/editar y reenviar/i).closest('a')
    expect(link).toHaveAttribute('href', '/onboarding/activate')
  })
})
