/**
 * Global on/off switches for non-email messaging channels.
 *
 * Both flags are temporarily `false` while we sort out SMS and WhatsApp
 * provider strategy (Infobip Colombia route activation, Twilio onboarding).
 * Flip a flag to `true` to bring the channel back across the entire app —
 * no migration or env var deploy required.
 */

export const SMS_CHANNEL_ENABLED      = false
export const WHATSAPP_CHANNEL_ENABLED = false

export const ANY_NON_EMAIL_CHANNEL_ENABLED =
  SMS_CHANNEL_ENABLED || WHATSAPP_CHANNEL_ENABLED

export type MessagingChannelKey = 'email' | 'sms' | 'whatsapp'

export function isChannelEnabled(channel: MessagingChannelKey): boolean {
  if (channel === 'email')    return true
  if (channel === 'sms')      return SMS_CHANNEL_ENABLED
  if (channel === 'whatsapp') return WHATSAPP_CHANNEL_ENABLED
  return false
}
