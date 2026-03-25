import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import NotificacionesPage from '@/app/dashboard/perfil/notificaciones/page'

describe('NotificacionesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ preferences: { notifications: { enabled: true } } }),
    })
  })

  it('loads and shows notification toggle', async () => {
    render(<NotificacionesPage />)
    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
    // "Notificaciones" appears in both heading and toggle label
    expect(screen.getAllByText('Notificaciones').length).toBeGreaterThanOrEqual(1)
  })

  it('shows enabled state correctly', async () => {
    render(<NotificacionesPage />)
    await waitFor(() => {
      expect(screen.getByText('Recibirás notificaciones de la plataforma')).toBeInTheDocument()
    })
  })

  it('toggles notification and shows save button', async () => {
    render(<NotificacionesPage />)
    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('switch'))

    expect(screen.getByText('Las notificaciones están desactivadas')).toBeInTheDocument()
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
  })
})
