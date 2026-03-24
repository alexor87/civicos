'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, ChevronDown, Check } from 'lucide-react'
import { LOCALES, LOCALE_META, LOCALE_COOKIE, type Locale } from '@/lib/i18n'

interface NavDict {
  links: { label: string; href: string }[]
  signIn: string
  requestDemo: string
}

export default function Nav({ dict, locale }: { dict: NavDict; locale: Locale }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [localeOpen, setLocaleOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function switchLocale(target: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    window.location.href = `/${target}`
  }

  const meta = LOCALE_META[locale]

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

          <div className="hidden items-center gap-3 md:flex">
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

            {/* Locale selector */}
            <div className="relative">
              <button
                onClick={() => setLocaleOpen(!localeOpen)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{meta.label}</span>
                <span className="text-sm leading-none">{meta.flag}</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${localeOpen ? 'rotate-180' : ''}`} />
              </button>

              {localeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLocaleOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl ring-1 ring-black/5">
                    {LOCALES.map((l) => {
                      const m = LOCALE_META[l]
                      const active = l === locale
                      return (
                        <button
                          key={l}
                          onClick={() => { setLocaleOpen(false); switchLocale(l) }}
                          className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors hover:bg-slate-50 ${
                            active ? 'text-blue-600' : 'text-slate-700'
                          }`}
                        >
                          <span className="text-sm">{m.flag}</span>
                          <span className={active ? 'font-semibold' : ''}>{m.label}</span>
                          <span className="ml-auto text-slate-400">{m.currency}</span>
                          {active && <Check className="h-3 w-3 text-blue-600" />}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
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
            <hr className="border-[#E5E7EB]" />
            <div className="flex flex-col gap-1">
              {LOCALES.map((l) => {
                const m = LOCALE_META[l]
                const active = l === locale
                return (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                      active ? 'font-semibold text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    <span>{m.flag}</span>
                    <span>{m.label}</span>
                    <span className="ml-auto text-xs text-slate-400">{m.currency}</span>
                    {active && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

