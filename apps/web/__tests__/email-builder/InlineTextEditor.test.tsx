import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Mock Tiptap ────────────────────────────────────────────────────────────────

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
  setMark:         vi.fn().mockReturnThis(),
  removeEmptyTextStyle: vi.fn().mockReturnThis(),
  setFontSize:     vi.fn().mockReturnThis(),
  setColor:        vi.fn().mockReturnThis(),
  undo:            vi.fn().mockReturnThis(),
  redo:            vi.fn().mockReturnThis(),
  run:             vi.fn(),
}

let mockIsActive = (_: string | object) => false
let mockGetAttributes = (_: string) => ({} as Record<string, unknown>)
let mockCanUndo = false
let mockCanRedo = false

const mockCommands = {
  undo: vi.fn(),
  redo: vi.fn(),
}

const mockEditor = {
  chain:         () => mockChain,
  commands:      mockCommands,
  isActive:      (name: string | object) => mockIsActive(name),
  getHTML:       () => '<p>Contenido de prueba</p>',
  getAttributes: (name: string) => mockGetAttributes(name),
  can:           () => ({ undo: () => mockCanUndo, redo: () => mockCanRedo }),
}

vi.mock('@tiptap/react', () => ({
  useEditor:     vi.fn(() => mockEditor),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="inline-tiptap-editor-mock">
      {editor ? 'editor activo' : 'editor nulo'}
    </div>
  ),
}))

// Mock @tiptap/core Extension used by the inline FontSize extension
vi.mock('@tiptap/core', () => ({
  Extension: {
    create: vi.fn(() => ({})),
  },
}))

vi.mock('@tiptap/starter-kit',          () => ({ default: {} }))
vi.mock('@tiptap/extension-underline',  () => ({ default: {} }))
vi.mock('@tiptap/extension-link',       () => ({ default: { configure: vi.fn(() => ({})) } }))
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }))
vi.mock('@tiptap/extension-text-style', () => ({ default: {} }))
vi.mock('@tiptap/extension-color',      () => ({ default: {} }))

import { InlineTextEditor } from '@/components/dashboard/email-builder/block-editors/InlineTextEditor'
import type { TextBlock } from '@/lib/email-blocks'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBlock(overrides?: Partial<TextBlock['props']>): TextBlock {
  return {
    id: 'text-1',
    type: 'text',
    props: {
      content: '<p>Hola mundo</p>',
      fontSize: '16',
      align: 'left',
      color: '#586069',
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(mockCommands, {
    undo: vi.fn(),
    redo: vi.fn(),
  })
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
    setMark:         vi.fn().mockReturnThis(),
    removeEmptyTextStyle: vi.fn().mockReturnThis(),
    setFontSize:     vi.fn().mockReturnThis(),
    setColor:        vi.fn().mockReturnThis(),
    undo:            vi.fn().mockReturnThis(),
    redo:            vi.fn().mockReturnThis(),
    run:             vi.fn(),
  })
  mockIsActive = () => false
  mockGetAttributes = () => ({})
  mockCanUndo = false
  mockCanRedo = false
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InlineTextEditor — toolbar', () => {
  it('renderiza la toolbar con todos los botones', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-bold')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-italic')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-underline')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-strike')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-align-left')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-align-center')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-align-right')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-align-justify')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-ordered-list')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-link')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-clear')).toBeInTheDocument()
    expect(screen.getByTestId('inline-font-size-select')).toBeInTheDocument()
    expect(screen.getByTestId('inline-color-picker')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-undo')).toBeInTheDocument()
    expect(screen.getByTestId('inline-toolbar-redo')).toBeInTheDocument()
  })

  it('click en Bold llama toggleBold', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-bold'))
    expect(mockChain.toggleBold).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Italic llama toggleItalic', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-italic'))
    expect(mockChain.toggleItalic).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Underline llama toggleUnderline', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-underline'))
    expect(mockChain.toggleUnderline).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Strikethrough llama toggleStrike', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-strike'))
    expect(mockChain.toggleStrike).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en AlignCenter llama setTextAlign("center") y actualiza block.props.align', () => {
    const onUpdate = vi.fn()
    render(<InlineTextEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-align-center'))
    expect(mockChain.setTextAlign).toHaveBeenCalledWith('center')
    expect(mockChain.run).toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ align: 'center' }) })
    )
  })

  it('click en BulletList llama toggleBulletList', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-bullet-list'))
    expect(mockChain.toggleBulletList).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en OrderedList llama toggleOrderedList', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-ordered-list'))
    expect(mockChain.toggleOrderedList).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Clear llama clearNodes y unsetAllMarks', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-clear'))
    expect(mockChain.clearNodes).toHaveBeenCalled()
    expect(mockChain.unsetAllMarks).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Undo llama commands.undo() cuando hay historial', () => {
    mockCanUndo = true
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-undo'))
    expect(mockCommands.undo).toHaveBeenCalled()
  })

  it('click en Redo llama commands.redo() cuando hay historial', () => {
    mockCanRedo = true
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-redo'))
    expect(mockCommands.redo).toHaveBeenCalled()
  })

  it('botón Undo está deshabilitado cuando no hay historial', () => {
    mockCanUndo = false
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-toolbar-undo')).toBeDisabled()
  })

  it('botón Redo está deshabilitado cuando no hay historial', () => {
    mockCanRedo = false
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-toolbar-redo')).toBeDisabled()
  })
})

