import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthLayout } from '@/components/auth/AuthLayout'

describe('AuthLayout', () => {
  it('renders the CivicOS logo text', () => {
    render(<AuthLayout tagline="Test tagline"><div /></AuthLayout>)
    expect(screen.getByText('CivicOS')).toBeInTheDocument()
  })

  it('renders the tagline prop', () => {
    render(<AuthLayout tagline="14 días gratis"><div /></AuthLayout>)
    expect(screen.getByText('14 días gratis')).toBeInTheDocument()
  })

  it('renders all three feature bullets', () => {
    render(<AuthLayout tagline="x"><div /></AuthLayout>)
    expect(screen.getByText(/CRM de contactos/i)).toBeInTheDocument()
    expect(screen.getByText(/Canvassing coordinado/i)).toBeInTheDocument()
    expect(screen.getByText(/Analítica electoral/i)).toBeInTheDocument()
  })

  it('renders the social proof footer', () => {
    render(<AuthLayout tagline="x"><div /></AuthLayout>)
    expect(screen.getByText(/50 organizaciones/i)).toBeInTheDocument()
  })

  it('renders children in the right panel', () => {
    render(<AuthLayout tagline="x"><div data-testid="child-content">form</div></AuthLayout>)
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })
})
