/**
 * Normalize a Colombian phone number to 57XXXXXXXXXX format.
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 12 && cleaned.startsWith('57')) return cleaned
  if (cleaned.length === 10 && cleaned.startsWith('3')) return '57' + cleaned
  return cleaned
}
