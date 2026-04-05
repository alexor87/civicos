import { Resend } from 'resend'

type SendResult = { ok: true } | { ok: false; error: string }

export async function sendVerificationEmail({
  email,
  actionLink,
}: {
  email: string
  actionLink: string
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const from = process.env.EMAIL_FROM || 'Scrutix <noreply@scrutix.co>'
  const resend = new Resend(apiKey)

  const html = buildVerificationHtml(actionLink)

  try {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Confirma tu email — Scrutix',
      html,
    })
    if (error) return { ok: false, error: error.message || 'Resend error' }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

function buildVerificationHtml(actionLink: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirma tu email</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7f8;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0F11;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <div style="font-size:20px;font-weight:700;color:#0F0F11;">Scrutix</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="font-size:22px;font-weight:700;margin:16px 0 8px;color:#0F0F11;">Confirma tu email</h1>
                <p style="font-size:15px;line-height:22px;color:#4B5563;margin:0 0 24px;">
                  Bienvenido a Scrutix. Confirma tu email para activar tu cuenta y acceder a tu plataforma con datos de ejemplo.
                </p>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:0 32px 24px 32px;">
                <a href="${actionLink}" style="display:inline-block;background:#2262ec;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">
                  Confirmar email
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="font-size:13px;line-height:20px;color:#6B7280;margin:0 0 8px;">
                  Si el botón no funciona, copia este link en tu navegador:
                </p>
                <p style="font-size:12px;line-height:18px;color:#6B7280;word-break:break-all;margin:0;">
                  ${actionLink}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #E5E7EB;">
                <p style="font-size:12px;line-height:18px;color:#9CA3AF;margin:0;">
                  Si no creaste esta cuenta, puedes ignorar este correo.
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
