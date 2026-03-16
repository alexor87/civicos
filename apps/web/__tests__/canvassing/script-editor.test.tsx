import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScriptEditor } from '@/components/dashboard/ScriptEditor'

describe('ScriptEditor', () => {
  it('renders empty state with no questions', () => {
    render(<ScriptEditor />)
    expect(screen.getByText(/Sin preguntas aún/i)).toBeDefined()
  })

  it('adds a question when clicking "Agregar pregunta"', () => {
    render(<ScriptEditor />)
    const addBtn = screen.getByText(/Agregar pregunta/i)
    fireEvent.click(addBtn)
    expect(screen.getByPlaceholderText(/Texto de la pregunta/i)).toBeDefined()
  })

  it('removes a question when clicking the trash button', () => {
    render(<ScriptEditor />)
    fireEvent.click(screen.getByText(/Agregar pregunta/i))
    // find the delete button (Trash2 icon button)
    const trashBtns = screen.getAllByRole('button').filter(b => b.classList.contains('text-red-400') || b.className.includes('red'))
    expect(trashBtns.length).toBeGreaterThan(0)
    fireEvent.click(trashBtns[trashBtns.length - 1])
    expect(screen.queryByPlaceholderText(/Texto de la pregunta/i)).toBeNull()
  })

  it('serializes questions to hidden input as JSON', () => {
    const { container } = render(<ScriptEditor />)
    fireEvent.click(screen.getByText(/Agregar pregunta/i))

    const input = container.querySelector<HTMLInputElement>('input[name="questions"]')
    expect(input).not.toBeNull()
    const parsed = JSON.parse(input!.value)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(1)
    expect(parsed[0]).toHaveProperty('type', 'single_select')
  })

  it('shows options editor for single_select type', () => {
    render(<ScriptEditor />)
    fireEvent.click(screen.getByText(/Agregar pregunta/i))
    // single_select is default — options editor should appear
    expect(screen.getByText(/Opciones/i)).toBeDefined()
    expect(screen.getByText(/Agregar opción/i)).toBeDefined()
  })

  it('hides options editor for yes_no type', () => {
    render(<ScriptEditor />)
    fireEvent.click(screen.getByText(/Agregar pregunta/i))

    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'yes_no' } })

    expect(screen.queryByText(/Agregar opción/i)).toBeNull()
  })

  it('shows max_length field for text_free type', () => {
    render(<ScriptEditor />)
    fireEvent.click(screen.getByText(/Agregar pregunta/i))

    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'text_free' } })

    expect(screen.getByText(/Máx chars/i)).toBeDefined()
  })

  it('updates question count label as questions are added', () => {
    render(<ScriptEditor />)
    expect(screen.getByText('0 preguntas')).toBeDefined()
    fireEvent.click(screen.getByText(/Agregar pregunta/i))
    expect(screen.getByText('1 pregunta')).toBeDefined()
    fireEvent.click(screen.getByText(/Agregar pregunta/i))
    expect(screen.getByText('2 preguntas')).toBeDefined()
  })
})
