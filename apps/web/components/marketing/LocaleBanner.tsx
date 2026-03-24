'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { LOCALES, LOCALE_META, LOCALE_COOKIE, type Locale } from '@/lib/i18n'

interface LocaleBannerDict {
  viewing: string
  change: string
}

export default function LocaleBanner({
  locale,
  dict,
}: {
  locale: Locale
  dict: LocaleBannerDict
}) {
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)

  if (dismissed) return null

  const meta = LOCALE_META[locale]

  function switchLocale(target: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    window.location.href = `/${target}`
  }

  return (
    <div className="relative z-40 border-b border-[#E5E7EB] bg-[#F7F7F8]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <span>
            {meta.flag} {dict.viewing} <strong className="text-[#0F0F11]">{meta.label}</strong>
          </span>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium text-[#0F0F11] transition-colors hover:bg-[#F7F7F8]"
            >
              {dict.change}
              <ChevronDown className="h-3 w-3" />
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                {LOCALES.map((l) => {
                  const m = LOCALE_META[l]
                  return (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#F7F7F8] ${
                        l === locale ? 'font-semibold text-[#1D4ED8]' : 'text-[#0F0F11]'
                      }`}
                    >
                      <span>{m.flag}</span>
                      <span>{m.label}</span>
                      <span className="ml-auto text-[10px] text-[#6B7280]">{m.currency}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setDismissed(true)
            try { localStorage.setItem('scrutix-banner-dismissed', '1') } catch {}
          }}
          className="rounded p-1 text-[#6B7280] transition-colors hover:text-[#0F0F11]"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
