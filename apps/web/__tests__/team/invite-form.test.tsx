import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// The invite page is a Server Component using a form action.
// We test the rendered HTML structure directly.
// Import as a static render via a lightweight wrapper.

vi.mock('../../../app/dashboard/team/actions', () => ({
  inviteTeamMember:        vi.fn(),
  promoteContactToMember:  vi.fn(),
}))

// Since InviteMemberPage is a Server Component (no 'use client'),
// we test it by importing and rendering with vitest + jsdom.
import InviteMemberPage from '@/app/dashboard/team/invite/page'

describe('InviteMemberPage — formulario de invitación', () => {

  it('renderiza el campo nombre completo', () => {
    render(<InviteMemberPage />)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
  })

  it('renderiza el campo email como requerido', () => {
    render(<InviteMemberPage />)
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('renderiza el campo teléfono (no requerido)', () => {
    render(<InviteMemberPage />)
    const phoneInput = screen.getByLabelText(/teléfono/i)
    expect(phoneInput).toBeInTheDocument()
    expect(phoneInput).not.toHaveAttribute('required')
  })

  it('renderiza el selector de rol', () => {
    render(<InviteMemberPage />)
    // The Select component renders a hidden input or button with the label
    expect(screen.getByText(/seleccionar rol/i)).toBeInTheDocument()
  })

  it('renderiza el botón de submit', () => {
    render(<InviteMemberPage />)
    expect(screen.getByRole('button', { name: /agregar al equipo/i })).toBeInTheDocument()
  })

  it('renderiza el botón Cancelar con link al equipo', () => {
    render(<InviteMemberPage />)
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})
