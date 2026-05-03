import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from './_components'
import type { InviteRole } from './invite-email'

const ROLE_LABELS: Record<InviteRole, string> = {
  field_coordinator: 'Coordinador de campo',
  volunteer: 'Voluntario',
  analyst: 'Analista',
  comms_coordinator: 'Coordinador de comunicaciones',
}

export interface AccessGrantedEmailProps {
  inviteeName: string
  inviterName: string
  tenantName: string
  role: InviteRole
  campaignNames: string[]
  actionLink: string
}

export function AccessGrantedEmail({
  inviteeName,
  inviterName,
  tenantName,
  role,
  campaignNames,
  actionLink,
}: AccessGrantedEmailProps) {
  const roleLabel = ROLE_LABELS[role]
  const preview = `Tienes acceso a ${tenantName} en CivicOS`

  return (
    <EmailLayout preview={preview}>
      <EmailHeading>Tienes acceso a {tenantName}</EmailHeading>

      <EmailParagraph>
        Hola {inviteeName}, <strong>{inviterName}</strong> te dio acceso al
        equipo de <strong>{tenantName}</strong> en CivicOS como{' '}
        <strong>{roleLabel}</strong>.
      </EmailParagraph>

      {campaignNames.length > 0 && (
        <EmailParagraph>
          Campañas asignadas: <strong>{campaignNames.join(', ')}</strong>.
        </EmailParagraph>
      )}

      <EmailParagraph>
        Como ya tienes una cuenta de CivicOS, puedes entrar con tu correo y
        contraseña habituales. Encontrarás <strong>{tenantName}</strong> en el
        selector de campañas del header.
      </EmailParagraph>

      <EmailButton href={actionLink} label="Abrir CivicOS" />

      <EmailFallbackLink href={actionLink} />
    </EmailLayout>
  )
}

export default AccessGrantedEmail

export function buildAccessGrantedSubject(tenantName: string): string {
  return `Tienes acceso a ${tenantName} en CivicOS`
}
