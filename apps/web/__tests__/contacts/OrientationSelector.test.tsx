import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrientationSelector } from '@/components/contacts/selectors/OrientationSelector'

describe('OrientationSelector', () => {
  it('renders three orientation cards', () => {
    render(<OrientationSelector value={null} onChange={() => {}} />)
    expect(screen.getByText('Derecha')).toBeInTheDocument()
    expect(screen.getByText('Centro')).toBeInTheDocument()
    expect(screen.getByText('Izquierda')).toBeInTheDocument()
  })

  it('calls onChange with the selected value', () => {
    const onChange = vi.fn()
    render(<OrientationSelector value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText('Centro'))
    expect(onChange).toHaveBeenCalledWith('centro')
  })

  it('deselects when clicking the already selected value', () => {
    const onChange = vi.fn()
    render(<OrientationSelector value="centro" onChange={onChange} />)
    fireEvent.click(screen.getByText('Centro'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('marks selected card with aria-checked', () => {
    render(<OrientationSelector value="izquierda" onChange={() => {}} />)
    const selected = screen.getByText('Izquierda').closest('button')
    expect(selected).toHaveAttribute('aria-checked', 'true')
    const other = screen.getByText('Derecha').closest('button')
    expect(other).toHaveAttribute('aria-checked', 'false')
  })
})
