// ── Block Type Definitions ─────────────────────────────────────────────────────

export type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'spacer'

interface BaseBlock {
  id: string
  type: BlockType
}

export interface HeaderBlock extends BaseBlock {
  type: 'header'
  props: {
    text: string
    subtext?: string
    bgColor: string
    textColor: string
    padding: 'sm' | 'md' | 'lg'
  }
}

export interface TextBlock extends BaseBlock {
  type: 'text'
  props: {
    content: string
    fontSize: 'sm' | 'md' | 'lg'
    align: 'left' | 'center' | 'right'
    color: string
  }
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  props: {
    src: string
    alt: string
    width: number        // percentage 10–100
    align: 'left' | 'center' | 'right'
    linkUrl?: string
  }
}

export interface ButtonBlock extends BaseBlock {
  type: 'button'
  props: {
    text: string
    url: string
    bgColor: string
    textColor: string
    size: 'sm' | 'md' | 'lg'
    align: 'left' | 'center' | 'right'
    borderRadius: 'none' | 'sm' | 'full'
  }
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  props: {
    color: string
    thickness: 1 | 2
    marginTop: number
    marginBottom: number
  }
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer'
  props: {
    height: number
  }
}

export type EmailBlock =
  | HeaderBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock

// ── Campaign Metadata ──────────────────────────────────────────────────────────

export interface CampaignMeta {
  name: string
  subject: string
  segmentId: string
  senderName: string
  accentColor: string
}

// ── Editor State ───────────────────────────────────────────────────────────────

export interface EmailBuilderState {
  meta: CampaignMeta
  blocks: EmailBlock[]
  selectedBlockId: string | null
}

// ── Default block factories ────────────────────────────────────────────────────

let _counter = 0
function genId(): string {
  _counter++
  return `block-${Date.now()}-${_counter}`
}

export function createDefaultBlock(type: BlockType): EmailBlock {
  switch (type) {
    case 'header':
      return {
        id: genId(),
        type: 'header',
        props: {
          text: 'Tu titular aquí',
          subtext: 'CivicOS · Campaña',
          bgColor: '#2960ec',
          textColor: '#ffffff',
          padding: 'md',
        },
      }
    case 'text':
      return {
        id: genId(),
        type: 'text',
        props: {
          content: 'Escribe aquí el contenido de tu mensaje. Puedes usar saltos de línea para separar párrafos.',
          fontSize: 'md',
          align: 'left',
          color: '#586069',
        },
      }
    case 'image':
      return {
        id: genId(),
        type: 'image',
        props: {
          src: '',
          alt: 'Imagen',
          width: 100,
          align: 'center',
        },
      }
    case 'button':
      return {
        id: genId(),
        type: 'button',
        props: {
          text: 'Confirmar asistencia',
          url: 'https://',
          bgColor: '#2960ec',
          textColor: '#ffffff',
          size: 'md',
          align: 'center',
          borderRadius: 'sm',
        },
      }
    case 'divider':
      return {
        id: genId(),
        type: 'divider',
        props: {
          color: '#edeef2',
          thickness: 1,
          marginTop: 16,
          marginBottom: 16,
        },
      }
    case 'spacer':
      return {
        id: genId(),
        type: 'spacer',
        props: { height: 24 },
      }
  }
}

// ── HTML Renderers per block type ──────────────────────────────────────────────

const PADDING_MAP = { sm: '20px 32px', md: '28px 40px', lg: '40px 48px' }
const FONTSIZE_MAP = { sm: '14px', md: '16px', lg: '18px' }
const BUTTON_PADDING_MAP = { sm: '10px 20px', md: '14px 28px', lg: '18px 36px' }
const BUTTON_RADIUS_MAP = { none: '0', sm: '4px', full: '24px' }

function renderHeaderRow(block: HeaderBlock): string {
  const padding = PADDING_MAP[block.props.padding]
  return `
        <!-- Header Block -->
        <tr>
          <td style="background:${block.props.bgColor};padding:${padding};border-radius:4px 4px 0 0;">
            ${block.props.subtext ? `<p style="margin:0 0 10px 0;font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;">${block.props.subtext}</p>` : ''}
            <h1 style="margin:0;font-size:26px;font-weight:700;color:${block.props.textColor};line-height:1.3;">${block.props.text}</h1>
          </td>
        </tr>`
}

