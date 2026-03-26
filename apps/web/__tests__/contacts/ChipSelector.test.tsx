import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChipSelector } from '@/components/contacts/selectors/ChipSelector'

const options = ['Empleo', 'Salud', 'Vivienda', 'Educación']

describe('ChipSelector', () => {
  it('renders all options as chips', () => {
    render(<ChipSelector options={options} value={[]} onChange={() => {}} />)
    for (const opt of options) {
      expect(screen.getByText(opt)).toBeInTheDocument()
    }
  })

  it('adds option when clicked', () => {
    const onChange = vi.fn()
    render(<ChipSelector options={options} value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('Empleo'))
    expect(onChange).toHaveBeenCalledWith(['Empleo'])
  })

  it('removes option when clicked again', () => {
    const onChange = vi.fn()
    render(<ChipSelector options={options} value={['Empleo', 'Salud']} onChange={onChange} />)
    fireEvent.click(screen.getByText('Empleo'))
    expect(onChange).toHaveBeenCalledWith(['Salud'])
  })

  it('marks selected chips with aria-checked', () => {
    render(<ChipSelector options={options} value={['Salud']} onChange={() => {}} />)
    const saludChip = screen.getByText('Salud').closest('[role="checkbox"]')
    expect(saludChip).toHaveAttribute('aria-checked', 'true')
    const empleoChip = screen.getByText('Empleo').closest('[role="checkbox"]')
    expect(empleoChip).toHaveAttribute('aria-checked', 'false')
  })

  it('has group role', () => {
    render(<ChipSelector options={options} value={[]} onChange={() => {}} />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })
})
