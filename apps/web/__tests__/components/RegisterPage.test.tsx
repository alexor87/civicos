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

async function fillStep1() {
  await userEvent.type(screen.getByLabelText(/nombre de la organización/i), 'Mi Org')
  await userEvent.type(screen.getByLabelText(/tu nombre completo/i), 'Juan García')
  await userEvent.type(screen.getByLabelText(/email/i), 'juan@test.com')
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123')
}

describe('RegisterPage', () => {
  it('shows step 1 by default', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Tu organización')).toBeInTheDocument()
  })

  it('shows progress indicator "Paso 1 de 2" on step 1', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument()
  })

  it('shows org name and email fields on step 1', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/nombre de la organización/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('advances to step 2 when clicking Siguiente', async () => {
    render(<RegisterPage />)
    await fillStep1()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Tu primera campaña')).toBeInTheDocument()
  })

  it('shows progress indicator "Paso 2 de 2" on step 2', async () => {
    render(<RegisterPage />)
    await fillStep1()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument()
  })

  it('shows a Volver button on step 2', async () => {
    render(<RegisterPage />)
    await fillStep1()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
  })

  it('goes back to step 1 when clicking Volver', async () => {
    render(<RegisterPage />)
    await fillStep1()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(screen.getByText('Tu organización')).toBeInTheDocument()
  })

  it('shows campaign name field on step 2', async () => {
    render(<RegisterPage />)
    await fillStep1()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByLabelText(/nombre de la campaña/i)).toBeInTheDocument()
  })

  it('auto-generates slug from org name', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByLabelText(/nombre de la organización/i), 'Mi Partido')
    const slugInput = screen.getByPlaceholderText('mi-org')
    expect((slugInput as HTMLInputElement).value).toBe('mi-partido')
  })

  it('shows error message when registration fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'El subdominio ya existe' }),
    })
    render(<RegisterPage />)
    await fillStep1()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.type(screen.getByLabelText(/nombre de la campaña/i), 'Campaña Test')
    await userEvent.click(screen.getByRole('button', { name: /crear mi campaña/i }))
    expect(await screen.findByText('El subdominio ya existe')).toBeInTheDocument()
  })
})
