import { render } from '@react-email/render'
import { Resend } from 'resend'
import {
  InviteEmail,
  buildInviteSubject,
  type InviteRole,
} from './templates/invite-email'
import {
  AccessGrantedEmail,
  buildAccessGrantedSubject,
} from './templates/access-granted-email'
import { PasswordResetEmail } from './templates/password-reset-email'
import { VerificationEmail } from './templates/verification-email'

export type SendResult = { ok: true; id?: string } | { ok: false; error: string }

const DEFAULT_FROM_INVITES = 'Scrutix <invitaciones@scrutix.co>'
const DEFAULT_FROM_NOTIFICATIONS = 'Scrutix <noreply@scrutix.co>'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getInvitesFrom(): string {
  return process.env.EMAIL_FROM_INVITES || DEFAULT_FROM_INVITES
}

function getNotificationsFrom(): string {
  return (
    process.env.EMAIL_FROM_NOTIFICATIONS ||
    process.env.EMAIL_FROM ||
    DEFAULT_FROM_NOTIFICATIONS
  )
}

export interface SendInviteParams {
  to: string
  inviteeName: string
  inviterName: string
  campaignName: string
  role: InviteRole
  actionLink: string
}

export async function sendInviteEmail(params: SendInviteParams): Promise<SendResult> {
  const resend = getResendClient()
  if (!resend) {
    console.error('[transactional] RESEND_API_KEY not configured')
    return { ok: false, error: 'Email service not configured' }
  }

  const html = await render(
    InviteEmail({
      inviteeName: params.inviteeName,
      inviterName: params.inviterName,
      campaignName: params.campaignName,
      role: params.role,
      actionLink: params.actionLink,
    })
  )

  try {
    const { data, error } = await resend.emails.send({
      from: getInvitesFrom(),
      to: params.to,
      subject: buildInviteSubject(params.role, params.campaignName),
      html,
    })
    if (error) {
      console.error('[transactional] Resend invite error:', error)
      return { ok: false, error: error.message || 'Resend error' }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('[transactional] Unexpected invite send error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export interface SendAccessGrantedParams {
  to: string
  inviteeName: string
  inviterName: string
  tenantName: string
  role: InviteRole
  campaignNames: string[]
  /**
   * URL the email CTA points to. Should be a Supabase magic-link URL so the
   * recipient establishes their own session (replacing any other active
   * session in their browser). Falls back to /dashboard if not provided.
   */
  actionLink?: string
}

export async function sendAccessGrantedEmail(
  params: SendAccessGrantedParams
): Promise<SendResult> {
  const resend = getResendClient()
  if (!resend) {
    console.error('[transactional] RESEND_API_KEY not configured')
    return { ok: false, error: 'Email service not configured' }
  }

  const html = await render(
    AccessGrantedEmail({
      inviteeName:   params.inviteeName,
      inviterName:   params.inviterName,
      tenantName:    params.tenantName,
      role:          params.role,
      campaignNames: params.campaignNames,
      actionLink:    params.actionLink ?? `${getAppUrl()}/dashboard`,
    })
  )

  try {
    const { data, error } = await resend.emails.send({
      from:    getNotificationsFrom(),
      to:      params.to,
      subject: buildAccessGrantedSubject(params.tenantName),
      html,
    })
    if (error) {
      console.error('[transactional] Resend access-granted error:', error)
      return { ok: false, error: error.message || 'Resend error' }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('[transactional] Unexpected access-granted send error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export interface SendPasswordResetParams {
  to: string
  userName: string
  actionLink: string
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetParams
): Promise<SendResult> {
  const resend = getResendClient()
  if (!resend) {
    console.error('[transactional] RESEND_API_KEY not configured')
    return { ok: false, error: 'Email service not configured' }
  }

  const html = await render(
    PasswordResetEmail({
      userName: params.userName,
      actionLink: params.actionLink,
    })
  )

  try {
    const { data, error } = await resend.emails.send({
      from: getNotificationsFrom(),
      to: params.to,
      subject: 'Restablece tu contraseña — Scrutix',
      html,
    })
    if (error) {
      console.error('[transactional] Resend password reset error:', error)
      return { ok: false, error: error.message || 'Resend error' }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('[transactional] Unexpected password reset send error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export interface SendVerificationParams {
  to: string
  actionLink: string
}

export async function sendVerificationEmail(
  params: SendVerificationParams
): Promise<SendResult> {
  const resend = getResendClient()
  if (!resend) {
    console.error('[transactional] RESEND_API_KEY not configured')
    return { ok: false, error: 'Email service not configured' }
  }

  const html = await render(
    VerificationEmail({ actionLink: params.actionLink })
  )

  try {
    const { data, error } = await resend.emails.send({
      from: getNotificationsFrom(),
      to: params.to,
      subject: 'Confirma tu email — Scrutix',
      html,
    })
    if (error) {
      console.error('[transactional] Resend verification error:', error)
      return { ok: false, error: error.message || 'Resend error' }
    }
    return { ok: true, id: data?.id }
  } catch (err) {
    console.error('[transactional] Unexpected verification send error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) {
    console.warn(
      '[transactional] NEXT_PUBLIC_APP_URL not set, falling back to https://app.scrutix.co'
    )
    return 'https://app.scrutix.co'
  }
  return url
}
