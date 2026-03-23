import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InlineImageEditor } from '@/components/dashboard/email-builder/block-editors/InlineImageEditor'
import type { ImageBlock } from '@/lib/email-blocks'

// Mock fetch for upload
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeBlock(overrides?: Partial<ImageBlock['props']>): ImageBlock {
  return {
    id: 'image-1',
    type: 'image',
    props: {
      src: '',
      alt: '',
      width: 100,
      align: 'center',
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('InlineImageEditor — toolbar', () => {
  it('renderiza la toolbar con todos los controles', () => {
    render(<InlineImageEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-image-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('inline-image-upload-btn')).toBeInTheDocument()
    expect(screen.getByTestId('inline-image-alt-input')).toBeInTheDocument()
    expect(screen.getByTestId('inline-image-align-select')).toBeInTheDocument()
    expect(screen.getByTestId('inline-image-link-input')).toBeInTheDocument()
  })

  it('no muestra botón Quitar cuando no hay imagen', () => {
    render(<InlineImageEditor block={makeBlock({ src: '' })} onUpdate={vi.fn()} />)
    expect(screen.queryByTestId('inline-image-remove-btn')).not.toBeInTheDocument()
  })

  it('muestra botón Quitar cuando hay imagen', () => {
    render(<InlineImageEditor block={makeBlock({ src: 'https://img.com/a.jpg' })} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-image-remove-btn')).toBeInTheDocument()
  })

  it('click en Quitar llama onUpdate con src vacío', () => {
    const onUpdate = vi.fn()
    render(<InlineImageEditor block={makeBlock({ src: 'https://img.com/a.jpg' })} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByTestId('inline-image-remove-btn'))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ src: '' }) })
    )
  })

  it('cambiar alt llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineImageEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-image-alt-input'), { target: { value: 'Mi imagen' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ alt: 'Mi imagen' }) })
    )
  })

  it('cambiar align llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineImageEditor block={makeBlock({ align: 'center' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-image-align-select'), { target: { value: 'left' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ align: 'left' }) })
    )
  })

  it('cambiar linkUrl llama onUpdate', () => {
    const onUpdate = vi.fn()
    render(<InlineImageEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-image-link-input'), { target: { value: 'https://dest.com' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ linkUrl: 'https://dest.com' }) })
    )
  })

  it('linkUrl vacío llama onUpdate con linkUrl: undefined', () => {
    const onUpdate = vi.fn()
    render(<InlineImageEditor block={makeBlock({ linkUrl: 'https://viejo.com' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-image-link-input'), { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ linkUrl: undefined }) })
    )
  })
})
