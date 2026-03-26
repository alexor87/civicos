import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TagInput } from '@/components/contacts/selectors/TagInput'

describe('TagInput', () => {
  it('renders input field', () => {
    render(<TagInput value={[]} onChange={() => {}} />)
    expect(screen.getByLabelText('Agregar etiqueta')).toBeInTheDocument()
  })

  it('renders existing tags', () => {
    render(<TagInput value={['lider', 'juvenil']} onChange={() => {}} />)
    expect(screen.getByText('lider')).toBeInTheDocument()
    expect(screen.getByText('juvenil')).toBeInTheDocument()
  })

  it('adds tag on Enter', () => {
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByLabelText('Agregar etiqueta')
    fireEvent.change(input, { target: { value: 'nuevo' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['nuevo'])
  })

  it('adds tag on comma', () => {
    const onChange = vi.fn()
    render(<TagInput value={['existente']} onChange={onChange} />)
    const input = screen.getByLabelText('Agregar etiqueta')
    fireEvent.change(input, { target: { value: 'nuevo' } })
    fireEvent.keyDown(input, { key: ',' })
    expect(onChange).toHaveBeenCalledWith(['existente', 'nuevo'])
  })

  it('removes tag when X is clicked', () => {
    const onChange = vi.fn()
    render(<TagInput value={['lider', 'juvenil']} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Eliminar lider'))
    expect(onChange).toHaveBeenCalledWith(['juvenil'])
  })

  it('does not add duplicate tags', () => {
    const onChange = vi.fn()
    render(<TagInput value={['lider']} onChange={onChange} />)
    const input = screen.getByLabelText('Agregar etiqueta')
    fireEvent.change(input, { target: { value: 'lider' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes last tag on Backspace when input is empty', () => {
    const onChange = vi.fn()
    render(<TagInput value={['a', 'b']} onChange={onChange} />)
    const input = screen.getByLabelText('Agregar etiqueta')
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith(['a'])
  })
})
