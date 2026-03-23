import { describe, it, expect } from 'vitest'
import {
  createDefaultBlock,
  generateFromBlocks,
  extractBlocks,
  resolveFontSize,
  type TextBlock,
  type CampaignMeta,
} from '@/lib/email-blocks'

const META: CampaignMeta = {
  name: 'Test Campaign',
  subject: 'Test Subject',
  segmentId: 'all',
  senderName: 'Equipo de prueba',
  accentColor: '#2262ec',
}

function makeTextBlock(content: string, overrides?: Partial<TextBlock['props']>): TextBlock {
  return {
    id: 'text-1',
    type: 'text',
    props: {
      content,
      fontSize: 'md',
      align: 'left',
      color: '#586069',
      ...overrides,
    },
  }
}

// ── processRichTextForEmail via renderTextRow ─────────────────────────────────

describe('renderTextRow — texto plano (backward compat)', () => {
  it('convierte saltos de línea en párrafos <p>', () => {
    const block = makeTextBlock('Línea 1\nLínea 2')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<p style=')
    expect(html).toContain('Línea 1')
    expect(html).toContain('Línea 2')
  })

  it('filtra líneas vacías', () => {
    const block = makeTextBlock('Texto\n\n\nOtro')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('Texto')
    expect(html).toContain('Otro')
  })

  it('aplica color y fontSize al estilo inline', () => {
    const block = makeTextBlock('Hola', { color: '#ff0000', fontSize: 'lg' })
    const html = generateFromBlocks([block], META)
    expect(html).toContain('color:#ff0000')
    expect(html).toContain('font-size:18px')
  })
})

describe('renderTextRow — HTML de Tiptap (processRichTextForEmail)', () => {
  it('agrega inline styles a etiquetas <p>', () => {
    const block = makeTextBlock('<p>Hola mundo</p>')
    const html = generateFromBlocks([block], META)
    // Should have styled <p> tag
    expect(html).toContain('<p style=')
    expect(html).toContain('Hola mundo')
  })

  it('agrega inline styles a <ul> y <li>', () => {
    const block = makeTextBlock('<ul><li>Item 1</li><li>Item 2</li></ul>')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<ul style=')
    expect(html).toContain('<li style=')
    expect(html).toContain('Item 1')
  })

  it('agrega inline styles a <ol>', () => {
    const block = makeTextBlock('<ol><li>Primero</li></ol>')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<ol style=')
    expect(html).toContain('Primero')
  })

  it('agrega inline styles a <a>', () => {
    const block = makeTextBlock('<p>Ver <a href="https://example.com">enlace</a></p>')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<a style=')
    expect(html).toContain('color:#2262ec')
    expect(html).toContain('text-decoration:underline')
    expect(html).toContain('href="https://example.com"')
  })

  it('agrega inline styles a <h1>, <h2>, <h3>', () => {
    const block = makeTextBlock('<h1>Título</h1><h2>Subtítulo</h2><h3>Tercer nivel</h3>')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<h1 style=')
    expect(html).toContain('font-size:22px')
    expect(html).toContain('<h2 style=')
    expect(html).toContain('font-size:18px')
    expect(html).toContain('<h3 style=')
    expect(html).toContain('font-size:16px')
  })

  it('preserva <strong> y <em> sin modificarlos', () => {
    const block = makeTextBlock('<p><strong>Negrita</strong> y <em>cursiva</em></p>')
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<strong>Negrita</strong>')
    expect(html).toContain('<em>cursiva</em>')
  })

  it('aplica el color del bloque a los estilos de <p>', () => {
    const block = makeTextBlock('<p>Texto coloreado</p>', { color: '#123456' })
    const html = generateFromBlocks([block], META)
    expect(html).toContain('color:#123456')
  })

  it('aplica alineación del bloque al estilo de <p>', () => {
    const block = makeTextBlock('<p>Centrado</p>', { align: 'center' })
    const html = generateFromBlocks([block], META)
    expect(html).toContain('text-align:center')
  })
})

// ── round-trip con HTML ───────────────────────────────────────────────────────

describe('generateFromBlocks / extractBlocks — round-trip con HTML', () => {
  it('preserva bloques de texto con HTML en el round-trip', () => {
    const block = makeTextBlock('<p><strong>Hola</strong> mundo</p>')
    const html = generateFromBlocks([block], META)
    const extracted = extractBlocks(html)
    expect(extracted).not.toBeNull()
    const textBlock = extracted!.blocks[0] as TextBlock
    expect(textBlock.props.content).toBe('<p><strong>Hola</strong> mundo</p>')
  })

  it('preserva texto plano en el round-trip', () => {
    const block = makeTextBlock('Texto simple\nSegunda línea')
    const html = generateFromBlocks([block], META)
    const extracted = extractBlocks(html)
    expect(extracted).not.toBeNull()
    const textBlock = extracted!.blocks[0] as TextBlock
    expect(textBlock.props.content).toBe('Texto simple\nSegunda línea')
  })
})

// ── resolveFontSize ───────────────────────────────────────────────────────────

describe('resolveFontSize', () => {
  it("'sm' → '14px'", () => expect(resolveFontSize('sm')).toBe('14px'))
  it("'md' → '16px'", () => expect(resolveFontSize('md')).toBe('16px'))
  it("'lg' → '18px'", () => expect(resolveFontSize('lg')).toBe('18px'))
  it("'24' → '24px'", () => expect(resolveFontSize('24')).toBe('24px'))
  it("'32' → '32px'", () => expect(resolveFontSize('32')).toBe('32px'))
})

// ── createDefaultBlock ────────────────────────────────────────────────────────

describe('createDefaultBlock', () => {
  it('crea un bloque de texto con contenido por defecto', () => {
    const block = createDefaultBlock('text') as TextBlock
    expect(block.type).toBe('text')
    expect(block.props.content).toBeTruthy()
    expect(block.props.fontSize).toBe('16')
    expect(block.props.align).toBe('left')
  })
})
