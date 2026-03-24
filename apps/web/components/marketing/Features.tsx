'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, BrainCircuit, Smartphone, Check } from 'lucide-react'

interface FeaturesDict {
  headline: string
  subtitle: string
  tabs: {
    title: string
    subtitle: string
    items: string[]
    quote?: string
  }[]
}

const TAB_ICONS = [Settings, BrainCircuit, Smartphone]

export default function Features({ dict }: { dict: FeaturesDict }) {
  const [active, setActive] = useState(0)

  return (
    <section id="features" className="bg-[#F7F7F8] py-20 sm:py-28">
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

        {/* Tabs */}
        <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          {dict.tabs.map((tab, i) => {
            const Icon = TAB_ICONS[i]
            return (
              <button
                key={tab.title}
                onClick={() => setActive(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all sm:w-auto ${
                  active === i
                    ? 'bg-[#1D4ED8] text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white text-[#6B7280] hover:bg-white/80 hover:text-[#0F0F11]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.title}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-10 grid items-center gap-10 lg:grid-cols-2"
          >
            {/* Feature list */}
            <div>
              <h3 className="text-2xl font-bold text-[#0F0F11]">
                {dict.tabs[active].title}
              </h3>
              <p className="mt-2 text-base text-[#6B7280]">
                {dict.tabs[active].subtitle}
              </p>
              <ul className="mt-6 space-y-3">
                {dict.tabs[active].items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
                    <span className="text-sm text-[#0F0F11]">{item}</span>
                  </li>
                ))}
              </ul>

              {dict.tabs[active].quote && (
                <blockquote className="mt-6 border-l-2 border-[#1D4ED8] pl-4 text-sm italic text-[#6B7280]">
                  {dict.tabs[active].quote}
                </blockquote>
              )}
            </div>

            {/* Visual placeholder */}
            <div className="relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#F7F7F8] to-white p-6">
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  {React.createElement(TAB_ICONS[active], {
                    className: 'h-12 w-12 text-[#1D4ED8]/30',
                  })}
                  <span className="text-sm font-medium text-[#6B7280]/60">
                    {dict.tabs[active].title} Preview
                  </span>
                  {/* Mock UI elements */}
                  <div className="mt-4 w-full max-w-xs space-y-2">
                    {[75, 60, 90, 45].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="h-2 rounded-full bg-[#1D4ED8]/15"
                          style={{ width: `${w}%` }}
                        />
                        <div className="h-2 flex-1 rounded-full bg-[#E5E7EB]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
