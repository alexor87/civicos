import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ImpersonateButton } from '@/components/admin/ImpersonateButton'

const defaultProps = {
  tenantId: 'tenant-1',
  tenantName: 'Org Test',
  tenantStatus: 'active',
}

/** The DialogTrigger + asChild creates nested buttons. Pick the inner one with data-slot="button". */
function getTriggerButton() {
  return screen.getByText('Impersonar').closest('button[data-slot="button"]') as HTMLButtonElement
}

describe('ImpersonateButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('open', vi.fn())
    process.env.NEXT_PUBLIC_WEB_APP_URL = 'http://localhost:3000'
  })

  it('renders the button with "Impersonar" text', () => {
    render(<ImpersonateButton {...defaultProps} />)

    expect(screen.getByText('Impersonar')).toBeInTheDocument()
  })

  it('button is disabled when tenantStatus is cancelled', () => {
    render(<ImpersonateButton {...defaultProps} tenantStatus="cancelled" />)

    const btn = getTriggerButton()
    expect(btn).toBeDisabled()
  })

  it('button is enabled when tenantStatus is active', () => {
    render(<ImpersonateButton {...defaultProps} tenantStatus="active" />)

    const btn = getTriggerButton()
    expect(btn).toBeEnabled()
  })

  it('opens dialog when clicked', async () => {
    const user = userEvent.setup()
    render(<ImpersonateButton {...defaultProps} />)

    await user.click(getTriggerButton())

    expect(screen.getByText('Confirmar impersonación')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('dialog shows tenant name in description', async () => {
    const user = userEvent.setup()
    render(<ImpersonateButton {...defaultProps} tenantName="Mi Campaña" />)

    await user.click(getTriggerButton())

    expect(screen.getByText('Mi Campaña')).toBeInTheDocument()
  })

  it('shows error when API returns error', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Tenant no encontrado' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<ImpersonateButton {...defaultProps} />)

    await user.click(getTriggerButton())
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText('Tenant no encontrado')).toBeInTheDocument()
    })
  })

  it('calls window.open with correct URL on success', async () => {
    const user = userEvent.setup()
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'fake-jwt-token' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<ImpersonateButton {...defaultProps} />)

    await user.click(getTriggerButton())
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/impersonate?token=fake-jwt-token&return_to='),
        '_blank',
      )
    })
  })
})
