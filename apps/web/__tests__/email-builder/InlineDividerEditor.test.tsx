import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InlineDividerEditor } from '@/components/dashboard/email-builder/block-editors/InlineDividerEditor'
import type { DividerBlock } from '@/lib/email-blocks'

function makeBlock(overrides?: Partial<DividerBlock['props']>): DividerBlock {
  return {
    id: 'divider-1',
    type: 'divider',
    props: {
      color: '#e2e8f0',
      thickness: 1,
      marginTop: 16,
      marginBottom: 16,
      ...overrides,
    },
  }
}

describe('InlineDividerEditor — toolbar', () => {
  it('renderiza la toolbar con todos los controles', () => {
    render(<InlineDividerEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-divider-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('inline-divider-color')).toBeInTheDocument()
    expect(screen.getByTestId('inline-divider-thickness')).toBeInTheDocument()
    expect(screen.getByTestId('inline-divider-margin-top')).toBeInTheDocument()
    expect(screen.getByTestId('inline-divider-margin-bottom')).toBeInTheDocument()
  })

  it('cambiar color llama onUpdate con el nuevo color', () => {
    const onUpdate = vi.fn()
    render(<InlineDividerEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-divider-color'), { target: { value: '#ff0000' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ color: '#ff0000' }) })
    )
  })

  it('cambiar thickness llama onUpdate con el nuevo grosor', () => {
    const onUpdate = vi.fn()
    render(<InlineDividerEditor block={makeBlock({ thickness: 1 })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-divider-thickness'), { target: { value: '2' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ thickness: 2 }) })
    )
  })

  it('cambiar marginTop llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineDividerEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-divider-margin-top'), { target: { value: '24' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ marginTop: 24 }) })
    )
  })

  it('cambiar marginBottom llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineDividerEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-divider-margin-bottom'), { target: { value: '32' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ marginBottom: 32 }) })
    )
  })
})

describe('InlineDividerEditor — preview', () => {
  it('renderiza el preview del divisor', () => {
    render(<InlineDividerEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-divider-preview')).toBeInTheDocument()
  })
})
