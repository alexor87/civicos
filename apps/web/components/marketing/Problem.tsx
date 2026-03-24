'use client'

import { motion } from 'framer-motion'
import { Layers, BrainCircuit, EyeOff } from 'lucide-react'

interface ProblemDict {
  headline: string
  headlineAccent: string
  points: { title: string; description: string }[]
  bridge: string
}

const ICONS = [Layers, BrainCircuit, EyeOff]

export default function Problem({ dict }: { dict: ProblemDict }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#0F0F11] sm:text-4xl">
            {dict.headline}{' '}
            <span className="text-[#1D4ED8]">{dict.headlineAccent}</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {dict.points.map((point, i) => {
            const Icon = ICONS[i]
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-xl border border-[#E5E7EB] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#d1d5db] hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0F0F11]">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                  {point.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 max-w-2xl text-center text-base text-[#6B7280]"
        >
          {dict.bridge}
        </motion.p>
      </div>
    </section>
  )
}
