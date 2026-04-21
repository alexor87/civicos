import { describe, it, expect } from 'vitest'
import { render } from '@react-email/render'
import {
  InviteEmail,
  buildInviteSubject,
} from '@/lib/email/templates/invite-email'

describe('InviteEmail template', () => {
  const baseProps = {
    inviteeName: 'María López',
    inviterName: 'Alexander Ortiz',
    campaignName: 'Campaña Bogotá 2026',
    actionLink: 'https://app.scrutix.co/auth/callback?token=abc',
  } as const

  it('renders the invitee and inviter names', async () => {
    const html = await render(
      InviteEmail({ ...baseProps, role: 'volunteer' })
    )
    expect(html).toContain('María López')
    expect(html).toContain('Alexander Ortiz')
    expect(html).toContain('Campaña Bogotá 2026')
  })

  it('includes the CTA button and action link', async () => {
    const html = await render(
      InviteEmail({ ...baseProps, role: 'volunteer' })
    )
    expect(html).toContain('Aceptar invitación')
    expect(html).toContain('https://app.scrutix.co/auth/callback?token=abc')
  })

  it('includes the fallback plain link for copy-paste', async () => {
    const html = await render(
      InviteEmail({ ...baseProps, role: 'volunteer' })
    )
    expect(html).toContain('Si el botón no funciona')
  })

  it('shows the Spanish role label', async () => {
    const analystHtml = await render(
      InviteEmail({ ...baseProps, role: 'analyst' })
    )
    expect(analystHtml).toContain('Analista')

    const coordHtml = await render(
      InviteEmail({ ...baseProps, role: 'field_coordinator' })
    )
    expect(coordHtml).toContain('Coordinador de campo')
  })

  it('handles special characters in names', async () => {
    const html = await render(
      InviteEmail({
        ...baseProps,
        inviteeName: 'José Ñúñez',
        inviterName: 'María Peña',
        role: 'volunteer',
      })
    )
    expect(html).toContain('José Ñúñez')
    expect(html).toContain('María Peña')
  })
})

describe('buildInviteSubject', () => {
  it('builds role-specific Spanish subjects', () => {
    expect(buildInviteSubject('volunteer', 'Campaña X')).toBe(
      'Te invitaron como voluntario a Campaña X'
    )
    expect(buildInviteSubject('analyst', 'Campaña X')).toBe(
      'Te invitaron como analista a Campaña X'
    )
    expect(buildInviteSubject('field_coordinator', 'Campaña X')).toBe(
      'Te invitaron a coordinar campo en Campaña X'
    )
    expect(buildInviteSubject('comms_coordinator', 'Campaña X')).toBe(
      'Te invitaron a coordinar comunicaciones en Campaña X'
    )
  })
})
