'use client'

import { motion } from 'framer-motion'

interface LogoBarDict {
  trusted: string
  metrics: { value: string; label: string }[]
}

export default function LogoBar({ dict }: { dict: LogoBarDict }) {
  return (
    <section className="border-y border-[#E5E7EB] bg-[#F7F7F8] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-[#6B7280]"
        >
          {dict.trusted}
        </motion.p>

        <div className="mt-8 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
          {dict.metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold tracking-tight text-[#0F0F11] sm:text-4xl">
                {metric.value}
              </div>
              <div className="mt-1 text-sm text-[#6B7280]">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
