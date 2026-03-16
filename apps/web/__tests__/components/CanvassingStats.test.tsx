import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanvassingStats } from '@/components/dashboard/CanvassingStats'

const PROPS = {
  totalZones: 5,
  totalVisits: 200,
  pendingApproval: 15,
  positives: 80,
  resultDistribution: [
    { name: 'Positivo', value: 80 },
    { name: 'Negativo', value: 40 },
    { name: 'Indeciso', value: 50 },
  ],
}

describe('CanvassingStats', () => {
  it('muestra el total de zonas', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('muestra las visitas totales', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('muestra las visitas pendientes', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('muestra los positivos', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getAllByText('80').length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza el ProgressBar', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
  })

  it('el ProgressBar refleja tasa de aprobación correcta (92%)', () => {
    render(<CanvassingStats {...PROPS} />)
    const bar = screen.getByTestId('progress-bar')
    expect(Number(bar.getAttribute('data-value'))).toBe(92)
  })

  it('renderiza el BarList con los resultados', () => {
    render(<CanvassingStats {...PROPS} />)
    expect(screen.getByTestId('bar-list')).toBeInTheDocument()
    expect(screen.getByText('Positivo')).toBeInTheDocument()
    expect(screen.getByText('Negativo')).toBeInTheDocument()
  })

  it('no renderiza BarList cuando no hay distribución', () => {
    render(<CanvassingStats {...PROPS} resultDistribution={[]} />)
    expect(screen.queryByTestId('bar-list')).not.toBeInTheDocument()
  })
})
