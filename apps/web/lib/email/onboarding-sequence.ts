import { Resend } from 'resend'
import crypto from 'crypto'

export type OnboardingStep = 'welcome' | 'day1' | 'day3' | 'day7'

type SendResult = { ok: true } | { ok: false; error: string }

interface SendOnboardingEmailParams {
  step: OnboardingStep
  email: string
  tenantId: string
  orgName?: string
  appUrl?: string
}

export async function sendOnboardingEmail(
  params: SendOnboardingEmailParams
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  const from = process.env.EMAIL_FROM || 'Scrutix <noreply@scrutix.co>'
  const appUrl = params.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://app.scrutix.co'
  const unsubscribeUrl = buildUnsubscribeUrl(appUrl, params.tenantId, params.email)

  const { subject, html } = buildEmail(params.step, {
    orgName: params.orgName,
    appUrl,
    unsubscribeUrl,
  })

  const resend = new Resend(apiKey)
  try {
    const { error } = await resend.emails.send({ from, to: params.email, subject, html })
    if (error) return { ok: false, error: error.message || 'Resend error' }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ── Unsubscribe token helpers ──────────────────────────────────────────────────

function buildUnsubscribeUrl(appUrl: string, tenantId: string, email: string): string {
  const token = signUnsubscribeToken(tenantId, email)
  const params = new URLSearchParams({ tid: tenantId, token })
  return `${appUrl}/api/email/unsubscribe?${params}`
}

export function signUnsubscribeToken(tenantId: string, email: string): string {
  const secret = process.env.IMPERSONATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const payload = `${tenantId}:${email}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32)
}

export function verifyUnsubscribeToken(tenantId: string, email: string, token: string): boolean {
  const expected = signUnsubscribeToken(tenantId, email)
  return expected === token
}

// ── Email builders ─────────────────────────────────────────────────────────────

interface EmailBuildParams {
  orgName?: string
  appUrl: string
  unsubscribeUrl: string
}

function buildEmail(
  step: OnboardingStep,
  params: EmailBuildParams
): { subject: string; html: string } {
  switch (step) {
    case 'welcome': return buildWelcomeEmail(params)
    case 'day1':    return buildDay1Email(params)
    case 'day3':    return buildDay3Email(params)
    case 'day7':    return buildDay7Email(params)
  }
}

function emailShell(content: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0F11;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <!-- Logo row -->
        <tr>
          <td style="padding:28px 32px 8px 32px;">
            <div style="font-size:20px;font-weight:700;color:#0F0F11;">Scrutix</div>
          </td>
        </tr>
        ${content}
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px 32px;border-top:1px solid #E5E7EB;">
            <p style="font-size:12px;line-height:18px;color:#9CA3AF;margin:0;">
              Recibes este email porque te registraste en Scrutix. &nbsp;
              <a href="${unsubscribeUrl}" style="color:#9CA3AF;text-decoration:underline;">Cancelar suscripción</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function buildWelcomeEmail({ appUrl, unsubscribeUrl }: EmailBuildParams) {
  const ctaUrl = `${appUrl}/welcome`
  const content = `
    <tr>
      <td style="padding:16px 32px 8px 32px;">
        <h1 style="font-size:22px;font-weight:700;margin:16px 0 8px;color:#0F0F11;">Bienvenido a Scrutix</h1>
        <p style="font-size:15px;line-height:22px;color:#4B5563;margin:0 0 16px;">
          Tu cuenta está lista. Hemos preparado datos de ejemplo para que puedas explorar todas las funcionalidades de la plataforma antes de empezar con tu campaña real.
        </p>
        <p style="font-size:15px;line-height:22px;color:#4B5563;margin:0 0 24px;">
          Con Scrutix puedes gestionar contactos, planificar canvassing, enviar campañas de email y mucho más — todo en un solo lugar.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#2262ec;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">
          Crear mi primer demo
        </a>
      </td>
    </tr>`
  return {
    subject: 'Bienvenido a Scrutix — tu plataforma está lista',
    html: emailShell(content, unsubscribeUrl),
  }
}

function buildDay1Email({ appUrl, unsubscribeUrl }: EmailBuildParams) {
  const ctaUrl = `${appUrl}/dashboard`
  const content = `
    <tr>
      <td style="padding:16px 32px 8px 32px;">
        <h1 style="font-size:22px;font-weight:700;margin:16px 0 8px;color:#0F0F11;">¿Has creado tu primer demo?</h1>
        <p style="font-size:15px;line-height:22px;color:#4B5563;margin:0 0 16px;">
          Notamos que ya llevas un día con nosotros. Si aún no has explorado la plataforma, aquí van tres pasos rápidos para empezar:
        </p>
        <ol style="font-size:15px;line-height:26px;color:#4B5563;margin:0 0 24px;padding-left:20px;">
          <li>Ve a <strong>Contactos</strong> e importa tu lista de electores</li>
          <li>Configura tu primera <strong>ruta de canvassing</strong></li>
          <li>Crea una <strong>campaña de email</strong> para tus contactos</li>
        </ol>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#2262ec;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">
          Ir al dashboard
        </a>
      </td>
    </tr>`
  return {
    subject: '¿Ya empezaste tu campaña en Scrutix?',
    html: emailShell(content, unsubscribeUrl),
  }
}

function buildDay3Email({ appUrl, unsubscribeUrl }: EmailBuildParams) {
  const ctaUrl = `${appUrl}/dashboard`
  const content = `
    <tr>
      <td style="padding:16px 32px 8px 32px;">
        <h1 style="font-size:22px;font-weight:700;margin:16px 0 8px;color:#0F0F11;">Consejos para sacar el máximo de Scrutix</h1>
        <p style="font-size:15px;line-height:22px;color:#4B5563;margin:0 0 16px;">
          Aquí van las mejores prácticas de los equipos de campaña que más éxito tienen en nuestra plataforma:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
              <p style="font-size:15px;font-weight:600;color:#0F0F11;margin:0 0 4px;">Segmenta tus contactos</p>
              <p style="font-size:14px;color:#6B7280;margin:0;">Usa etiquetas para agrupar por zona, interés o nivel de apoyo.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
              <p style="font-size:15px;font-weight:600;color:#0F0F11;margin:0 0 4px;">Planifica rutas de canvassing semanales</p>
              <p style="font-size:14px;color:#6B7280;margin:0;">Las campañas que planifican con 7 días de anticipación convierten un 40% más.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <p style="font-size:15px;font-weight:600;color:#0F0F11;margin:0 0 4px;">Personaliza tus emails</p>
              <p style="font-size:14px;color:#6B7280;margin:0;">Los emails con el nombre del destinatario tienen 26% más tasa de apertura.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#2262ec;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">
          Aplicar estos consejos
        </a>
      </td>
    </tr>`
  return {
    subject: 'Mejores prácticas para tu campaña en Scrutix',
    html: emailShell(content, unsubscribeUrl),
  }
}

function buildDay7Email({ appUrl, unsubscribeUrl }: EmailBuildParams) {
  const ctaUrl = `${appUrl}/settings/billing`
  const content = `
    <tr>
      <td style="padding:16px 32px 8px 32px;">
        <h1 style="font-size:22px;font-weight:700;margin:16px 0 8px;color:#0F0F11;">Lleva tu campaña al siguiente nivel</h1>
        <p style="font-size:15px;line-height:22px;color:#4B5563;margin:0 0 16px;">
          Llevas una semana con Scrutix. Es el momento de desbloquear todo el potencial de la plataforma con un plan Growth o Scale.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background:#F9FAFB;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
              <p style="font-size:14px;font-weight:600;color:#0F0F11;margin:0 0 4px;">Growth — Contactos ilimitados</p>
              <p style="font-size:13px;color:#6B7280;margin:0;">Campañas de email sin límite · Analíticas avanzadas · Exportación de datos</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <p style="font-size:14px;font-weight:600;color:#0F0F11;margin:0 0 4px;">Scale — Todo de Growth +</p>
              <p style="font-size:13px;color:#6B7280;margin:0;">Equipo ilimitado · Soporte prioritario · Integraciones personalizadas</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#2262ec;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">
          Ver planes y precios
        </a>
      </td>
    </tr>`
  return {
    subject: 'Una semana con Scrutix — ¿listo para crecer?',
    html: emailShell(content, unsubscribeUrl),
  }
}
