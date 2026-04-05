'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface FinalCtaDict {
  headline: string
  subtitle: string
  ctaPrimary: string
  ctaSecondary: string
}

export default function FinalCTA({ dict }: { dict: FinalCtaDict }) {
  return (
    <section id="demo" className="relative overflow-hidden py-20 sm:py-28">
      {/* Accent background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D4ED8]/5 via-transparent to-[#1D4ED8]/5" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(29,78,216,0.06) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#1E40AF] hover:shadow-xl hover:shadow-blue-500/30"
            >
              {dict.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="mailto:sales@scrutix.com"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#0F0F11] transition-all hover:border-[#d1d5db] hover:bg-[#F7F7F8]"
            >
              {dict.ctaSecondary}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
