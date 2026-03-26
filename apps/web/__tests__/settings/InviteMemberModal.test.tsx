import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InviteMemberModal } from '@/components/settings/InviteMemberModal'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const onClose   = vi.fn()
const onInvited = vi.fn()

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('InviteMemberModal', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    onClose.mockReset()
    onInvited.mockReset()
  })

  it('renderiza los campos del formulario cuando está abierto', () => {
    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
  })

  it('el botón enviar está deshabilitado sin email ni rol', () => {
    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    const submitBtn = screen.getByRole('button', { name: /enviar invitación/i })
    expect(submitBtn).toBeDisabled()
  })

  it('el botón enviar se habilita con email y rol válidos', () => {
    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/rol/i), { target: { value: 'volunteer' } })
    const submitBtn = screen.getByRole('button', { name: /enviar invitación/i })
    expect(submitBtn).not.toBeDisabled()
  })

  it('muestra la descripción del rol al seleccionar uno', () => {
    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    fireEvent.change(screen.getByLabelText(/rol/i), { target: { value: 'volunteer' } })
    expect(screen.getByText(/lista de casas asignadas/i)).toBeInTheDocument()
  })

  it('llama a POST /api/team/invite al enviar', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/rol/i), { target: { value: 'volunteer' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/team/invite', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('cierra el modal y llama onInvited al enviar exitosamente', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/rol/i), { target: { value: 'volunteer' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onInvited).toHaveBeenCalled()
    })
  })

  it('muestra error si la API falla', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Email duplicado' }) })

    render(<InviteMemberModal open={true} onClose={onClose} onInvited={onInvited} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/rol/i), { target: { value: 'volunteer' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar invitación/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
