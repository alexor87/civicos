import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VoteIntentionSelector } from '@/components/contacts/selectors/VoteIntentionSelector'

describe('VoteIntentionSelector', () => {
  it('renders 3 vote intention options', () => {
    render(<VoteIntentionSelector value={null} onChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(3)
  })

  it('displays correct labels', () => {
    render(<VoteIntentionSelector value={null} onChange={() => {}} />)
    expect(screen.getByText(/Sí, votará/)).toBeInTheDocument()
    expect(screen.getByText(/No votará/)).toBeInTheDocument()
    expect(screen.getByText('Indeciso')).toBeInTheDocument()
  })

  it('calls onChange when clicked', () => {
    const onChange = vi.fn()
    render(<VoteIntentionSelector value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText(/Sí, votará/))
    expect(onChange).toHaveBeenCalledWith('si')
  })

  it('highlights selected value', () => {
    render(<VoteIntentionSelector value="si" onChange={() => {}} />)
    const btn = screen.getByText(/Sí, votará/).closest('[role="radio"]')
    expect(btn).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles off when clicking selected', () => {
    const onChange = vi.fn()
    render(<VoteIntentionSelector value="si" onChange={onChange} />)
    fireEvent.click(screen.getByText(/Sí, votará/))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('has radiogroup role', () => {
    render(<VoteIntentionSelector value={null} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
})
