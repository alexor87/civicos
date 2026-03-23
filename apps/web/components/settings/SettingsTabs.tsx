'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard/settings/campaign',     label: 'Campaña'          },
  { href: '/dashboard/settings/team',         label: 'Equipo'           },
  { href: '/dashboard/settings/integrations', label: 'Integraciones'    },
  { href: '/dashboard/settings/geo-data',     label: 'Base Geográfica'  },
  { href: '/dashboard/settings/api',          label: 'API'              },
  { href: '/dashboard/settings/brand',        label: 'Marca e Identidad' },
]

export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b border-[#dcdee6]">
      <nav className="flex gap-1 -mb-px">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-[#2960ec] text-[#2960ec]'
                  : 'border-transparent text-[#6a737d] hover:text-[#1b1f23] hover:border-[#dcdee6]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
