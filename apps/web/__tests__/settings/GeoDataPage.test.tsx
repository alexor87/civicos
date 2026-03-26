import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GeoDataPage from '@/app/dashboard/settings/geo-data/page'
import { toast } from 'sonner'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('xlsx', () => ({ read: vi.fn(), utils: { sheet_to_json: vi.fn(() => []) } }))

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GeoDataPage', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Default: stats returns zeros, scope returns empty
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/import/geo-units') {
        return Promise.resolve({ ok: true, json: async () => ({ departamentos: 0, municipios: 0, localidades: 0, upzs: 0, comunas: 0, corregimientos: 0, barrios: 0, veredas: 0 }) })
      }
      if (url === '/api/campaigns/scope') {
        return Promise.resolve({ ok: true, json: async () => ({ election_type: null, geo_scope: null, departments: [], municipalities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('muestra banner vacío cuando no hay datos geográficos', async () => {
    render(<GeoDataPage />)
    await waitFor(() => {
      expect(screen.getByText(/no hay datos geográficos cargados/i)).toBeInTheDocument()
    })
  })

  it('no muestra banner vacío cuando hay datos', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/import/geo-units') {
        return Promise.resolve({ ok: true, json: async () => ({ departamentos: 33, municipios: 1122, localidades: 0, upzs: 0, comunas: 0, corregimientos: 0, barrios: 0, veredas: 0 }) })
      }
      if (url === '/api/campaigns/scope') {
        return Promise.resolve({ ok: true, json: async () => ({ election_type: null, geo_scope: null, departments: [], municipalities: [] }) })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    render(<GeoDataPage />)
    await waitFor(() => {
      expect(screen.queryByText(/no hay datos geográficos cargados/i)).not.toBeInTheDocument()
    })
  })

  it('renderiza la sección de ámbito de campaña', async () => {
    render(<GeoDataPage />)
    await waitFor(() => {
      expect(screen.getByText(/ámbito de la campaña/i)).toBeInTheDocument()
    })
  })
})
