'use client'

import { useState } from 'react'
import { X, ChevronDown, Globe } from 'lucide-react'
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
    <div className="relative z-40 border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-10 py-2 sm:px-12">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Globe className="h-3 w-3 text-slate-400" />
          <span>
            {meta.flag} {dict.viewing}{' '}
            <span className="font-semibold text-slate-700">{meta.label}</span>
          </span>

          <span className="mx-1 text-slate-300">·</span>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-0.5 font-medium text-slate-500 underline-offset-2 transition-colors hover:text-slate-800 hover:underline"
            >
              {dict.change}
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl ring-1 ring-black/5">
                  {LOCALES.map((l) => {
                    const m = LOCALE_META[l]
                    return (
                      <button
                        key={l}
                        onClick={() => { setOpen(false); switchLocale(l) }}
                        className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors hover:bg-slate-50 ${
                          l === locale
                            ? 'font-semibold text-blue-600'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="text-sm">{m.flag}</span>
                        <span>{m.label}</span>
                        <span className="ml-auto font-normal text-slate-400">{m.currency}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setDismissed(true)
            try { localStorage.setItem('scrutix-banner-dismissed', '1') } catch {}
          }}
          className="absolute right-4 rounded p-1 text-slate-400 transition-colors hover:text-slate-600 sm:right-6 lg:right-8"
          aria-label="Cerrar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
