import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import CampanasPage from '@/app/dashboard/perfil/campanas/page'

describe('CampanasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when user has no campaigns', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ campaign_ids: [] }),
    })

    render(<CampanasPage />)
    await waitFor(() => {
      expect(screen.getByText('No tienes campañas asignadas')).toBeInTheDocument()
    })
  })

  it('renders page title', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ campaign_ids: [] }),
    })

    render(<CampanasPage />)
    await waitFor(() => {
      expect(screen.getByText('Mis campañas')).toBeInTheDocument()
    })
  })
})
