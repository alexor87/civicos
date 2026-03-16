import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FlowsList } from '@/components/dashboard/flows/FlowsList'
import type { AutomationFlow } from '@/components/dashboard/flows/flowTypes'

vi.mock('next/navigation', () => ({
  useRouter:  () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard/automatizaciones',
}))

function makeFlow(overrides: Partial<AutomationFlow> = {}): AutomationFlow {
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
    natural_language_input:      null,
    ai_generated:                true,
    execution_count:             5,
    last_execution_at:           '2026-03-15T08:00:00Z',
    ...overrides,
  }
}

describe('FlowsList', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'active' }),
    }))
  })

  it('renderiza el contenedor con testid', () => {
    render(<FlowsList initialFlows={[]} />)
    expect(screen.getByTestId('flows-list')).toBeInTheDocument()
  })

  it('muestra empty state cuando no hay flows', () => {
    render(<FlowsList initialFlows={[]} />)
    expect(screen.getByText(/Aún no tienes automatizaciones/i)).toBeInTheDocument()
  })

  it('muestra las stats de activos, pausados y borradores', () => {
    const flows = [
      makeFlow({ id: '1', status: 'active' }),
      makeFlow({ id: '2', status: 'paused' }),
      makeFlow({ id: '3', status: 'draft' }),
    ]
    render(<FlowsList initialFlows={flows} />)
    expect(screen.getByText('activos')).toBeInTheDocument()
    expect(screen.getByText('pausados')).toBeInTheDocument()
    expect(screen.getByText('borradores')).toBeInTheDocument()
  })

  it('renderiza una FlowCard por cada flow', () => {
    const flows = [makeFlow({ id: '1' }), makeFlow({ id: '2', name: 'Otro flow' })]
    render(<FlowsList initialFlows={flows} />)
    const cards = screen.getAllByTestId('flow-card')
    expect(cards).toHaveLength(2)
  })

  it('muestra el nombre del flow en cada card', () => {
    render(<FlowsList initialFlows={[makeFlow()]} />)
    expect(screen.getByText('Saludo de cumpleaños')).toBeInTheDocument()
  })

  it('muestra el badge de estado correcto', () => {
    render(<FlowsList initialFlows={[makeFlow({ status: 'active' })]} />)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra "Pausado" para flows pausados', () => {
    render(<FlowsList initialFlows={[makeFlow({ status: 'paused' })]} />)
    expect(screen.getByText('Pausado')).toBeInTheDocument()
  })

  it('llama a PATCH al hacer click en pausar', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'paused' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<FlowsList initialFlows={[makeFlow({ status: 'active' })]} />)
    fireEvent.click(screen.getByLabelText('Pausar flow'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/flows/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })
})
