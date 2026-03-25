import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PasswordStrengthBar } from '@/components/perfil/PasswordStrengthBar'

describe('PasswordStrengthBar', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthBar password="" />)
    expect(container.innerHTML).toBe('')
  })

  it('shows "Débil" for a weak password', () => {
    render(<PasswordStrengthBar password="abc" />)
    expect(screen.getByText('Débil')).toBeInTheDocument()
  })

  it('shows "Fuerte" for a strong password', () => {
    render(<PasswordStrengthBar password="StrongPass1!" />)
    expect(screen.getByText(/fuerte/i)).toBeInTheDocument()
  })

  it('shows requirement checklist', () => {
    render(<PasswordStrengthBar password="test" />)
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Al menos 1 mayúscula')).toBeInTheDocument()
    expect(screen.getByText('Al menos 1 número')).toBeInTheDocument()
  })

  it('marks met requirements with checkmark', () => {
    render(<PasswordStrengthBar password="Abcdefgh" />)
    // 8+ chars = met, uppercase = met, number = not met
    const items = screen.getAllByRole('listitem')
    expect(items[0].textContent).toContain('✓') // 8 chars
    expect(items[1].textContent).toContain('✓') // uppercase
    expect(items[2].textContent).toContain('○') // number
  })
})
