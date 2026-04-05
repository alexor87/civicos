import { describe, it, expect } from 'vitest'
import {
  createDefaultBlock,
  generateFromBlocks,
  extractBlocks,
  type CampaignMeta,
  type HeaderBlock,
  type TextBlock,
  type ImageBlock,
  type ButtonBlock,
  type DividerBlock,
  type SpacerBlock,
} from '@/lib/email-blocks'

const META: CampaignMeta = {
  name: 'Test Campaign',
  subject: 'Test Subject',
  segmentId: '',
  senderName: 'Equipo Test',
  accentColor: '#2960ec',
}

// ── createDefaultBlock ─────────────────────────────────────────────────────────

describe('createDefaultBlock', () => {
  it('creates a header block with correct defaults', () => {
    const block = createDefaultBlock('header') as HeaderBlock
    expect(block.type).toBe('header')
    expect(block.id).toBeTruthy()
    expect(block.props.bgColor).toBe('#2960ec')
    expect(block.props.textColor).toBe('#ffffff')
    expect(block.props.padding).toBe('md')
  })

  it('creates a text block with correct defaults', () => {
    const block = createDefaultBlock('text') as TextBlock
    expect(block.type).toBe('text')
    expect(block.props.fontSize).toBe('16')
    expect(block.props.align).toBe('left')
  })

  it('creates a button block with correct defaults', () => {
    const block = createDefaultBlock('button') as ButtonBlock
    expect(block.type).toBe('button')
    expect(block.props.bgColor).toBe('#2960ec')
    expect(block.props.align).toBe('center')
  })

  it('creates a spacer block with height 24', () => {
    const block = createDefaultBlock('spacer') as SpacerBlock
    expect(block.type).toBe('spacer')
    expect(block.props.height).toBe(24)
  })

  it('creates a divider block with default color', () => {
    const block = createDefaultBlock('divider') as DividerBlock
    expect(block.type).toBe('divider')
    expect(block.props.color).toBe('#edeef2')
    expect(block.props.thickness).toBe(1)
  })

  it('creates a image block with 100% width', () => {
    const block = createDefaultBlock('image') as ImageBlock
    expect(block.type).toBe('image')
    expect(block.props.width).toBe(100)
    expect(block.props.align).toBe('center')
  })

  it('generates unique IDs for each block', () => {
    const a = createDefaultBlock('text')
    const b = createDefaultBlock('text')
    expect(a.id).not.toBe(b.id)
  })
})

// ── generateFromBlocks ─────────────────────────────────────────────────────────

