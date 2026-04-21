import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from './_components'

export interface PasswordResetEmailProps {
  userName: string
  actionLink: string
}

export function PasswordResetEmail({
  userName,
  actionLink,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Recupera el acceso a tu cuenta Scrutix">
      <EmailHeading>Recupera tu contraseña</EmailHeading>

      <EmailParagraph>
        Hola {userName}, recibimos una solicitud para restablecer la
        contraseña de tu cuenta Scrutix. Haz clic en el botón para crear una
        nueva contraseña.
      </EmailParagraph>

      <EmailParagraph>
        Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes
        ignorar este correo — tu contraseña actual seguirá siendo válida.
      </EmailParagraph>

      <EmailButton href={actionLink} label="Restablecer contraseña" />

      <EmailFallbackLink href={actionLink} />
    </EmailLayout>
  )
}

export default PasswordResetEmail
