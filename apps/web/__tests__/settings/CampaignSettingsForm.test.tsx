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
  election_type:  'alcalde',
  election_date:  '2026-10-25',
  key_topics:     ['Empleo y trabajo', 'Seguridad ciudadana'],
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

  // ── Fase 1: Nuevos tests ────────────────────────────────────────────────────

  it('renderiza los tipos de elección colombianos', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    const select = screen.getByLabelText(/tipo de elección/i)
    expect(select).toBeInTheDocument()
    // Verify the Colombian types are available as options
    expect(screen.getByText('Alcalde Municipal')).toBeInTheDocument()
    expect(screen.getByText('Concejal Municipal')).toBeInTheDocument()
    expect(screen.getByText('Gobernador Departamental')).toBeInTheDocument()
    expect(screen.getByText('Senador de la República')).toBeInTheDocument()
    expect(screen.getByText('Presidente de la República')).toBeInTheDocument()
  })

  it('muestra temas clave como chips seleccionables', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    // Predefined topics should render as checkboxes (ChipSelector uses role="checkbox")
    expect(screen.getByRole('checkbox', { name: /empleo y trabajo/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /seguridad ciudadana/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /educación/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /salud/i })).toBeInTheDocument()
  })

  it('los temas iniciales aparecen como seleccionados', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    // "Seguridad ciudadana" was in key_topics — should be checked
    const chip = screen.getByRole('checkbox', { name: /seguridad ciudadana/i })
    expect(chip).toHaveAttribute('aria-checked', 'true')
  })

  it('permite agregar un tema personalizado', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    const customInput = screen.getByPlaceholderText(/agregar tema/i)
    fireEvent.change(customInput, { target: { value: 'turismo' } })
    fireEvent.keyDown(customInput, { key: 'Enter' })
    // The custom topic should now appear as a selected checkbox chip
    expect(screen.getByRole('checkbox', { name: /turismo/i })).toBeInTheDocument()
  })

  it('muestra el contador de días para la elección', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    // election_date is 2026-10-25, today is 2026-03-26
    // Should show something like "Faltan X días"
    expect(screen.getByText(/faltan.*días/i)).toBeInTheDocument()
  })

  it('no muestra el contador sin fecha de elección', () => {
    const campaignNoDate = { ...BASE_CAMPAIGN, election_date: null }
    render(<CampaignSettingsForm campaign={campaignNoDate} />)
    expect(screen.queryByText(/faltan.*días/i)).not.toBeInTheDocument()
  })

  it('muestra el acordeón de información IA', () => {
    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    const toggle = screen.getByText(/cómo usa la ia/i)
    expect(toggle).toBeInTheDocument()
    // Initially collapsed — content not visible
    expect(screen.queryByText(/sugerencias personalizadas/i)).not.toBeInTheDocument()
    // Click to expand
    fireEvent.click(toggle)
    expect(screen.getByText(/sugerencias personalizadas/i)).toBeInTheDocument()
  })

  it('envía key_topics como array al guardar', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<CampaignSettingsForm campaign={BASE_CAMPAIGN} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(Array.isArray(body.key_topics)).toBe(true)
    })
  })
})
