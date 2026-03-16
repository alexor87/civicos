import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FlowDetail } from '@/components/dashboard/flows/FlowDetail'
import type { AutomationFlow, FlowExecution } from '@/components/dashboard/flows/flowTypes'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function makeFlow(overrides: Partial<AutomationFlow> = {}): AutomationFlow & { executions: FlowExecution[] } {
  return {
    id:                          'flow-1',
    tenant_id:                   'tenant-1',
    campaign_id:                 'camp-1',
    name:                        'Saludo de cumpleaños',
    description:                 null,
    category:                    'birthday',
    icon:                        '🎂',
    from_template_id:            null,
    status:                      'active',
    trigger_config:              { type: 'date_field', config: { field: 'birth_date', offset_days: 0, time: '08:00' } },
    filter_config:               [],
    actions_config:              [{ type: 'send_whatsapp', config: { message: '¡Feliz cumpleaños, {first_name}!', fallback: 'sms' } }],
    max_executions_per_contact:  1,
    execution_window_days:       null,
    requires_approval:           false,
    approved_by:                 null,
    approved_at:                 null,
    created_by:                  'user-1',
    created_at:                  '2026-03-01T00:00:00Z',
    updated_at:                  '2026-03-01T00:00:00Z',
    activated_at:                '2026-03-01T00:00:00Z',
    paused_at:                   null,
    natural_language_input:      'Quiero enviar saludos de cumpleaños',
    ai_generated:                true,
    executions:                  [],
    ...overrides,
  }
}

function makeExecution(overrides: Partial<FlowExecution> = {}): FlowExecution {
  return {
    id:            'exec-1',
    flow_id:       'flow-1',
    tenant_id:     'tenant-1',
    contact_id:    'contact-1',
    status:        'completed',
    triggered_by:  'Cumpleaños de María García — 16 mar 2026',
    actions_log:   [],
    error_message: null,
    started_at:    '2026-03-16T08:00:00Z',
    completed_at:  '2026-03-16T08:00:05Z',
    contact_name:  'María García',
    ...overrides,
  }
}

describe('FlowDetail', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'paused' }),
    }))
  })

  it('renderiza el contenedor con testid', () => {
    render(<FlowDetail flow={makeFlow()} />)
    expect(screen.getByTestId('flow-detail')).toBeInTheDocument()
  })

  it('muestra el nombre del flow', () => {
    render(<FlowDetail flow={makeFlow()} />)
    expect(screen.getAllByText('Saludo de cumpleaños').length).toBeGreaterThan(0)
  })

  it('muestra el badge de estado "Activo"', () => {
    render(<FlowDetail flow={makeFlow({ status: 'active' })} />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra el badge de estado "Pausado"', () => {
    render(<FlowDetail flow={makeFlow({ status: 'paused' })} />)
    expect(screen.getByText('Pausado')).toBeInTheDocument()
  })

  it('renderiza las 3 pestañas', () => {
    render(<FlowDetail flow={makeFlow()} />)
    expect(screen.getByText('El Flow')).toBeInTheDocument()
    expect(screen.getByText('Actividad')).toBeInTheDocument()
    expect(screen.getByText('Métricas')).toBeInTheDocument()
  })

  it('muestra la FlowRecipeCard en la pestaña El Flow', () => {
    render(<FlowDetail flow={makeFlow()} />)
    expect(screen.getByTestId('flow-recipe-card')).toBeInTheDocument()
  })

  it('muestra el historial de ejecuciones al cambiar a Actividad', () => {
    const executions = [makeExecution()]
    render(<FlowDetail flow={makeFlow({ executions } as Partial<AutomationFlow>)} />)

    fireEvent.click(screen.getByText('Actividad'))
    expect(screen.getByTestId('execution-history')).toBeInTheDocument()
  })

  it('muestra el nombre del contacto en el historial', () => {
    const executions = [makeExecution()]
    render(<FlowDetail flow={makeFlow({ executions } as Partial<AutomationFlow>)} />)

    fireEvent.click(screen.getByText('Actividad'))
    expect(screen.getByText('María García')).toBeInTheDocument()
  })

  it('muestra métricas al cambiar a la pestaña Métricas', () => {
    render(<FlowDetail flow={makeFlow()} />)
    fireEvent.click(screen.getByText('Métricas'))
    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument()
  })

  it('llama a PATCH al hacer click en Pausar', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'paused' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<FlowDetail flow={makeFlow({ status: 'active' })} />)
    fireEvent.click(screen.getByLabelText('Pausar flow'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/flows/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('muestra botón de eliminar', () => {
    render(<FlowDetail flow={makeFlow()} />)
    expect(screen.getByLabelText('Eliminar flow')).toBeInTheDocument()
  })

  it('muestra confirmación al hacer click en eliminar', () => {
    render(<FlowDetail flow={makeFlow()} />)
    fireEvent.click(screen.getByLabelText('Eliminar flow'))
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument()
    expect(screen.getByText('Sí, eliminar')).toBeInTheDocument()
  })

  it('muestra "Ejecutando" para ejecuciones en estado running', () => {
    const executions = [makeExecution({ status: 'running', contact_name: 'Carlos López' })]
    render(<FlowDetail flow={makeFlow({ executions } as Partial<AutomationFlow>)} />)

    fireEvent.click(screen.getByText('Actividad'))
    expect(screen.getByText('Ejecutando')).toBeInTheDocument()
  })

  it('muestra mensaje de error para ejecuciones fallidas', () => {
    const executions = [makeExecution({
      status: 'failed',
      error_message: 'El contacto no tiene número de WhatsApp registrado.',
      contact_name: 'Pedro Pérez',
    })]
    render(<FlowDetail flow={makeFlow({ executions } as Partial<AutomationFlow>)} />)

    fireEvent.click(screen.getByText('Actividad'))
    expect(screen.getByText('El contacto no tiene número de WhatsApp registrado.')).toBeInTheDocument()
  })
})