describe('InlineTextEditor — font size per-selection', () => {
  it('el select muestra el fontSize del bloque como fallback', () => {
    render(<InlineTextEditor block={makeBlock({ fontSize: '24' })} onUpdate={vi.fn()} />)
    const select = screen.getByTestId('inline-font-size-select') as HTMLSelectElement
    expect(select.value).toBe('24')
  })

  it('normaliza fontSize legacy "md" a "16"', () => {
    render(<InlineTextEditor block={makeBlock({ fontSize: 'md' })} onUpdate={vi.fn()} />)
    const select = screen.getByTestId('inline-font-size-select') as HTMLSelectElement
    expect(select.value).toBe('16')
  })

  it('muestra el fontSize de la selección cuando hay uno (textStyle.fontSize)', () => {
    mockGetAttributes = (name: string) =>
      name === 'textStyle' ? { fontSize: '32px' } : {}
    render(<InlineTextEditor block={makeBlock({ fontSize: '16' })} onUpdate={vi.fn()} />)
    const select = screen.getByTestId('inline-font-size-select') as HTMLSelectElement
    expect(select.value).toBe('32')
  })

  it('cambiar font size llama setFontSize en el editor (per-selection)', () => {
    render(<InlineTextEditor block={makeBlock({ fontSize: '16' })} onUpdate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('inline-font-size-select'), { target: { value: '32' } })
    expect(mockChain.setFontSize).toHaveBeenCalledWith('32px')
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('cambiar font size NO actualiza block.props (solo aplica mark a la selección)', () => {
    const onUpdate = vi.fn()
    render(<InlineTextEditor block={makeBlock({ fontSize: '16' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-font-size-select'), { target: { value: '32' } })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('InlineTextEditor — color per-selection', () => {
  it('color picker muestra el color del bloque como fallback', () => {
    render(<InlineTextEditor block={makeBlock({ color: '#ff0000' })} onUpdate={vi.fn()} />)
    const picker = screen.getByTestId('inline-color-picker') as HTMLInputElement
    expect(picker.value).toBe('#ff0000')
  })

  it('muestra el color de la selección cuando hay uno (textStyle.color)', () => {
    mockGetAttributes = (name: string) =>
      name === 'textStyle' ? { color: '#abcdef' } : {}
    render(<InlineTextEditor block={makeBlock({ color: '#000000' })} onUpdate={vi.fn()} />)
    const picker = screen.getByTestId('inline-color-picker') as HTMLInputElement
    expect(picker.value).toBe('#abcdef')
  })

  it('cambiar color llama setColor en el editor (per-selection)', () => {
    render(<InlineTextEditor block={makeBlock({ color: '#000000' })} onUpdate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('inline-color-picker'), { target: { value: '#123456' } })
    expect(mockChain.setColor).toHaveBeenCalledWith('#123456')
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('cambiar color NO actualiza block.props (solo aplica mark a la selección)', () => {
    const onUpdate = vi.fn()
    render(<InlineTextEditor block={makeBlock({ color: '#000000' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-color-picker'), { target: { value: '#123456' } })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('InlineTextEditor — link dialog', () => {
  it('click en toolbar-link muestra el link dialog', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.queryByTestId('inline-link-dialog')).not.toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-link'))
    expect(screen.getByTestId('inline-link-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('inline-link-url-input')).toBeInTheDocument()
  })

  it('click en OK guarda el link y cierra el dialog', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-link'))
    const input = screen.getByTestId('inline-link-url-input')
    fireEvent.change(input, { target: { value: 'https://civicos.co' } })
    fireEvent.mouseDown(screen.getByTestId('inline-link-save-btn'))
    expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://civicos.co' })
    expect(mockChain.run).toHaveBeenCalled()
    expect(screen.queryByTestId('inline-link-dialog')).not.toBeInTheDocument()
  })

  it('Enter en el input guarda el link', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-link'))
    const input = screen.getByTestId('inline-link-url-input')
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
  })

  it('muestra botón Quitar cuando hay link activo', () => {
    mockGetAttributes = (name: string) => name === 'link' ? { href: 'https://civicos.co' } : {}
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-link'))
    expect(screen.getByTestId('inline-link-remove-btn')).toBeInTheDocument()
  })

  it('click en Quitar llama unsetLink', () => {
    mockGetAttributes = (name: string) => name === 'link' ? { href: 'https://civicos.co' } : {}
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-toolbar-link'))
    fireEvent.mouseDown(screen.getByTestId('inline-link-remove-btn'))
    expect(mockChain.unsetLink).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })
})

describe('InlineTextEditor — editor', () => {
  it('renderiza el editor Tiptap', () => {
    render(<InlineTextEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-tiptap-editor-mock')).toBeInTheDocument()
    expect(screen.getByText('editor activo')).toBeInTheDocument()
  })
})
