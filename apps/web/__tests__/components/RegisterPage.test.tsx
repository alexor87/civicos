import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

global.fetch = vi.fn()

import RegisterPage from '@/app/(auth)/register/page'

beforeEach(() => vi.clearAllMocks())

async function fillForm() {
  await userEvent.type(screen.getByLabelText(/nombre de tu organización/i), 'Mi Org')
  await userEvent.type(screen.getByLabelText(/email/i), 'juan@test.com')
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123')
}

describe('RegisterPage', () => {
  it('shows the simplified registration form', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/empieza a organizar/i)).toBeInTheDocument()
  })

  it('shows org name, email, and password fields', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/nombre de tu organización/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('has a single submit button (no multi-step)', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /crear cuenta gratis/i })).toBeInTheDocument()
    expect(screen.queryByText(/siguiente/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/paso.*de/i)).not.toBeInTheDocument()
  })

  it('shows error message when registration fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email ya registrado' }),
    })
    render(<RegisterPage />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta gratis/i }))
    expect(await screen.findByText('Email ya registrado')).toBeInTheDocument()
  })

  it('redirects to /welcome on successful registration', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, tenantId: 'tenant-1' }),
    })
    mockSignIn.mockResolvedValueOnce({ error: null })

    render(<RegisterPage />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta gratis/i }))

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/welcome')
    })
  })

  it('shows login link', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/ya tienes cuenta/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /inicia sesión/i })).toHaveAttribute('href', '/login')
  })
})
