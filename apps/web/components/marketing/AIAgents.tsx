'use client'

import { motion } from 'framer-motion'
import {
  UserCheck, MapPin, Send, Map, BarChart3, PenTool, ShieldCheck,
} from 'lucide-react'

interface AIAgentsDict {
  headline: string
  headlineAccent: string
  description: string
  agents: { name: string; description: string }[]
  controlTitle: string
  controlDescription: string
}

const AGENT_ICONS = [UserCheck, MapPin, Send, Map, BarChart3, PenTool]

export default function AIAgents({ dict }: { dict: AIAgentsDict }) {
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
          <p className="mt-4 text-base text-[#6B7280]">
            {dict.description}
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dict.agents.map((agent, i) => {
            const Icon = AGENT_ICONS[i]
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#1D4ED8]/30 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8] transition-colors group-hover:bg-[#1D4ED8] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#0F0F11]">
                  {agent.name}
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">{agent.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Human-in-the-loop callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-10 flex max-w-2xl items-start gap-3 rounded-xl border border-[#059669]/20 bg-emerald-50/50 p-5"
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
          <div>
            <p className="text-sm font-semibold text-[#0F0F11]">
              {dict.controlTitle}
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              {dict.controlDescription}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
