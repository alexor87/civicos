'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

interface NavDict {
  links: { label: string; href: string }[]
  signIn: string
  requestDemo: string
}

export default function Nav({ dict, locale }: { dict: NavDict; locale: Locale }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href={`/${locale}`} className="text-xl font-bold tracking-tight text-[#0F0F11]">
            Scrutix
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {dict.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#0F0F11]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a
              href="/login"
              className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#0F0F11]"
            >
              {dict.signIn}
            </a>
            <a
              href="#demo"
              className="inline-flex h-9 items-center rounded-lg bg-[#1D4ED8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF]"
            >
              {dict.requestDemo}
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-[#0F0F11]" />
            ) : (
              <Menu className="h-5 w-5 text-[#0F0F11]" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-[#E5E7EB] bg-white px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3">
            {dict.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#6B7280]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="border-[#E5E7EB]" />
            <a href="/login" className="text-sm font-medium text-[#6B7280]">
              {dict.signIn}
            </a>
            <a
              href="#demo"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1D4ED8] text-sm font-medium text-white"
            >
              {dict.requestDemo}
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
