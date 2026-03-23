import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Mock Tiptap ───────────────────────────────────────────────────────────────
// Tiptap uses ProseMirror browser APIs not available in jsdom, so we mock
// the hook and EditorContent to isolate our toolbar UI logic.

const mockChain = {
  focus:           vi.fn().mockReturnThis(),
  toggleBold:      vi.fn().mockReturnThis(),
  toggleItalic:    vi.fn().mockReturnThis(),
  toggleUnderline: vi.fn().mockReturnThis(),
  toggleStrike:    vi.fn().mockReturnThis(),
  setTextAlign:    vi.fn().mockReturnThis(),
  toggleBulletList:  vi.fn().mockReturnThis(),
  toggleOrderedList: vi.fn().mockReturnThis(),
  setLink:         vi.fn().mockReturnThis(),
  unsetLink:       vi.fn().mockReturnThis(),
  clearNodes:      vi.fn().mockReturnThis(),
  unsetAllMarks:   vi.fn().mockReturnThis(),
  run:             vi.fn(),
}

let mockHtmlOutput = '<p>Contenido de prueba</p>'
let mockIsActive = (_: string) => false
let mockGetAttributes = (_: string) => ({} as Record<string, unknown>)

const mockEditor = {
  chain:         () => mockChain,
  isActive:      (name: string) => mockIsActive(name),
  getHTML:       () => mockHtmlOutput,
  getAttributes: (name: string) => mockGetAttributes(name),
}

vi.mock('@tiptap/react', () => ({
  useEditor:     vi.fn(() => mockEditor),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="tiptap-editor-mock">
      {editor ? 'editor activo' : 'editor nulo'}
    </div>
  ),
}))

vi.mock('@tiptap/starter-kit',          () => ({ default: {} }))
vi.mock('@tiptap/extension-underline',  () => ({ default: {} }))
vi.mock('@tiptap/extension-link',       () => ({ default: { configure: vi.fn(() => ({})) } }))
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }))
vi.mock('@tiptap/extension-text-style', () => ({ default: {} }))
vi.mock('@tiptap/extension-color',      () => ({ default: {} }))

import { TextBlockEditor } from '@/components/dashboard/email-builder/block-editors/TextBlockEditor'
import type { TextBlock } from '@/lib/email-blocks'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBlock(overrides?: Partial<TextBlock['props']>): TextBlock {
  return {
    id: 'text-1',
    type: 'text',
    props: {
      content: '<p>Hola mundo</p>',
      fontSize: 'md',
      align: 'left',
      color: '#586069',
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(mockChain, {
    focus:           vi.fn().mockReturnThis(),
    toggleBold:      vi.fn().mockReturnThis(),
    toggleItalic:    vi.fn().mockReturnThis(),
    toggleUnderline: vi.fn().mockReturnThis(),
    toggleStrike:    vi.fn().mockReturnThis(),
    setTextAlign:    vi.fn().mockReturnThis(),
    toggleBulletList:  vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    setLink:         vi.fn().mockReturnThis(),
    unsetLink:       vi.fn().mockReturnThis(),
    clearNodes:      vi.fn().mockReturnThis(),
    unsetAllMarks:   vi.fn().mockReturnThis(),
    run:             vi.fn(),
  })
  mockIsActive = () => false
  mockGetAttributes = () => ({})
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TextBlockEditor — toolbar', () => {
  it('renderiza la barra de herramientas con todos los botones clave', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    expect(screen.getByTestId('rich-text-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-bold')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-italic')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-underline')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-strike')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-align-left')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-align-center')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-align-right')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-align-justify')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-ordered-list')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-link')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-clear')).toBeInTheDocument()
  })

  it('click en Bold llama chain().focus().toggleBold().run()', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-bold'))
    expect(mockChain.toggleBold).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Italic llama toggleItalic', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-italic'))
    expect(mockChain.toggleItalic).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Underline llama toggleUnderline', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-underline'))
    expect(mockChain.toggleUnderline).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Strikethrough llama toggleStrike', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-strike'))
    expect(mockChain.toggleStrike).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en AlignCenter llama setTextAlign("center")', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-align-center'))
    expect(mockChain.setTextAlign).toHaveBeenCalledWith('center')
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en BulletList llama toggleBulletList', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-bullet-list'))
    expect(mockChain.toggleBulletList).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en OrderedList llama toggleOrderedList', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-ordered-list'))
    expect(mockChain.toggleOrderedList).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en ClearFormatting llama clearNodes y unsetAllMarks', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-clear'))
    expect(mockChain.clearNodes).toHaveBeenCalled()
    expect(mockChain.unsetAllMarks).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })
})

