import { describe, it, expect, vi, beforeEach } from 'vitest'

// SMS + WhatsApp cards are gated by feature flags in production. Tests assume
// they are visible — force the flags on.
vi.mock('@/lib/features/messaging-channels', () => ({
  SMS_CHANNEL_ENABLED: true,
  WHATSAPP_CHANNEL_ENABLED: true,
  ANY_NON_EMAIL_CHANNEL_ENABLED: true,
  isChannelEnabled: () => true,
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IntegrationsForm } from '@/components/settings/IntegrationsForm'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const CONFIG_FULL = {
  id:                   'int-1',
  tenant_id:            't1',
  campaign_id:          'camp-1',
  resend_api_key:       'encrypted_key',
  resend_api_key_hint:  're_1...xy99',
  resend_domain:        'campaña.com',
  resend_from_name:     'Campaña Test',
  resend_from_email:    'contacto',
  twilio_sid:           'AC123',
  twilio_token:         'encrypted_token',
  twilio_token_hint:    'tok1...k123',
  twilio_from:          '+15551234567',
  twilio_whatsapp_from: null,
  resend_webhook_secret: null,
  resend_webhook_secret_hint: null,
}

const CONFIG_EMPTY = {
  id:                   'int-1',
  tenant_id:            't1',
  campaign_id:          'camp-1',
  resend_api_key:       null,
  resend_api_key_hint:  null,
  resend_domain:        null,
  resend_from_name:     null,
  resend_from_email:    null,
  twilio_sid:           null,
  twilio_token:         null,
  twilio_token_hint:    null,
  twilio_from:          null,
  twilio_whatsapp_from: null,
  resend_webhook_secret: null,
  resend_webhook_secret_hint: null,
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('IntegrationsForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Default: AI config fetch returns unconfigured
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
  })

  it('renderiza las 3 tarjetas de integración', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    expect(screen.getByText(/email — resend/i)).toBeInTheDocument()
    expect(screen.getByText(/sms — twilio/i)).toBeInTheDocument()
    expect(screen.getByText(/modelo de ia/i)).toBeInTheDocument()
  })

  it('muestra badge "Conectado" para Resend y Twilio cuando campos llenos', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    const badges = screen.getAllByText('Conectado')
    expect(badges.length).toBeGreaterThanOrEqual(2) // Resend + Twilio
  })

  it('muestra badge "Sin configurar" cuando campos vacíos', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_EMPTY} campaignId="camp-1" tenantId="t1" />)
    const badges = screen.getAllByText('Sin configurar')
    expect(badges.length).toBeGreaterThanOrEqual(2) // Resend + Twilio
  })

  it('muestra texto de resumen', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    expect(screen.getByText(/configura las integraciones/i)).toBeInTheDocument()
  })

  it('expande la tarjeta de Resend al hacer click y muestra todos los campos', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    expect(screen.queryByLabelText(/dominio verificado/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(/email — resend/i))
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dominio verificado/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del remitente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email de envío/i)).toBeInTheDocument()
  })

  it('muestra guía de 3 pasos al expandir Resend', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_EMPTY} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/email — resend/i))
    expect(screen.getByText(/configuración en 3 pasos/i)).toBeInTheDocument()
  })

  it('muestra preview del remitente cuando hay dominio y nombre', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    // The collapsed header should show the from preview
    expect(screen.getByText(/Campaña Test <contacto@campaña.com>/)).toBeInTheDocument()
  })

  it('muestra error si se ingresa un email en el campo de dominio', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_EMPTY} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/email — resend/i))
    const domainInput = screen.getByLabelText(/dominio verificado/i)
    fireEvent.change(domainInput, { target: { value: 'user@gmail.com' } })
    expect(screen.getByText(/ingresa solo el dominio, no un email/i)).toBeInTheDocument()
  })

  it('muestra hint de API key de Resend cuando existe', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/email — resend/i))
    expect(screen.getByText('re_1...xy99')).toBeInTheDocument()
  })

  it('expande la tarjeta de Twilio al hacer click', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    expect(screen.getByLabelText(/account sid/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/auth token/i)).toBeInTheDocument()
  })

  it('muestra hint de Auth Token cuando existe', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    expect(screen.getByText('tok1...k123')).toBeInTheDocument()
  })

  it('el token de Twilio está enmascarado por defecto', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    const tokenInput = screen.getByLabelText(/auth token/i) as HTMLInputElement
    expect(tokenInput.type).toBe('password')
  })

  it('el botón de ojo revela el token', () => {
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    fireEvent.click(screen.getByLabelText(/mostrar token/i))
    const tokenInput = screen.getByLabelText(/auth token/i) as HTMLInputElement
    expect(tokenInput.type).toBe('text')
  })

  it('guardar Resend llama a PATCH /api/settings/integrations', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/email — resend/i))
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings/integrations', expect.objectContaining({ method: 'PATCH' }))
    })
  })

  it('probar conexión de Twilio llama al endpoint correcto', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)
    fireEvent.click(screen.getByText(/sms — twilio/i))
    fireEvent.click(screen.getByRole('button', { name: /probar conexión/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/settings/integrations/test-twilio', expect.objectContaining({ method: 'POST' }))
    })
  })

  // ── AI Config Card ──────────────────────────────────────────────────────

  it('AI card muestra "Sin configurar" cuando no hay config', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)

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
    render(<IntegrationsForm integrationConfig={CONFIG_FULL} campaignId="camp-1" tenantId="t1" />)

    await waitFor(() => {
      // Should show at least 3 "Conectado" badges (Resend + Twilio + AI)
      const badges = screen.getAllByText('Conectado')
      expect(badges.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('AI card expande y muestra selector de proveedor', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ configured: false }) })
    render(<IntegrationsForm integrationConfig={CONFIG_EMPTY} campaignId="camp-1" tenantId="t1" />)

    // Wait for AI config to load
    await waitFor(() => {
      const badges = screen.getAllByText('Sin configurar')
      expect(badges.length).toBeGreaterThanOrEqual(3)
    })

    fireEvent.click(screen.getByText(/modelo de ia/i))

    await waitFor(() => {
      expect(screen.getByText(/selecciona un proveedor/i)).toBeInTheDocument()
    })
  })
})
