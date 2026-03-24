import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isValidLocale } from '@/lib/i18n'
import { getDictionary } from '@/lib/dictionaries'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}

  const dict = await getDictionary(locale)
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `https://scrutix.com/${locale}`,
      languages: {
        en: 'https://scrutix.com/en',
        es: 'https://scrutix.com/es',
        'es-CO': 'https://scrutix.com/co',
        'x-default': 'https://scrutix.com/en',
      },
    },
  }
}

export default async function LocaleMarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  return <>{children}</>
}