function renderTextRow(block: TextBlock): string {
  const fontSize = FONTSIZE_MAP[block.props.fontSize]
  const paragraphs = block.props.content
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 14px 0;line-height:1.7;color:${block.props.color};font-size:${fontSize};text-align:${block.props.align};">${p.trim()}</p>`)
    .join('\n')
  return `
        <!-- Text Block -->
        <tr>
          <td style="background:#ffffff;padding:12px 40px;">
            ${paragraphs}
          </td>
        </tr>`
}

function renderImageRow(block: ImageBlock): string {
  if (!block.props.src) return ''
  const widthPct = `${Math.min(100, Math.max(10, block.props.width))}%`
  const alignStyle = block.props.align === 'center'
    ? 'margin:0 auto;display:block;'
    : block.props.align === 'right'
      ? 'margin-left:auto;display:block;'
      : 'display:block;'
  const img = `<img src="${block.props.src}" alt="${block.props.alt}" style="width:${widthPct};max-width:600px;height:auto;${alignStyle}" />`
  return `
        <!-- Image Block -->
        <tr>
          <td style="background:#ffffff;padding:12px 40px;text-align:${block.props.align};">
            ${block.props.linkUrl ? `<a href="${block.props.linkUrl}" target="_blank">${img}</a>` : img}
          </td>
        </tr>`
}

function renderButtonRow(block: ButtonBlock): string {
  const padding = BUTTON_PADDING_MAP[block.props.size]
  const radius = BUTTON_RADIUS_MAP[block.props.borderRadius]
  return `
        <!-- Button Block -->
        <tr>
          <td style="background:#ffffff;padding:12px 40px;text-align:${block.props.align};">
            <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;">
              <tr>
                <td style="background:${block.props.bgColor};border-radius:${radius};">
                  <a href="${block.props.url}" target="_blank"
                    style="display:inline-block;padding:${padding};font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:${block.props.textColor};text-decoration:none;border-radius:${radius};">
                    ${block.props.text}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
}

function renderDividerRow(block: DividerBlock): string {
  return `
        <!-- Divider Block -->
        <tr>
          <td style="background:#ffffff;padding:0 40px;">
            <div style="margin:${block.props.marginTop}px 0 ${block.props.marginBottom}px;height:${block.props.thickness}px;background:${block.props.color};"></div>
          </td>
        </tr>`
}

function renderSpacerRow(block: SpacerBlock): string {
  return `
        <!-- Spacer Block -->
        <tr>
          <td style="background:#ffffff;height:${block.props.height}px;line-height:${block.props.height}px;">&nbsp;</td>
        </tr>`
}

function blockToHtml(block: EmailBlock): string {
  switch (block.type) {
    case 'header':  return renderHeaderRow(block)
    case 'text':    return renderTextRow(block)
    case 'image':   return renderImageRow(block)
    case 'button':  return renderButtonRow(block)
    case 'divider': return renderDividerRow(block)
    case 'spacer':  return renderSpacerRow(block)
  }
}

// ── Main Generator ─────────────────────────────────────────────────────────────

export function generateFromBlocks(blocks: EmailBlock[], meta: CampaignMeta): string {
  const blocksHtml = blocks.map(blockToHtml).join('\n')
  const footer = `${meta.senderName || 'El equipo de campaña'} · Enviado a través de CivicOS<br>Este es un mensaje oficial de campaña.`
  const roundTripData = JSON.stringify({ blocks, meta })

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Email</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f8;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
${blocksHtml}
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#959da5;line-height:1.6;">${footer}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
<!-- civicos-blocks:${roundTripData} -->
</body>
</html>`
}

// ── Round-trip Extractor ───────────────────────────────────────────────────────

export interface ExtractedBlocks {
  blocks: EmailBlock[]
  meta: Partial<CampaignMeta>
}

export function extractBlocks(html: string): ExtractedBlocks | null {
  const match = html.match(/<!-- civicos-blocks:([\s\S]*?)-->/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1]) as ExtractedBlocks
    if (!Array.isArray(parsed.blocks)) return null
    return parsed
  } catch {
    return null
  }
}
