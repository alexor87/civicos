import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AffinitySelector } from '@/components/contacts/selectors/AffinitySelector'

describe('AffinitySelector', () => {
  it('renders 5 affinity buttons', () => {
    render(<AffinitySelector value={null} onChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(5)
  })

  it('displays affinity labels', () => {
    render(<AffinitySelector value={null} onChange={() => {}} />)
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Escéptico')).toBeInTheDocument()
    expect(screen.getByText('Neutro')).toBeInTheDocument()
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
    expect(screen.getByText('Aliado')).toBeInTheDocument()
  })

  it('calls onChange when a button is clicked', () => {
    const onChange = vi.fn()
    render(<AffinitySelector value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText('Simpatizante'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('highlights the selected value', () => {
    render(<AffinitySelector value={3} onChange={() => {}} />)
    const neutroButton = screen.getByText('Neutro').closest('[role="radio"]')
    expect(neutroButton).toHaveAttribute('aria-checked', 'true')
  })

  it('supports small size variant', () => {
    const { container } = render(<AffinitySelector value={null} onChange={() => {}} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })

  it('has accessible radiogroup role', () => {
    render(<AffinitySelector value={null} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('allows deselecting (toggle off)', () => {
    const onChange = vi.fn()
    render(<AffinitySelector value={3} onChange={onChange} />)
    fireEvent.click(screen.getByText('Neutro'))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
