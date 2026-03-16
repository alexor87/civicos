import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIStatusChart } from '@/components/dashboard/AIStatusChart'

describe('AIStatusChart', () => {
  it('muestra las 3 etiquetas', () => {
    render(<AIStatusChart active={5} applied={12} dismissed={3} />)
    expect(screen.getByText('Activas')).toBeInTheDocument()
    expect(screen.getByText('Aplicadas')).toBeInTheDocument()
    expect(screen.getByText('Descartadas')).toBeInTheDocument()
  })

  it('muestra los valores numéricos correctos', () => {
    render(<AIStatusChart active={5} applied={12} dismissed={3} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renderiza aunque todos los valores sean 0', () => {
    render(<AIStatusChart active={0} applied={0} dismissed={0} />)
    expect(screen.getByText('Activas')).toBeInTheDocument()
  })

  it('muestra las descripciones de cada stat', () => {
    render(<AIStatusChart active={1} applied={2} dismissed={3} />)
    expect(screen.getByText('Pendientes de revisión')).toBeInTheDocument()
    expect(screen.getByText('Acciones ejecutadas')).toBeInTheDocument()
    expect(screen.getByText('Ignoradas o rechazadas')).toBeInTheDocument()
  })
})
