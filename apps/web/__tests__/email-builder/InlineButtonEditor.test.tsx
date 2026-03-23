import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InlineButtonEditor } from '@/components/dashboard/email-builder/block-editors/InlineButtonEditor'
import type { ButtonBlock } from '@/lib/email-blocks'

function makeBlock(overrides?: Partial<ButtonBlock['props']>): ButtonBlock {
  return {
    id: 'button-1',
    type: 'button',
    props: {
      text: 'Confirmar asistencia',
      url: 'https://example.com',
      bgColor: '#2960ec',
      textColor: '#ffffff',
      size: 'md',
      align: 'center',
      borderRadius: 'sm',
      ...overrides,
    },
  }
}

describe('InlineButtonEditor — toolbar', () => {
  it('renderiza la toolbar con todos los controles', () => {
    render(<InlineButtonEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-button-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('inline-button-url-input')).toBeInTheDocument()
    expect(screen.getByTestId('inline-button-bg-color')).toBeInTheDocument()
    expect(screen.getByTestId('inline-button-text-color')).toBeInTheDocument()
    expect(screen.getByTestId('inline-button-size-select')).toBeInTheDocument()
    expect(screen.getByTestId('inline-button-radius-select')).toBeInTheDocument()
    expect(screen.getByTestId('inline-button-align-select')).toBeInTheDocument()
  })

  it('cambiar URL llama onUpdate con la nueva URL', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-url-input'), { target: { value: 'https://nuevo.com' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ url: 'https://nuevo.com' }) })
    )
  })

  it('cambiar bgColor llama onUpdate con el nuevo color', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-bg-color'), { target: { value: '#ff0000' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ bgColor: '#ff0000' }) })
    )
  })

  it('cambiar textColor llama onUpdate con el nuevo color', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-text-color'), { target: { value: '#000000' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ textColor: '#000000' }) })
    )
  })

  it('cambiar size llama onUpdate con el nuevo tamaño', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock({ size: 'md' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-size-select'), { target: { value: 'lg' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ size: 'lg' }) })
    )
  })

  it('cambiar borderRadius llama onUpdate con el nuevo radio', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock({ borderRadius: 'sm' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-radius-select'), { target: { value: 'full' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ borderRadius: 'full' }) })
    )
  })

  it('cambiar align llama onUpdate con la nueva alineación', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock({ align: 'center' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-align-select'), { target: { value: 'left' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ align: 'left' }) })
    )
  })
})

describe('InlineButtonEditor — contenido editable', () => {
  it('renderiza el input del texto del botón', () => {
    render(<InlineButtonEditor block={makeBlock({ text: 'Click aquí' })} onUpdate={vi.fn()} />)
    const input = screen.getByTestId('inline-button-text-input') as HTMLInputElement
    expect(input.value).toBe('Click aquí')
  })

  it('cambiar texto del botón llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineButtonEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-button-text-input'), { target: { value: 'Nuevo texto' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ text: 'Nuevo texto' }) })
    )
  })
})
