import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SegmentFilterBuilder } from '@/components/dashboard/SegmentFilterBuilder'

describe('SegmentFilterBuilder', () => {
  it('renders empty state with no filters', () => {
    render(<SegmentFilterBuilder />)
    expect(screen.getByText(/Sin filtros/i)).toBeDefined()
    expect(screen.getByText(/0/)).toBeDefined()
  })

  it('adds a filter row when clicking "Agregar filtro"', () => {
    render(<SegmentFilterBuilder />)
    fireEvent.click(screen.getByText(/Agregar filtro/i))
    // hidden input should now have 1 filter
    const input = document.querySelector<HTMLInputElement>('input[name="filters"]')
    expect(input).not.toBeNull()
    const parsed = JSON.parse(input!.value)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(1)
  })

  it('removes a filter row when clicking trash button', () => {
    render(<SegmentFilterBuilder />)
    fireEvent.click(screen.getByText(/Agregar filtro/i))

    // Should have one trash button
    const trashBtn = screen.getByLabelText(/Eliminar filtro/i)
    fireEvent.click(trashBtn)

    const input = document.querySelector<HTMLInputElement>('input[name="filters"]')
    const parsed = JSON.parse(input!.value)
    expect(parsed.length).toBe(0)
  })

  it('serializes filters to hidden input as JSON', () => {
    render(<SegmentFilterBuilder />)
    fireEvent.click(screen.getByText(/Agregar filtro/i))

    const input = document.querySelector<HTMLInputElement>('input[name="filters"]')
    const parsed = JSON.parse(input!.value)
    expect(parsed[0]).toHaveProperty('field', 'status')
    expect(parsed[0]).toHaveProperty('operator', 'eq')
    expect(parsed[0]).toHaveProperty('value', 'supporter')
  })

  it('renders with initial filters', () => {
    const initial = [{ field: 'department' as const, operator: 'eq' as const, value: 'Bogotá' }]
    render(<SegmentFilterBuilder initial={initial} />)

    const input = document.querySelector<HTMLInputElement>('input[name="filters"]')
    const parsed = JSON.parse(input!.value)
    expect(parsed.length).toBe(1)
    expect(parsed[0].field).toBe('department')
    expect(parsed[0].value).toBe('Bogotá')
  })

  it('shows filter count label', () => {
    render(<SegmentFilterBuilder />)
    expect(screen.getByText('(0)')).toBeDefined()
    fireEvent.click(screen.getByText(/Agregar filtro/i))
    expect(screen.getByText('(1)')).toBeDefined()
    fireEvent.click(screen.getByText(/Agregar filtro/i))
    expect(screen.getByText('(2)')).toBeDefined()
  })
})
