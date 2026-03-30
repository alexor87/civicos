import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IntegrationsForm } from '@/components/settings/IntegrationsForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const CAMPAIGN_FULL = {
  id:            'camp-1',
  resend_domain: 'campaña.com',
  twilio_sid:    'AC123',
  twilio_token:  'tok123',
  twilio_from:   '+15551234567',
}

const CAMPAIGN_EMPTY = {
  id:            'camp-1',
  resend_domain: null,
  twilio_sid:    null,
  twilio_token:  null,
  twilio_from:   null,
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('IntegrationsForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Default: AI config fetch returns unconfigured
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
  })

  it('muestra mensaje cuando no hay campaña', () => {
    render(<IntegrationsForm campaign={null} />)
    expect(screen.getByText(/no hay campaña activa/i)).toBeInTheDocument()
  })

  it('renderiza las 3 tarjetas de integración', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    expect(screen.getByText(/email — resend/i)).toBeInTheDocument()
    expect(screen.getByText(/sms — twilio/i)).toBeInTheDocument()
    expect(screen.getByText(/modelo de ia/i)).toBeInTheDocument()
  })

  it('muestra badge "Conectado" para Resend y Twilio cuando campos llenos', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    const badges = screen.getAllByText('Conectado')
    expect(badges.length).toBeGreaterThanOrEqual(2) // Resend + Twilio
  })

  it('muestra badge "Sin configurar" cuando campos vacíos', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_EMPTY} />)
    const badges = screen.getAllByText('Sin configurar')
    expect(badges.length).toBeGreaterThanOrEqual(2) // Resend + Twilio
  })

  it('muestra texto de resumen', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    expect(screen.getByText(/configura las integraciones/i)).toBeInTheDocument()
  })

  it('expande la tarjeta de Resend al hacer click', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    expect(screen.queryByLabelText(/dominio verificado/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(/email — resend/i))
    expect(screen.getByLabelText(/dominio verificado/i)).toBeInTheDocument()
  })

  it('expande la tarjeta de Twilio al hacer click', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    expect(screen.getByLabelText(/account sid/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/auth token/i)).toBeInTheDocument()
  })

  it('el token de Twilio está enmascarado por defecto', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    const tokenInput = screen.getByLabelText(/auth token/i) as HTMLInputElement
    expect(tokenInput.type).toBe('password')
  })

  it('el botón de ojo revela el token', () => {
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    fireEvent.click(screen.getByLabelText(/mostrar token/i))
    const tokenInput = screen.getByLabelText(/auth token/i) as HTMLInputElement
    expect(tokenInput.type).toBe('text')
  })

  it('guardar Resend llama a PATCH /api/settings/integrations', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    fireEvent.click(screen.getByText(/email — resend/i))
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings/integrations', expect.objectContaining({ method: 'PATCH' }))
    })
  })

  it('probar conexión de Twilio llama al endpoint correcto', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    fireEvent.click(screen.getByRole('button', { name: /probar conexión/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings/integrations/test-twilio', expect.objectContaining({ method: 'POST' }))
    })
  })

  // ── AI Config Card ──────────────────────────────────────────────────────

  it('AI card muestra "Sin configurar" cuando no hay config', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)

    await waitFor(() => {
      const badges = screen.getAllByText('Sin configurar')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('AI card muestra "Conectado" cuando config es válida', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        configured: true,
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250514',
        api_key_hint: 'sk-a...xy12',
        is_valid: true,
        id: 'config-1',
      }),
    })
    render(<IntegrationsForm campaign={CAMPAIGN_FULL} />)

    await waitFor(() => {
      // Should show at least 3 "Conectado" badges (Resend + Twilio + AI)
      const badges = screen.getAllByText('Conectado')
      expect(badges.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('AI card expande y muestra selector de proveedor', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm campaign={CAMPAIGN_EMPTY} />)

    // Wait for AI config to load (loading spinner gone, badge appears)
    await waitFor(() => {
      const badges = screen.getAllByText('Sin configurar')
      // CAMPAIGN_EMPTY: Resend + Twilio + AI = 3
      expect(badges.length).toBeGreaterThanOrEqual(3)
    })

    fireEvent.click(screen.getByText(/modelo de ia/i))

    await waitFor(() => {
      expect(screen.getByText(/selecciona un proveedor/i)).toBeInTheDocument()
    })
  })
})
