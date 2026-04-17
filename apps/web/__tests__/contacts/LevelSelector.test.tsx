import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LevelSelector } from '@/components/contacts/LevelSelector'

describe('LevelSelector', () => {
  it('renders 3 level options', () => {
    render(<LevelSelector onSelect={() => {}} />)
    expect(screen.getByText('Completo')).toBeInTheDocument()
    expect(screen.getByText('Opinión')).toBeInTheDocument()
    expect(screen.getByText('Anónimo')).toBeInTheDocument()
  })

  it('renders descriptions for each level', () => {
    render(<LevelSelector onSelect={() => {}} />)
    expect(screen.getByText('Contacto con datos completos')).toBeInTheDocument()
    expect(screen.getByText('Solo nombre y opinión política')).toBeInTheDocument()
    expect(screen.getByText('Voto anónimo, sin datos personales')).toBeInTheDocument()
  })

  it('calls onSelect when a level is clicked', () => {
    const onSelect = vi.fn()
    render(<LevelSelector onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Opinión'))
    expect(onSelect).toHaveBeenCalledWith('opinion')
  })

  it('calls onSelect with anonimo when clicked', () => {
    const onSelect = vi.fn()
    render(<LevelSelector onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Anónimo'))
    expect(onSelect).toHaveBeenCalledWith('anonimo')
  })

  it('renders title and subtitle', () => {
    render(<LevelSelector onSelect={() => {}} />)
    expect(screen.getByText('¿Qué tipo de contacto vas a registrar?')).toBeInTheDocument()
  })
})
