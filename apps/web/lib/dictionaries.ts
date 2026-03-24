import type { Locale } from './i18n'

const loaders: Record<Locale, () => Promise<Record<string, unknown>>> = {
  en: () => import('@/dictionaries/en.json').then(m => m.default as Record<string, unknown>),
  es: () => import('@/dictionaries/es.json').then(m => m.default as Record<string, unknown>),
  co: () => import('@/dictionaries/co.json').then(m => m.default as Record<string, unknown>),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDictionary(locale: Locale): Promise<any> {
  return loaders[locale]()
}
