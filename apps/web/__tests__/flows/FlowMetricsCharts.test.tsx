import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlowMetricsCharts } from '@/components/dashboard/flows/FlowMetricsCharts'
import { FlowExecution } from '@/components/dashboard/flows/flowTypes'

vi.mock('@tremor/react', () => ({
  AreaChart: (props: Record<string, unknown>) => (
    <div
      data-testid={(props['data-testid'] as string) ?? 'area-chart'}
      data-points={(props.data as unknown[]).length}
    />
  ),
}))

function makeExecution(overrides: Partial<FlowExecution> = {}): FlowExecution {
  return {
    id:          overrides.id ?? 'exec-1',
    flow_id:     'flow-1',
    tenant_id:   'tenant-1',
    contact_id:  'contact-1',
    status:      overrides.status ?? 'completed',
    triggered_by: 'cron',
    actions_log:  [],
    error_message: null,
    started_at:   overrides.started_at ?? new Date().toISOString(),
    completed_at: overrides.completed_at ?? new Date().toISOString(),
    ...overrides,
  }
}

describe('FlowMetricsCharts', () => {
  it('renderiza el contenedor principal', () => {
    render(<FlowMetricsCharts executions={[]} />)
    expect(screen.getByTestId('flow-metrics-charts')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay ejecuciones', () => {
    render(<FlowMetricsCharts executions={[]} />)
    expect(screen.getByTestId('metrics-empty')).toBeInTheDocument()
  })

  it('no muestra el estado vacío cuando hay ejecuciones', () => {
    const execs = [makeExecution()]
    render(<FlowMetricsCharts executions={execs} />)
    expect(screen.queryByTestId('metrics-empty')).not.toBeInTheDocument()
  })

  it('renderiza el AreaChart cuando hay ejecuciones', () => {
    const execs = [makeExecution(), makeExecution({ id: 'exec-2', status: 'failed' })]
    render(<FlowMetricsCharts executions={execs} />)
    expect(screen.getByTestId('executions-area-chart')).toBeInTheDocument()
  })

  it('muestra el título de la sección de gráfica', () => {
    render(<FlowMetricsCharts executions={[makeExecution()]} />)
    expect(screen.getByTestId('chart-title')).toBeInTheDocument()
  })

  it('agrupa ejecuciones por día correctamente', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const execs = [
      makeExecution({ id: 'e1', started_at: today.toISOString() }),
      makeExecution({ id: 'e2', started_at: today.toISOString(), status: 'failed' }),
      makeExecution({ id: 'e3', started_at: yesterday.toISOString() }),
    ]
    const { getByTestId } = render(<FlowMetricsCharts executions={execs} />)
    const chart = getByTestId('executions-area-chart')
    // Should have at least 2 data points (today and yesterday)
    expect(Number(chart.getAttribute('data-points'))).toBeGreaterThanOrEqual(2)
  })

  it('muestra leyenda con Exitosas y Con error', () => {
    render(<FlowMetricsCharts executions={[makeExecution()]} />)
    expect(screen.getByText(/exitosas/i)).toBeInTheDocument()
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
