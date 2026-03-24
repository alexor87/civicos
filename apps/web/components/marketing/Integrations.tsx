'use client'

import { motion } from 'framer-motion'
import {
  MessageCircle, Mail, Smartphone, MapPin, BrainCircuit,
  Database, Chrome, Hash,
} from 'lucide-react'

interface IntegrationsDict {
  headline: string
  items: { name: string; badge?: string }[]
  footnote: string
}

const INTEGRATION_ICONS = [MessageCircle, Mail, Smartphone, MapPin, BrainCircuit, Database, Chrome, Hash]

export default function Integrations({ dict }: { dict: IntegrationsDict }) {
  return (
    <section id="integrations" className="bg-[#F7F7F8] py-20 sm:py-28">
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
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {dict.items.map((item, i) => {
            const Icon = INTEGRATION_ICONS[i]
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Icon className="h-7 w-7 text-[#6B7280]" />
                <span className="text-center text-xs font-medium text-[#0F0F11]">
                  {item.name}
                </span>
                {item.badge && (
                  <span className="absolute top-2 right-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[#6B7280]">
          {dict.footnote}
        </p>
      </div>
    </section>
  )
}
