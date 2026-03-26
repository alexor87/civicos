import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PartyCombobox } from '@/components/contacts/selectors/PartyCombobox'

// Note: cmdk has a React duplication issue in jsdom (same as react-leaflet).
// We test the closed-state rendering; popover interaction is covered by e2e.

describe('PartyCombobox', () => {
  it('renders with placeholder when no value', () => {
    render(<PartyCombobox value="" onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Seleccionar partido...')
  })

  it('renders current value', () => {
    render(<PartyCombobox value="Alianza Verde" onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Alianza Verde')
  })

  it('renders a button trigger', () => {
    render(<PartyCombobox value="" onChange={() => {}} />)
    const btn = screen.getByRole('combobox')
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows chevrons icon', () => {
    const { container } = render(<PartyCombobox value="" onChange={() => {}} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