describe('generateFromBlocks', () => {
  it('produces valid HTML5 DOCTYPE with empty blocks', () => {
    const html = generateFromBlocks([], META)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('</html>')
  })

  it('renders header block with correct text and background color', () => {
    const block = createDefaultBlock('header') as HeaderBlock
    block.props.text = 'Hola Mundo'
    block.props.bgColor = '#ff0000'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('Hola Mundo')
    expect(html).toContain('#ff0000')
    expect(html).toContain('<h1')
  })

  it('renders header subtext when provided', () => {
    const block = createDefaultBlock('header') as HeaderBlock
    block.props.subtext = 'Scrutix · Test'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('Scrutix · Test')
  })

  it('renders text block splitting newlines into <p> tags', () => {
    const block = createDefaultBlock('text') as TextBlock
    block.props.content = 'Línea uno\nLínea dos\nLínea tres'
    const html = generateFromBlocks([block], META)
    const matches = html.match(/<p /g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(3)
    expect(html).toContain('Línea uno')
    expect(html).toContain('Línea dos')
  })

  it('renders text block font size correctly', () => {
    const block = createDefaultBlock('text') as TextBlock
    block.props.fontSize = 'lg'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('font-size:18px')
  })

  it('renders image block with src and alt', () => {
    const block = createDefaultBlock('image') as ImageBlock
    block.props.src = 'https://example.com/img.jpg'
    block.props.alt = 'Mi imagen'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('https://example.com/img.jpg')
    expect(html).toContain('Mi imagen')
  })

  it('omits image block when src is empty', () => {
    const block = createDefaultBlock('image') as ImageBlock
    block.props.src = ''
    const html = generateFromBlocks([block], META)
    expect(html).not.toContain('<img')
  })

  it('renders image with link when linkUrl is set', () => {
    const block = createDefaultBlock('image') as ImageBlock
    block.props.src = 'https://example.com/img.jpg'
    block.props.linkUrl = 'https://example.com'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('<img')
  })

  it('renders button block with correct text and URL', () => {
    const block = createDefaultBlock('button') as ButtonBlock
    block.props.text = 'Únete ahora'
    block.props.url = 'https://scrutix.app'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('Únete ahora')
    expect(html).toContain('href="https://scrutix.app"')
  })

  it('renders button with correct background color', () => {
    const block = createDefaultBlock('button') as ButtonBlock
    block.props.bgColor = '#28a745'
    const html = generateFromBlocks([block], META)
    expect(html).toContain('background:#28a745')
  })

  it('renders divider with correct color and thickness', () => {
    const block = createDefaultBlock('divider') as DividerBlock
    block.props.color = '#cccccc'
    block.props.thickness = 2
    const html = generateFromBlocks([block], META)
    expect(html).toContain('#cccccc')
    expect(html).toContain('height:2px')
  })

  it('renders spacer with correct height', () => {
    const block = createDefaultBlock('spacer') as SpacerBlock
    block.props.height = 48
    const html = generateFromBlocks([block], META)
    expect(html).toContain('height:48px')
  })

  it('renders footer with senderName from meta', () => {
    const html = generateFromBlocks([], { ...META, senderName: 'Juan Pérez' })
    expect(html).toContain('Juan Pérez')
  })

  it('embeds scrutix-blocks JSON comment for round-trip', () => {
    const block = createDefaultBlock('text') as TextBlock
    const html = generateFromBlocks([block], META)
    expect(html).toContain('<!-- scrutix-blocks:')
    expect(html).toContain('-->')
  })

  it('renders multiple blocks in order', () => {
    const header = createDefaultBlock('header') as HeaderBlock
    header.props.text = 'TITULO'
    const text = createDefaultBlock('text') as TextBlock
    text.props.content = 'CUERPO'
    const html = generateFromBlocks([header, text], META)
    const titlePos = html.indexOf('TITULO')
    const bodyPos = html.indexOf('CUERPO')
    expect(titlePos).toBeLessThan(bodyPos)
  })
})

// ── extractBlocks ──────────────────────────────────────────────────────────────

describe('extractBlocks', () => {
  it('returns null for legacy HTML without scrutix-blocks comment', () => {
    const legacyHtml = '<html><body><h1>Hello</h1></body></html>'
    expect(extractBlocks(legacyHtml)).toBeNull()
  })

  it('returns null for malformed JSON in comment', () => {
    const broken = '<!DOCTYPE html><!-- scrutix-blocks:{invalid json} -->'
    expect(extractBlocks(broken)).toBeNull()
  })

  it('round-trips blocks and meta correctly', () => {
    const header = createDefaultBlock('header') as HeaderBlock
    header.props.text = 'Round-trip test'
    const text = createDefaultBlock('text') as TextBlock
    text.props.content = 'Contenido de prueba'

    const html = generateFromBlocks([header, text], META)
    const result = extractBlocks(html)

    expect(result).not.toBeNull()
    expect(result!.blocks).toHaveLength(2)
    expect(result!.blocks[0].type).toBe('header')
    expect((result!.blocks[0] as HeaderBlock).props.text).toBe('Round-trip test')
    expect(result!.blocks[1].type).toBe('text')
    expect((result!.blocks[1] as TextBlock).props.content).toBe('Contenido de prueba')
  })

  it('round-trips meta correctly', () => {
    const html = generateFromBlocks([], META)
    const result = extractBlocks(html)
    expect(result!.meta.name).toBe('Test Campaign')
    expect(result!.meta.senderName).toBe('Equipo Test')
  })

  it('accepts legacy civicos-blocks marker for backward compatibility', () => {
    const blocks = [createDefaultBlock('text')]
    const payload = JSON.stringify({ blocks, meta: META })
    const legacyHtml = `<!DOCTYPE html><html><body></body></html><!-- civicos-blocks:${payload} -->`
    const result = extractBlocks(legacyHtml)
    expect(result).not.toBeNull()
    expect(result!.blocks).toHaveLength(1)
    expect(result!.blocks[0].type).toBe('text')
  })

  it('preserves all block types through round-trip', () => {
    const blocks = [
      createDefaultBlock('header'),
      createDefaultBlock('text'),
      createDefaultBlock('button'),
      createDefaultBlock('divider'),
      createDefaultBlock('spacer'),
    ]
    const html = generateFromBlocks(blocks, META)
    const result = extractBlocks(html)
    expect(result!.blocks.map(b => b.type)).toEqual([
      'header', 'text', 'button', 'divider', 'spacer',
    ])
  })
})
