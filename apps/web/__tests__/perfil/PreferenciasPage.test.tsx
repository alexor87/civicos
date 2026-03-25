import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import PreferenciasPage from '@/app/dashboard/perfil/preferencias/page'

describe('PreferenciasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ theme_mode: 'system', font_size: 'normal' }),
    })
  })

  it('loads and displays current preferences', async () => {
    render(<PreferenciasPage />)
    await waitFor(() => {
      expect(screen.getByText('Preferencias')).toBeInTheDocument()
    })
    expect(screen.getByText('Claro')).toBeInTheDocument()
    expect(screen.getByText('Oscuro')).toBeInTheDocument()
    expect(screen.getByText('Automático')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Grande')).toBeInTheDocument()
    expect(screen.getByText('Muy grande')).toBeInTheDocument()
  })

  it('shows save button when preference changes', async () => {
    render(<PreferenciasPage />)
    await waitFor(() => {
      expect(screen.getByText('Preferencias')).toBeInTheDocument()
    })

    // Click 'Oscuro' theme option
    fireEvent.click(screen.getByText('Oscuro'))
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
  })

  it('saves preferences on button click', async () => {
    render(<PreferenciasPage />)
    await waitFor(() => {
      expect(screen.getByText('Preferencias')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Oscuro'))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ theme_mode: 'dark', font_size: 'normal' }),
    })

    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'PATCH' }))
    })
  })
})
