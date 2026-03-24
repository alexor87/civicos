'use client'

import { motion } from 'framer-motion'
import {
  MessageCircle, Mail, Smartphone, MapPin, BrainCircuit,
  Database, Chrome, Hash,
} from 'lucide-react'
import { INTEGRATIONS } from '@/lib/marketing-constants'

const ICONS = {
  MessageCircle, Mail, Smartphone, MapPin, BrainCircuit,
  Database, Chrome, Hash,
} as const

export default function Integrations() {
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
            Connects with the tools your campaign already uses
          </h2>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {INTEGRATIONS.map((integration, i) => {
            const Icon = ICONS[integration.icon]
            return (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Icon className="h-7 w-7 text-[#6B7280]" />
                <span className="text-center text-xs font-medium text-[#0F0F11]">
                  {integration.name}
                </span>
                {integration.badge && (
                  <span className="absolute top-2 right-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    {integration.badge}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[#6B7280]">
          Open API available for custom integrations
        </p>
      </div>
    </section>
  )
}
