export interface EmailContent {
  headline: string
  body: string       // Párrafos separados por \n → cada uno se convierte en <p>
  ctaText?: string
  ctaUrl?: string
  senderName?: string
  imageUrl?: string     // Hero image entre header y cuerpo del email
  accentColor?: string  // Override del color de acento de la plantilla
}

export interface EmailTemplate {
  id: string
  name: string
  description: string
  accentColor: string
  headerBg: string   // CSS gradient or solid color for the template card mini-preview
  generate: (content: EmailContent) => string
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function bodyToParagraphs(body: string): string {
  return body
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;line-height:1.7;color:#586069;">${p.trim()}</p>`)
    .join('\n')
}

function ctaButton(text: string, url: string, color: string): string {
  return `
  <table role="presentation" style="margin:24px 0;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-radius:4px;background:${color};">
        <a href="${url}" target="_blank"
          style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`
}

function emailWrapper(
  headerHtml: string,
  bodyHtml: string,
  footer: string,
  meta?: { imageUrl?: string; accentColor?: string }
): string {
  const heroBlock = meta?.imageUrl
    ? `
        <!-- Hero Image -->
        <tr>
          <td style="padding:0;line-height:0;">
            <img src="${meta.imageUrl}" alt="" style="width:100%;max-width:600px;height:auto;display:block;" />
          </td>
        </tr>`
    : ''

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

        <!-- Header -->
        ${headerHtml}
${heroBlock}
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px;">
            ${bodyHtml}
          </td>
        </tr>

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
<!-- scrutix-meta:${JSON.stringify(meta ?? {})} -->
</body>
</html>`
}

// ── Template: Convocatoria ─────────────────────────────────────────────────────

function generateConvocatoria(content: EmailContent): string {
  const color = content.accentColor || '#2960ec'
  const header = `
  <tr>
    <td style="background:${color};padding:32px 40px;border-radius:4px 4px 0 0;">
      <p style="margin:0 0 20px 0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;">Scrutix · Campaña</p>
      <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">${content.headline}</h1>
    </td>
  </tr>`

  const body = `
    ${bodyToParagraphs(content.body)}
    ${content.ctaText && content.ctaUrl ? ctaButton(content.ctaText, content.ctaUrl, color) : ''}
  `
  const footer = `${content.senderName ?? 'El equipo de campaña'} · Enviado a través de Scrutix<br>Este es un mensaje oficial de campaña.`
  return emailWrapper(header, body, footer, { imageUrl: content.imageUrl, accentColor: color })
}

// ── Template: Actualización ───────────────────────────────────────────────────

function generateActualizacion(content: EmailContent): string {
  const color = content.accentColor || '#132f56'
  const badgeColor = content.accentColor ? adjustBrightness(color, 30) : '#2960ec'
  const header = `
  <tr>
    <td style="background:${color};padding:28px 40px;border-radius:4px 4px 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:2px;letter-spacing:0.5px;text-transform:uppercase;">Actualización</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;">
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">${content.headline}</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  const body = `
    ${bodyToParagraphs(content.body)}
    ${content.ctaText && content.ctaUrl ? ctaButton(content.ctaText, content.ctaUrl, color) : ''}
  `
  const footer = `${content.senderName ?? 'El equipo de campaña'} · Scrutix<br>Recibes este mensaje porque eres parte de nuestra campaña.`
  return emailWrapper(header, body, footer, { imageUrl: content.imageUrl, accentColor: color })
}

// ── Template: Agradecimiento ──────────────────────────────────────────────────

function generateAgradecimiento(content: EmailContent): string {
  const color = content.accentColor || '#28a745'
  const header = `
  <tr>
    <td style="background:${color};padding:32px 40px;border-radius:4px 4px 0 0;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;line-height:56px;display:block;">🙏</span>
      </div>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">${content.headline}</h1>
    </td>
  </tr>`

  const body = `
    ${bodyToParagraphs(content.body)}
    ${content.ctaText && content.ctaUrl ? ctaButton(content.ctaText, content.ctaUrl, color) : ''}
  `
  const footer = `Con gratitud, ${content.senderName ?? 'El equipo de campaña'}<br>Scrutix · Gestión política inteligente`
  return emailWrapper(header, body, footer, { imageUrl: content.imageUrl, accentColor: color })
}

// ── Template: Urgente ─────────────────────────────────────────────────────────

function generateUrgente(content: EmailContent): string {
  // If custom color provided, use solid; otherwise keep the gradient
  const headerBg = content.accentColor
    ? `background:${content.accentColor}`
    : 'background:linear-gradient(135deg,#f97316 0%,#ea580c 100%)'
  const color = content.accentColor || '#f97316'
  const header = `
  <tr>
    <td style="${headerBg};padding:28px 40px;border-radius:4px 4px 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <span style="display:inline-block;background:rgba(255,255,255,0.25);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;">⚡ Acción requerida</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:14px;">
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">${content.headline}</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  const body = `
    ${bodyToParagraphs(content.body)}
    ${content.ctaText && content.ctaUrl ? ctaButton(content.ctaText, content.ctaUrl, color) : ''}
  `
  const footer = `${content.senderName ?? 'El equipo de campaña'} · Scrutix<br>Este mensaje contiene información urgente de campaña.`
  return emailWrapper(header, body, footer, { imageUrl: content.imageUrl, accentColor: color })
}

// ── Template: Minimalista ─────────────────────────────────────────────────────

function generateMinimalista(content: EmailContent): string {
  const color = content.accentColor || '#1b1f23'
  const header = `
  <tr>
    <td style="background:#ffffff;padding:28px 40px 0;border-top:3px solid ${color};border-radius:4px 4px 0 0;">
      <p style="margin:0 0 24px 0;font-size:12px;font-weight:600;color:#6a737d;letter-spacing:1px;text-transform:uppercase;">Scrutix · Campaña</p>
      <h1 style="margin:0 0 24px 0;font-size:26px;font-weight:700;color:#1b1f23;line-height:1.3;border-bottom:1px solid #edeef2;padding-bottom:24px;">${content.headline}</h1>
    </td>
  </tr>`

  const body = `
    ${bodyToParagraphs(content.body)}
    ${content.ctaText && content.ctaUrl ? ctaButton(content.ctaText, content.ctaUrl, color) : ''}
  `
  const footer = `${content.senderName ?? 'El equipo de campaña'} · Scrutix`
  return emailWrapper(header, body, footer, { imageUrl: content.imageUrl, accentColor: color })
}

// ── Helper: lighten a hex color for badge contrast ────────────────────────────

function adjustBrightness(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const num = parseInt(h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h, 16)
  const r = Math.min(255, (num >> 16) + amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + amount)
  const b = Math.min(255, (num & 0xff) + amount)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// ── Export ─────────────────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'convocatoria',
    name: 'Convocatoria',
    description: 'Invitaciones a eventos, reuniones o actos de campaña',
    accentColor: '#2960ec',
    headerBg: 'linear-gradient(135deg, #2960ec 0%, #1a4fd6 100%)',
    generate: generateConvocatoria,
  },
  {
    id: 'actualizacion',
    name: 'Actualización',
    description: 'Novedades, avances y noticias de tu campaña',
    accentColor: '#132f56',
    headerBg: 'linear-gradient(135deg, #132f56 0%, #1a3a66 100%)',
    generate: generateActualizacion,
  },
  {
    id: 'agradecimiento',
    name: 'Agradecimiento',
    description: 'Mensajes de gratitud a voluntarios y simpatizantes',
    accentColor: '#28a745',
    headerBg: 'linear-gradient(135deg, #28a745 0%, #1e8035 100%)',
    generate: generateAgradecimiento,
  },
  {
    id: 'urgente',
    name: 'Urgente',
    description: 'Llamadas a la acción, fechas límite, recordatorios clave',
    accentColor: '#f97316',
    headerBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    generate: generateUrgente,
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Comunicaciones formales y mensajes directos al grano',
    accentColor: '#1b1f23',
    headerBg: 'linear-gradient(135deg, #f6f7f8 0%, #edeef2 100%)',
    generate: generateMinimalista,
  },
]
