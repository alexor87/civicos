import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from './_components'

export type InviteRole =
  | 'field_coordinator'
  | 'volunteer'
  | 'analyst'
  | 'comms_coordinator'

const ROLE_LABELS: Record<InviteRole, string> = {
  field_coordinator: 'Coordinador de campo',
  volunteer: 'Voluntario',
  analyst: 'Analista',
  comms_coordinator: 'Coordinador de comunicaciones',
}

export interface InviteEmailProps {
  inviteeName: string
  inviterName: string
  campaignName: string
  role: InviteRole
  actionLink: string
}

export function InviteEmail({
  inviteeName,
  inviterName,
  campaignName,
  role,
  actionLink,
}: InviteEmailProps) {
  const roleLabel = ROLE_LABELS[role]
  const preview = `${inviterName} te invita a unirte a ${campaignName} en Scrutix`

  return (
    <EmailLayout preview={preview}>
      <EmailHeading>Te invitaron a unirte a {campaignName}</EmailHeading>

      <EmailParagraph>
        Hola {inviteeName}, <strong>{inviterName}</strong> te invitó a unirte
        a la campaña <strong>{campaignName}</strong> en Scrutix como{' '}
        <strong>{roleLabel}</strong>.
      </EmailParagraph>

      <EmailParagraph>
        Scrutix es la plataforma de gestión de campañas políticas que usa tu
        equipo para coordinar voluntarios, contactos y estrategia. Al aceptar
        la invitación podrás crear tu contraseña y acceder inmediatamente.
      </EmailParagraph>

      <EmailButton href={actionLink} label="Aceptar invitación" />

      <EmailFallbackLink href={actionLink} />
    </EmailLayout>
  )
}

export default InviteEmail

export const INVITE_SUBJECTS: Record<InviteRole, (campaignName: string) => string> = {
  field_coordinator: (c) => `Te invitaron a coordinar campo en ${c}`,
  volunteer: (c) => `Te invitaron como voluntario a ${c}`,
  analyst: (c) => `Te invitaron como analista a ${c}`,
  comms_coordinator: (c) => `Te invitaron a coordinar comunicaciones en ${c}`,
}

export function buildInviteSubject(role: InviteRole, campaignName: string): string {
  return INVITE_SUBJECTS[role](campaignName)
}
