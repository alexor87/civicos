import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiNotConfiguredBanner } from '@/components/ui/AiNotConfiguredBanner'

describe('AiNotConfiguredBanner', () => {
  it('renders the warning message', () => {
    render(<AiNotConfiguredBanner />)
    expect(screen.getByText(/modelo de ia no configurado/i)).toBeInTheDocument()
  })

  it('renders a link to Integrations settings', () => {
    render(<AiNotConfiguredBanner />)
    const link = screen.getByRole('link', { name: /configura tu modelo de ia/i })
    expect(link).toHaveAttribute('href', '/dashboard/settings?tab=integrations')
  })

  it('applies custom className', () => {
    const { container } = render(<AiNotConfiguredBanner className="mt-4" />)
    expect(container.firstChild).toHaveClass('mt-4')
  })
})
