import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'

vi.mock('@tremor/react', () => ({
  Metric: ({ children }: { children: React.ReactNode }) => <div data-testid="metric">{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: () => <div data-testid="area-chart" />,
}))

const PROPS = {
  totalContacts: 1250,
  supporters: 480,
  supportRate: 38,
  totalVisits: 320,
  coverageRate: 26,
  pendingVisits: 12,
  weeklyData: [
    { week: 'S1 ene', contacts: 100 },
    { week: 'S2 ene', contacts: 250 },
  ],
}

describe('DashboardKPIs', () => {
  it('muestra el total de contactos formateado', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('1.250')).toBeInTheDocument()
  })

  it('muestra el número de simpatizantes', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('480')).toBeInTheDocument()
  })

  it('muestra la cobertura como porcentaje', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('26%')).toBeInTheDocument()
  })

  it('muestra las visitas pendientes', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renderiza el AreaChart cuando hay datos', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('no renderiza el AreaChart cuando no hay datos', () => {
    render(<DashboardKPIs {...PROPS} weeklyData={[]} />)
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
  })

  it('renderiza exactamente 4 métricas', () => {
    render(<DashboardKPIs {...PROPS} />)
    expect(screen.getAllByTestId('metric')).toHaveLength(4)
  })
})
