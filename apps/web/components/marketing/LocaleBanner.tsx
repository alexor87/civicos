'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
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
  const [open, setOpen] = useState(false)

  const meta = LOCALE_META[locale]

  function switchLocale(target: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    window.location.href = `/${target}`
  }

  return (
    <div className="relative z-40 border-b border-slate-100 bg-white">
      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow"
          >
            <span>{meta.label}</span>
            <span className="text-sm leading-none">{meta.flag}</span>
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl ring-1 ring-black/5">
                {LOCALES.map((l) => {
                  const m = LOCALE_META[l]
                  const active = l === locale
                  return (
                    <button
                      key={l}
                      onClick={() => { setOpen(false); switchLocale(l) }}
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
    </div>
  )
}
