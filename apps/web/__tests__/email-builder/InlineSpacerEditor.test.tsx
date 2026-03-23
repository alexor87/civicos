import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InlineSpacerEditor } from '@/components/dashboard/email-builder/block-editors/InlineSpacerEditor'
import type { SpacerBlock } from '@/lib/email-blocks'

function makeBlock(overrides?: Partial<SpacerBlock['props']>): SpacerBlock {
  return {
    id: 'spacer-1',
    type: 'spacer',
    props: {
      height: 32,
      ...overrides,
    },
  }
}

describe('InlineSpacerEditor — toolbar', () => {
  it('renderiza la toolbar con los controles de altura', () => {
    render(<InlineSpacerEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-spacer-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('inline-spacer-height-range')).toBeInTheDocument()
    expect(screen.getByTestId('inline-spacer-height-input')).toBeInTheDocument()
  })

  it('muestra el valor actual de height', () => {
    render(<InlineSpacerEditor block={makeBlock({ height: 48 })} onUpdate={vi.fn()} />)
    const input = screen.getByTestId('inline-spacer-height-input') as HTMLInputElement
    expect(input.value).toBe('48')
  })

  it('cambiar height via input llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineSpacerEditor block={makeBlock({ height: 32 })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-spacer-height-input'), { target: { value: '64' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ height: 64 }) })
    )
  })

  it('cambiar height via slider llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineSpacerEditor block={makeBlock({ height: 32 })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-spacer-height-range'), { target: { value: '80' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ height: 80 }) })
    )
  })

  it('clampea height al mínimo de 8', () => {
    const onUpdate = vi.fn()
    render(<InlineSpacerEditor block={makeBlock({ height: 32 })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-spacer-height-input'), { target: { value: '0' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ height: 8 }) })
    )
  })

  it('clampea height al máximo de 120', () => {
    const onUpdate = vi.fn()
    render(<InlineSpacerEditor block={makeBlock({ height: 32 })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-spacer-height-input'), { target: { value: '200' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ height: 120 }) })
    )
  })
})

describe('InlineSpacerEditor — preview', () => {
  it('renderiza el preview del espaciador', () => {
    render(<InlineSpacerEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-spacer-preview')).toBeInTheDocument()
  })
})
