// ── i18n Configuration ─────────────────────────────────────────────────

export const LOCALES = ['en', 'es', 'co'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_COOKIE = 'scrutix-locale'

export function isValidLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

/** Map ISO country codes to locale slugs */
export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  CO: 'co',
  MX: 'es',
  AR: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  EC: 'es',
  BO: 'es',
  PY: 'es',
  UY: 'es',
  HN: 'es',
  GT: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  DO: 'es',
  CU: 'es',
  PR: 'es',
  ES: 'es',
}

export const LOCALE_META: Record<
  Locale,
  { currency: string; symbol: string; intlLocale: string; flag: string; label: string }
> = {
  en: { currency: 'USD', symbol: '$', intlLocale: 'en-US', flag: '🌐', label: 'International (EN)' },
  es: { currency: 'USD', symbol: '$', intlLocale: 'es-ES', flag: '🌎', label: 'Latinoamérica' },
  co: { currency: 'COP', symbol: '$', intlLocale: 'es-CO', flag: '🇨🇴', label: 'Colombia' },
}
