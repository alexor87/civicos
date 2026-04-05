import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthLayout } from '@/components/auth/AuthLayout'

describe('AuthLayout', () => {
  it('renders the Scrutix logo text', () => {
    render(<AuthLayout tagline="Test tagline"><div /></AuthLayout>)
    expect(screen.getByText('Scrutix')).toBeInTheDocument()
  })

  it('renders the tagline prop', () => {
    render(<AuthLayout tagline="Explora gratis"><div /></AuthLayout>)
    expect(screen.getByText('Explora gratis')).toBeInTheDocument()
  })

  it('renders all four feature bullets', () => {
    render(<AuthLayout tagline="x"><div /></AuthLayout>)
    expect(screen.getByText(/CRM de contactos/i)).toBeInTheDocument()
    expect(screen.getByText(/Canvassing coordinado/i)).toBeInTheDocument()
    expect(screen.getByText(/Analítica electoral/i)).toBeInTheDocument()
    expect(screen.getByText(/Agentes IA/i)).toBeInTheDocument()
  })

  it('renders the footer text', () => {
    render(<AuthLayout tagline="x"><div /></AuthLayout>)
    expect(screen.getByText(/plataforma electoral inteligente/i)).toBeInTheDocument()
  })

  it('renders children in the right panel', () => {
    render(<AuthLayout tagline="x"><div data-testid="child-content">form</div></AuthLayout>)
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })
})