describe('TextBlockEditor — link dialog', () => {
  it('click en toolbar-link muestra el link dialog', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    expect(screen.queryByTestId('link-dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('toolbar-link'))
    expect(screen.getByTestId('link-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('link-url-input')).toBeInTheDocument()
  })

  it('click en OK guarda el link y cierra el dialog', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-link'))
    const input = screen.getByTestId('link-url-input')
    fireEvent.change(input, { target: { value: 'https://civicos.co' } })
    fireEvent.click(screen.getByTestId('link-save-btn'))
    expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://civicos.co' })
    expect(mockChain.run).toHaveBeenCalled()
    expect(screen.queryByTestId('link-dialog')).not.toBeInTheDocument()
  })

  it('Enter en el input guarda el link', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-link'))
    const input = screen.getByTestId('link-url-input')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
  })

  it('muestra botón Quitar cuando hay link activo', () => {
    mockGetAttributes = (name: string) => name === 'link' ? { href: 'https://civicos.co' } : {}
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-link'))
    expect(screen.getByTestId('link-remove-btn')).toBeInTheDocument()
  })

  it('click en Quitar llama unsetLink', () => {
    mockGetAttributes = (name: string) => name === 'link' ? { href: 'https://civicos.co' } : {}
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toolbar-link'))
    fireEvent.click(screen.getByTestId('link-remove-btn'))
    expect(mockChain.unsetLink).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })
})

describe('TextBlockEditor — controles de bloque', () => {
  it('renderiza el dropdown de tamaño de fuente en la toolbar', () => {
    render(<TextBlockEditor block={makeBlock({ fontSize: '16' })} onChange={vi.fn()} />)
    expect(screen.getByTestId('font-size-select')).toBeInTheDocument()
  })

  it('normaliza fontSize legacy "md" a "16" en el select', () => {
    render(<TextBlockEditor block={makeBlock({ fontSize: 'md' })} onChange={vi.fn()} />)
    const select = screen.getByTestId('font-size-select') as HTMLSelectElement
    expect(select.value).toBe('16')
  })

  it('cambiar el select llama onChange con el nuevo fontSize numérico', () => {
    const onChange = vi.fn()
    render(<TextBlockEditor block={makeBlock({ fontSize: '16' })} onChange={onChange} />)
    fireEvent.change(screen.getByTestId('font-size-select'), { target: { value: '24' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ fontSize: '24' }) })
    )
  })

  it('el dropdown incluye las opciones esperadas (8, 16, 72)', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    const select = screen.getByTestId('font-size-select') as HTMLSelectElement
    const values = Array.from(select.options).map(o => o.value)
    expect(values).toContain('8')
    expect(values).toContain('16')
    expect(values).toContain('72')
  })

  it('no muestra dropdowns de Tamaño y Alineación en el panel inferior', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    // Los selects de bloque fueron eliminados
    expect(screen.queryByText('Tamaño')).not.toBeInTheDocument()
    expect(screen.queryByText('Alineación')).not.toBeInTheDocument()
  })

  it('renderiza el editor Tiptap', () => {
    render(<TextBlockEditor block={makeBlock()} onChange={vi.fn()} />)
    expect(screen.getByTestId('tiptap-editor-mock')).toBeInTheDocument()
    expect(screen.getByText('editor activo')).toBeInTheDocument()
  })

  it('renderiza el selector de color', () => {
    render(<TextBlockEditor block={makeBlock({ color: '#ff0000' })} onChange={vi.fn()} />)
    expect(screen.getByText('Color de texto')).toBeInTheDocument()
    // Both the color picker and text input have #ff0000 value
    const colorInputs = screen.getAllByDisplayValue('#ff0000')
    expect(colorInputs.length).toBeGreaterThanOrEqual(1)
  })
})
