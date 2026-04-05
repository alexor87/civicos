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
  getHTML:       () => '<p>Titular de prueba</p>',
  getAttributes: (name: string) => mockGetAttributes(name),
  can:           () => ({ undo: () => mockCanUndo, redo: () => mockCanRedo }),
}

vi.mock('@tiptap/react', () => ({
  useEditor:     vi.fn(() => mockEditor),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="inline-header-tiptap-editor-mock">
      {editor ? 'editor activo' : 'editor nulo'}
    </div>
  ),
}))

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

import { InlineHeaderEditor } from '@/components/dashboard/email-builder/block-editors/InlineHeaderEditor'
import type { HeaderBlock } from '@/lib/email-blocks'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBlock(overrides?: Partial<HeaderBlock['props']>): HeaderBlock {
  return {
    id: 'header-1',
    type: 'header',
    props: {
      text: 'Bienvenida',
      subtext: 'Scrutix · Campaña',
      bgColor: '#2960ec',
      textColor: '#ffffff',
      padding: 'md',
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

describe('InlineHeaderEditor — toolbar', () => {
  it('renderiza la toolbar con todos los controles', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-header-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-bold')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-italic')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-underline')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-strike')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-align-left')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-align-center')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-align-right')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-align-justify')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-ordered-list')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-link')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-clear')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-font-size-select')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-text-color')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-undo')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-redo')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-bg-color')).toBeInTheDocument()
  })

  it('click en Bold llama toggleBold', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-bold'))
    expect(mockChain.toggleBold).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Italic llama toggleItalic', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-italic'))
    expect(mockChain.toggleItalic).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Underline llama toggleUnderline', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-underline'))
    expect(mockChain.toggleUnderline).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Strikethrough llama toggleStrike', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-strike'))
    expect(mockChain.toggleStrike).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en BulletList llama toggleBulletList', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-bullet-list'))
    expect(mockChain.toggleBulletList).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en OrderedList llama toggleOrderedList', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-ordered-list'))
    expect(mockChain.toggleOrderedList).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Clear llama clearNodes y unsetAllMarks', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-clear'))
    expect(mockChain.clearNodes).toHaveBeenCalled()
    expect(mockChain.unsetAllMarks).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('click en Undo llama commands.undo() cuando hay historial', () => {
    mockCanUndo = true
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-undo'))
    expect(mockCommands.undo).toHaveBeenCalled()
  })

  it('click en Redo llama commands.redo() cuando hay historial', () => {
    mockCanRedo = true
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-redo'))
    expect(mockCommands.redo).toHaveBeenCalled()
  })

  it('botón Undo está deshabilitado cuando no hay historial', () => {
    mockCanUndo = false
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-header-undo')).toBeDisabled()
  })

  it('botón Redo está deshabilitado cuando no hay historial', () => {
    mockCanRedo = false
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-header-redo')).toBeDisabled()
  })
})

describe('InlineHeaderEditor — font size per-selection', () => {
  it('cambiar font size llama setFontSize en el editor (per-selection)', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('inline-header-font-size-select'), { target: { value: '28' } })
    expect(mockChain.setFontSize).toHaveBeenCalledWith('28px')
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('cambiar font size NO actualiza block.props (solo aplica mark a la selección)', () => {
    const onUpdate = vi.fn()
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-header-font-size-select'), { target: { value: '28' } })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('muestra el fontSize de la selección cuando hay uno', () => {
    mockGetAttributes = (name: string) =>
      name === 'textStyle' ? { fontSize: '32px' } : {}
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    const select = screen.getByTestId('inline-header-font-size-select') as HTMLSelectElement
    expect(select.value).toBe('32')
  })
})

