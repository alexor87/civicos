'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

interface TestimonialsDict {
  headline: string
  items: { quote: string; name: string; role: string; location: string }[]
}

export default function Testimonials({ dict }: { dict: TestimonialsDict }) {
  return (
    <section className="bg-[#F7F7F8] py-20 sm:py-28">
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

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {dict.items.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-6"
            >
              <Quote className="h-5 w-5 text-[#1D4ED8]/30" />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[#0F0F11]">
                &quot;{t.quote}&quot;
              </p>
              <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1D4ED8]/10 text-xs font-bold text-[#1D4ED8]">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F0F11]">{t.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {t.role}, {t.location}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
