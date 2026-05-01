import { describe, it, expect, vi, beforeEach } from 'vitest'

// Tests exercise SMS/WhatsApp action paths in the flow builder, which are
// gated by feature flags in production. Force them on for these tests.
vi.mock('@/lib/features/messaging-channels', () => ({
  SMS_CHANNEL_ENABLED: true,
  WHATSAPP_CHANNEL_ENABLED: true,
  ANY_NON_EMAIL_CHANNEL_ENABLED: true,
  isChannelEnabled: () => true,
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VisualFlowEditor } from '@/components/dashboard/flows/VisualFlowEditor'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('VisualFlowEditor — Paso 1: Trigger', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renderiza el contenedor del editor', () => {
    render(<VisualFlowEditor />)
    expect(screen.getByTestId('visual-flow-editor')).toBeInTheDocument()
  })

  it('muestra el indicador de pasos', () => {
    render(<VisualFlowEditor />)
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
  })

  it('muestra cards para todos los triggers disponibles', () => {
    render(<VisualFlowEditor />)
    expect(screen.getByTestId('trigger-card-date_field')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-card-sympathy_change')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-card-canvass_result')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-card-inactivity')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-card-contact_created')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-card-contact_replied')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-card-calendar_date')).toBeInTheDocument()
  })

  it('resalta la card seleccionada al hacer click', () => {
    render(<VisualFlowEditor />)
    const card = screen.getByTestId('trigger-card-inactivity')
    fireEvent.click(card)
    expect(card).toHaveAttribute('data-selected', 'true')
  })

  it('muestra el formulario de configuración al seleccionar un trigger', () => {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-inactivity'))
    expect(screen.getByTestId('trigger-config-form')).toBeInTheDocument()
  })

  it('muestra input de días para trigger inactivity', () => {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-inactivity'))
    expect(screen.getByTestId('inactivity-days-input')).toBeInTheDocument()
  })

  it('muestra selector de canal para trigger contact_replied', () => {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-contact_replied'))
    expect(screen.getByTestId('replied-channel-select')).toBeInTheDocument()
  })

  it('muestra selector de dirección para trigger calendar_date', () => {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-calendar_date'))
    expect(screen.getByTestId('calendar-direction-select')).toBeInTheDocument()
  })

  it('el botón Siguiente está deshabilitado sin trigger seleccionado', () => {
    render(<VisualFlowEditor />)
    expect(screen.getByTestId('step1-next-btn')).toBeDisabled()
  })

  it('el botón Siguiente se habilita después de seleccionar contact_created', () => {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-contact_created'))
    expect(screen.getByTestId('step1-next-btn')).not.toBeDisabled()
  })

  it('avanza al paso 2 al hacer click en Siguiente con trigger válido', () => {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-contact_created'))
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
  })
})

describe('VisualFlowEditor — Paso 2: Acciones', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  function goToStep2() {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-contact_created'))
    fireEvent.click(screen.getByTestId('step1-next-btn'))
  }

  it('muestra el chip del trigger seleccionado', () => {
    goToStep2()
    expect(screen.getByTestId('selected-trigger-chip')).toBeInTheDocument()
  })

  it('muestra el botón Agregar acción', () => {
    goToStep2()
    expect(screen.getByTestId('add-action-btn')).toBeInTheDocument()
  })

  it('el botón Siguiente está deshabilitado sin acciones', () => {
    goToStep2()
    expect(screen.getByTestId('step2-next-btn')).toBeDisabled()
  })

  it('agrega una card de acción al seleccionar un tipo', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_whatsapp'))
    expect(screen.getByTestId('action-card-0')).toBeInTheDocument()
  })

  it('puede agregar múltiples acciones', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_whatsapp'))
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_sms'))
    expect(screen.getByTestId('action-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('action-card-1')).toBeInTheDocument()
  })

  it('puede eliminar una acción', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_whatsapp'))
    fireEvent.click(screen.getByTestId('action-card-0-remove'))
    expect(screen.queryByTestId('action-card-0')).not.toBeInTheDocument()
  })

  it('muestra textarea de mensaje para acción send_sms', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_sms'))
    expect(screen.getByTestId('action-card-0-sms-message')).toBeInTheDocument()
  })

  it('muestra selector de nivel para acción change_sympathy', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-change_sympathy'))
    expect(screen.getByTestId('action-card-0-sympathy-level')).toBeInTheDocument()
  })

  it('muestra input de días para acción wait', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-wait'))
    expect(screen.getByTestId('action-card-0-wait-days')).toBeInTheDocument()
  })

  it('el botón Siguiente se habilita con al menos 1 acción', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_whatsapp'))
    expect(screen.getByTestId('step2-next-btn')).not.toBeDisabled()
  })

  it('avanza al paso 3 al hacer click en Siguiente', () => {
    goToStep2()
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_whatsapp'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
    expect(screen.getByTestId('step-3')).toBeInTheDocument()
  })
})