describe('InlineHeaderEditor — color per-selection', () => {
  it('color picker muestra el textColor del bloque como fallback', () => {
    render(<InlineHeaderEditor block={makeBlock({ textColor: '#ff0000' })} onUpdate={vi.fn()} />)
    const picker = screen.getByTestId('inline-header-text-color') as HTMLInputElement
    expect(picker.value).toBe('#ff0000')
  })

  it('muestra el color de la selección cuando hay uno', () => {
    mockGetAttributes = (name: string) =>
      name === 'textStyle' ? { color: '#abcdef' } : {}
    render(<InlineHeaderEditor block={makeBlock({ textColor: '#ffffff' })} onUpdate={vi.fn()} />)
    const picker = screen.getByTestId('inline-header-text-color') as HTMLInputElement
    expect(picker.value).toBe('#abcdef')
  })

  it('cambiar color llama setColor en el editor (per-selection)', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('inline-header-text-color'), { target: { value: '#123456' } })
    expect(mockChain.setColor).toHaveBeenCalledWith('#123456')
    expect(mockChain.run).toHaveBeenCalled()
  })

  it('cambiar color NO actualiza block.props (solo aplica mark a la selección)', () => {
    const onUpdate = vi.fn()
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-header-text-color'), { target: { value: '#123456' } })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('InlineHeaderEditor — controles de bloque', () => {
  it('cambiar bgColor llama onUpdate con el nuevo color', () => {
    const onUpdate = vi.fn()
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-header-bg-color'), { target: { value: '#ff0000' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ bgColor: '#ff0000' }) })
    )
  })
})

describe('InlineHeaderEditor — contenido editable', () => {
  it('renderiza el input del subtítulo con el valor actual', () => {
    render(<InlineHeaderEditor block={makeBlock({ subtext: 'Mi subtítulo' })} onUpdate={vi.fn()} />)
    const input = screen.getByTestId('inline-header-subtext-input') as HTMLInputElement
    expect(input.value).toBe('Mi subtítulo')
  })

  it('cambiar subtext llama onUpdate con el nuevo subtítulo', () => {
    const onUpdate = vi.fn()
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-header-subtext-input'), { target: { value: 'Nuevo sub' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ subtext: 'Nuevo sub' }) })
    )
  })

  it('subtext vacío llama onUpdate con subtext: undefined', () => {
    const onUpdate = vi.fn()
    render(<InlineHeaderEditor block={makeBlock({ subtext: 'algo' })} onUpdate={onUpdate} />)
    fireEvent.change(screen.getByTestId('inline-header-subtext-input'), { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ subtext: undefined }) })
    )
  })

  it('renderiza el editor Tiptap', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.getByTestId('inline-header-tiptap-editor-mock')).toBeInTheDocument()
    expect(screen.getByText('editor activo')).toBeInTheDocument()
  })
})

describe('InlineHeaderEditor — link dialog', () => {
  it('click en toolbar-link muestra el link dialog', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    expect(screen.queryByTestId('inline-header-link-dialog')).not.toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('inline-header-link'))
    expect(screen.getByTestId('inline-header-link-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('inline-header-link-url-input')).toBeInTheDocument()
  })

  it('click en OK guarda el link y cierra el dialog', () => {
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-link'))
    const input = screen.getByTestId('inline-header-link-url-input')
    fireEvent.change(input, { target: { value: 'https://scrutix.co' } })
    fireEvent.mouseDown(screen.getByTestId('inline-header-link-save-btn'))
    expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://scrutix.co' })
    expect(mockChain.run).toHaveBeenCalled()
    expect(screen.queryByTestId('inline-header-link-dialog')).not.toBeInTheDocument()
  })

  it('muestra botón Quitar cuando hay link activo', () => {
    mockGetAttributes = (name: string) => name === 'link' ? { href: 'https://scrutix.co' } : {}
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-link'))
    expect(screen.getByTestId('inline-header-link-remove-btn')).toBeInTheDocument()
  })

  it('click en Quitar llama unsetLink', () => {
    mockGetAttributes = (name: string) => name === 'link' ? { href: 'https://scrutix.co' } : {}
    render(<InlineHeaderEditor block={makeBlock()} onUpdate={vi.fn()} />)
    fireEvent.mouseDown(screen.getByTestId('inline-header-link'))
    fireEvent.mouseDown(screen.getByTestId('inline-header-link-remove-btn'))
    expect(mockChain.unsetLink).toHaveBeenCalled()
    expect(mockChain.run).toHaveBeenCalled()
  })
})
