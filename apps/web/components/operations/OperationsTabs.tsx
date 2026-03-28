'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard/operations', label: 'Resumen', exact: true },
  { href: '/dashboard/operations/board', label: 'Tablero' },
  { href: '/dashboard/operations/list', label: 'Lista' },
]

export function OperationsTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 mt-4 border-b border-slate-200 dark:border-slate-700">
      {TABS.map(tab => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
