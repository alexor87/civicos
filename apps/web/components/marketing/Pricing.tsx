'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/format-price'

interface PricingDict {
  headline: string
  subtitle: string
  footnote: string
  plans: {
    name: string
    price: number | string
    period: string
    description: string
    features: string[]
    cta: string
    highlighted: boolean
    badge?: string
  }[]
}

export default function Pricing({ dict, locale }: { dict: PricingDict; locale: Locale }) {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#0F0F11] sm:text-4xl">
            {dict.headline}
          </h2>
          <p className="mt-4 text-base text-[#6B7280]">
            {dict.subtitle}
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col rounded-xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                plan.highlighted
                  ? 'border-[#1D4ED8] bg-white shadow-lg shadow-blue-500/10'
                  : 'border-[#E5E7EB] bg-white'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1D4ED8] px-3 py-1 text-xs font-medium text-white">
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="text-sm font-semibold text-[#6B7280]">{plan.name}</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-bold tracking-tight text-[#0F0F11]">
                    {formatPrice(plan.price, locale)}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-sm text-[#6B7280]">{plan.period}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#6B7280]">{plan.description}</p>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#059669]" />
                    <span className="text-sm text-[#0F0F11]">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#demo"
                className={`mt-6 inline-flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  plan.highlighted
                    ? 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF]'
                    : 'border border-[#E5E7EB] bg-white text-[#0F0F11] hover:bg-[#F7F7F8]'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[#6B7280]">
          {dict.footnote}
        </p>
      </div>
    </section>
  )
}
