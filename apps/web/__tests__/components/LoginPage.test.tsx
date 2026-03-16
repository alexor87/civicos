import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mocks
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockSignIn = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}))

import LoginPage from '@/app/(auth)/login/page'

beforeEach(() => vi.clearAllMocks())

describe('LoginPage', () => {
  it('renders the welcome heading', () => {
    render(<LoginPage />)
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('renders a link to register', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /regístrate/i })).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: 'Credenciales inválidas' } })
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('redirects to dashboard on successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'correct')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
  })
})
