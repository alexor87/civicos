import { notFound } from 'next/navigation'
import { isValidLocale, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/dictionaries'

import Nav from '@/components/marketing/Nav'
import Hero from '@/components/marketing/Hero'
import LogoBar from '@/components/marketing/LogoBar'
import Problem from '@/components/marketing/Problem'
import Features from '@/components/marketing/Features'
import AIAgents from '@/components/marketing/AIAgents'
import Integrations from '@/components/marketing/Integrations'
import Pricing from '@/components/marketing/Pricing'
import Testimonials from '@/components/marketing/Testimonials'
import FinalCTA from '@/components/marketing/FinalCTA'
import Footer from '@/components/marketing/Footer'
import LocaleBanner from '@/components/marketing/LocaleBanner'

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const dict = await getDictionary(locale as Locale)

  return (
    <main className="min-h-screen bg-white">
      <Nav dict={dict.nav} locale={locale} />
      <LocaleBanner locale={locale} dict={dict.localeBanner} />
      <Hero dict={dict.hero} />
      <LogoBar dict={dict.logoBar} />
      <Problem dict={dict.problem} />
      <Features dict={dict.features} />
      <AIAgents dict={dict.aiAgents} />
      <Integrations dict={dict.integrations} />
      <Pricing dict={dict.pricing} locale={locale} />
      <Testimonials dict={dict.testimonials} />
      <FinalCTA dict={dict.finalCta} />
      <Footer dict={dict.footer} />
    </main>
  )
}