describe('VisualFlowEditor — Paso 3: Guardar', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  function goToStep3() {
    render(<VisualFlowEditor />)
    fireEvent.click(screen.getByTestId('trigger-card-contact_created'))
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    fireEvent.click(screen.getByTestId('add-action-btn'))
    fireEvent.click(screen.getByTestId('action-type-send_whatsapp'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
  }

  it('renderiza el input de nombre del flow', () => {
    goToStep3()
    expect(screen.getByTestId('flow-name-input')).toBeInTheDocument()
  })

  it('el nombre está pre-llenado', () => {
    goToStep3()
    const input = screen.getByTestId('flow-name-input') as HTMLInputElement
    expect(input.value.length).toBeGreaterThan(0)
  })

  it('renderiza el FlowRecipeCard como resumen', () => {
    goToStep3()
    expect(screen.getByTestId('flow-recipe-card')).toBeInTheDocument()
  })

  it('renderiza botones de guardar y activar', () => {
    goToStep3()
    expect(screen.getByTestId('save-draft-btn')).toBeInTheDocument()
    expect(screen.getByTestId('activate-btn')).toBeInTheDocument()
  })

  it('llama a POST /api/flows con status draft al guardar borrador', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-flow-id' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    goToStep3()
    fireEvent.click(screen.getByTestId('save-draft-btn'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/flows',
        expect.objectContaining({ method: 'POST' })
      )
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.status).toBe('draft')
    })
  })

  it('llama a POST /api/flows con status active al activar', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-flow-id' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    goToStep3()
    fireEvent.click(screen.getByTestId('activate-btn'))

    await waitFor(() => {
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.status).toBe('active')
    })
  })

  it('redirige al detalle del flow tras guardar exitosamente', async () => {
    pushMock.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'created-flow-123' }),
    }))

    goToStep3()
    fireEvent.click(screen.getByTestId('save-draft-btn'))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard/automatizaciones/')
      )
    })
  })

  it('muestra error si la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Error del servidor' }),
    }))

    goToStep3()
    fireEvent.click(screen.getByTestId('save-draft-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('save-error')).toBeInTheDocument()
    })
  })
})

// ── Edit mode ─────────────────────────────────────────────────────

const INITIAL_FLOW = {
  id:             'flow-existing-1',
  tenant_id:      'tenant-1',
  campaign_id:    'campaign-1',
  name:           'Flow de prueba existente',
  status:         'draft' as const,
  category:       'engagement' as const,
  icon:           null,
  trigger_config: { type: 'contact_created' as const, config: {} },
  actions_config: [{ type: 'send_whatsapp' as const, config: { message: 'Hola {first_name}', fallback: 'sms' as const } }],
  filter_config:  [],
  created_at:     new Date().toISOString(),
  updated_at:     new Date().toISOString(),
  created_by:     'user-1',
  ai_generated:   false,
  natural_language_input: null,
  max_executions_per_contact: 1,
  execution_window_days: null,
  requires_approval: false,
  approved_by:    null,
  approved_at:    null,
  activated_at:   null,
  paused_at:      null,
  from_template_id: null,
}

describe('VisualFlowEditor — Modo edición', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('muestra indicador de modo edición cuando se pasa initialFlow', () => {
    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    expect(screen.getByTestId('edit-mode-indicator')).toBeInTheDocument()
  })

  it('no muestra indicador de modo edición en modo creación', () => {
    render(<VisualFlowEditor />)
    expect(screen.queryByTestId('edit-mode-indicator')).not.toBeInTheDocument()
  })

  it('pre-selecciona el trigger del flow existente', () => {
    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    const card = screen.getByTestId('trigger-card-contact_created')
    expect(card).toHaveAttribute('data-selected', 'true')
  })

  it('muestra el nombre del flow existente pre-llenado en paso 3', () => {
    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    // navegar a paso 3
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
    const input = screen.getByTestId('flow-name-input') as HTMLInputElement
    expect(input.value).toBe('Flow de prueba existente')
  })

  it('pre-carga las acciones del flow existente en paso 2', () => {
    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    expect(screen.getByTestId('action-card-0')).toBeInTheDocument()
  })

  it('muestra "Guardar cambios" en lugar de "Guardar como borrador"', () => {
    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
    expect(screen.getByTestId('save-draft-btn')).toHaveTextContent('Guardar cambios')
  })

  it('llama a PATCH en lugar de POST al guardar en modo edición', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'flow-existing-1', status: 'draft' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
    fireEvent.click(screen.getByTestId('save-draft-btn'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/flows/flow-existing-1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('llama a PATCH con status active al activar en modo edición', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'flow-existing-1', status: 'active' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
    fireEvent.click(screen.getByTestId('activate-btn'))

    await waitFor(() => {
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.status).toBe('active')
    })
  })

  it('redirige al detalle del flow al guardar en modo edición', async () => {
    pushMock.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'flow-existing-1' }),
    }))

    render(<VisualFlowEditor initialFlow={INITIAL_FLOW} />)
    fireEvent.click(screen.getByTestId('step1-next-btn'))
    fireEvent.click(screen.getByTestId('step2-next-btn'))
    fireEvent.click(screen.getByTestId('save-draft-btn'))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        '/dashboard/automatizaciones/flow-existing-1'
      )
    })
  })
})
