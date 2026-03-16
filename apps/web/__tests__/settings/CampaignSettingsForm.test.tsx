import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CampaignSettingsForm } from '@/components/settings/CampaignSettingsForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error:   vi.fn(),
  },
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const BASE_CAMPAIGN = {
  id:             'camp-1',
  name:           'Campaña Alcaldía 2026',
  candidate_name: 'María López',
  election_type:  'municipal',
  election_date:  '2026-10-25',
  key_topics:     ['empleo', 'seguridad'],
  description:    'Propuesta de gobierno centrada en la ciudadanía.',
  brand_color:    '#2960ec',
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CampaignSettingsForm', () => {

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renderiza los campos con los valores iniciales', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    expect(screen.getByDisplayValue('Campaña Alcaldía 2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue('María López')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Propuesta de gobierno centrada en la ciudadanía.')).toBeInTheDocument()
  })

  it('muestra el botón Guardar cambios', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })

  it('llama a PATCH /api/settings/campaign al hacer submit', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/settings/campaign',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('muestra mensaje de éxito después de guardar', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('muestra error si el API falla', async () => {
    const { toast } = await import('sonner')
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Error al guardar' }) })

    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('permite editar el nombre del candidato', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    const input = screen.getByDisplayValue('María López')
    fireEvent.change(input, { target: { value: 'Juan Pérez' } })
    expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument()
  })

  it('el campo fecha de elección tiene el valor inicial correcto', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    expect(screen.getByDisplayValue('2026-10-25')).toBeInTheDocument()
  })
})
