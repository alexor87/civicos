import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from './_components'

export interface VerificationEmailProps {
  actionLink: string
}

export function VerificationEmail({ actionLink }: VerificationEmailProps) {
  return (
    <EmailLayout preview="Confirma tu email para activar tu cuenta Scrutix">
      <EmailHeading>Confirma tu email</EmailHeading>

      <EmailParagraph>
        Bienvenido a Scrutix. Confirma tu email para activar tu cuenta y
        acceder a tu plataforma con datos de ejemplo.
      </EmailParagraph>

      <EmailButton href={actionLink} label="Confirmar email" />

      <EmailFallbackLink href={actionLink} />
    </EmailLayout>
  )
}

export default VerificationEmail
