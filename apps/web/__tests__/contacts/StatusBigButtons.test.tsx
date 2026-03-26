import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatusBigButtons } from '@/components/contacts/selectors/StatusBigButtons'

describe('StatusBigButtons', () => {
  it('renders 4 status buttons', () => {
    render(<StatusBigButtons value="unknown" onChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(4)
  })

  it('displays status labels', () => {
    render(<StatusBigButtons value="unknown" onChange={() => {}} />)
    expect(screen.getByText('Simpatizante')).toBeInTheDocument()
    expect(screen.getByText('Indeciso')).toBeInTheDocument()
    expect(screen.getByText('Opositor')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('calls onChange when a button is clicked', () => {
    const onChange = vi.fn()
    render(<StatusBigButtons value="unknown" onChange={onChange} />)
    fireEvent.click(screen.getByText('Simpatizante'))
    expect(onChange).toHaveBeenCalledWith('supporter')
  })

  it('highlights the selected value', () => {
    render(<StatusBigButtons value="supporter" onChange={() => {}} />)
    const button = screen.getByText('Simpatizante').closest('[role="radio"]')
    expect(button).toHaveAttribute('aria-checked', 'true')
  })

  it('has accessible radiogroup role', () => {
    render(<StatusBigButtons value="unknown" onChange={() => {}} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('shows correct color for each status', () => {
    const { container } = render(<StatusBigButtons value="supporter" onChange={() => {}} />)
    // Supporter button should have green styling
    const supporterBtn = screen.getByText('Simpatizante').closest('[role="radio"]')
    expect(supporterBtn?.className).toMatch(/green|emerald/)
  })
})
