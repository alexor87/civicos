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
        Click el botón para entrar a CivicOS. Encontrarás{' '}
        <strong>{tenantName}</strong> disponible en el selector de campañas
        del header. Este enlace inicia sesión con tu cuenta de CivicOS.
      </EmailParagraph>

      <EmailButton href={actionLink} label="Entrar a CivicOS" />

      <EmailFallbackLink href={actionLink} />
    </EmailLayout>
  )
}

export default AccessGrantedEmail

export function buildAccessGrantedSubject(tenantName: string): string {
  return `Tienes acceso a ${tenantName} en CivicOS`
}
