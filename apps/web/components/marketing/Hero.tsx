'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, Shield, CreditCard, Clock } from 'lucide-react'

interface HeroDict {
  headline: string
  subheadline: string
  ctaPrimary: string
  ctaSecondary: string
  noCreditCard: string
  trial: string
  soc2: string
}

export default function Hero({ dict }: { dict: HeroDict }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl font-bold tracking-tight text-[#0F0F11] sm:text-5xl lg:text-6xl"
          >
            {dict.headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-[#6B7280] sm:text-xl"
          >
            {dict.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href="#demo"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1D4ED8] px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#1E40AF] hover:shadow-xl hover:shadow-blue-500/30"
            >
              {dict.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-6 text-sm font-semibold text-[#0F0F11] transition-all hover:border-[#d1d5db] hover:bg-[#F7F7F8]"
            >
              <Play className="h-4 w-4" />
              {dict.ctaSecondary}
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B7280]"
          >
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              {dict.noCreditCard}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {dict.trial}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {dict.soc2}
            </span>
          </motion.div>
        </div>

        {/* Hero visual — Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 sm:mt-20"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent blur-2xl" />
            {/* Mock dashboard */}
            <div className="relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#0F0F11] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                <span className="ml-3 text-xs text-white/40">Scrutix Dashboard</span>
              </div>
              <div className="grid grid-cols-12 gap-3 p-4 sm:p-6">
                {/* Sidebar mock */}
                <div className="col-span-3 hidden space-y-2 md:block">
                  {['Dashboard', 'Contacts', 'Canvassing', 'Campaigns', 'AI Agents', 'Analytics'].map((item, i) => (
                    <div
                      key={item}
                      className={`rounded-md px-3 py-2 text-xs ${
                        i === 0
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-white/40'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main content mock */}
                <div className="col-span-12 space-y-3 md:col-span-9">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Contacts', value: '24,891', change: '+12%' },
                      { label: 'Field Coverage', value: '87.3%', change: '+5.2%' },
                      { label: 'AI Actions', value: '142', change: 'today' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="text-[10px] text-white/40 sm:text-xs">{stat.label}</div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-lg">
                          {stat.value}
                        </div>
                        <div className="text-[10px] text-emerald-400">{stat.change}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="flex h-32 items-end justify-between gap-1 rounded-lg border border-white/10 bg-white/5 p-4 sm:h-48">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-blue-500/60"
                        style={{ height: `${25 + Math.sin(i * 0.5) * 25 + i * 2}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
