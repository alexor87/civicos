import type { Locale } from './i18n'
import { LOCALE_META } from './i18n'

export function formatPrice(amount: number | string, locale: Locale): string {
  if (typeof amount === 'string') return amount // "Custom" / "Personalizado"

  const { currency, intlLocale } = LOCALE_META[locale]
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
