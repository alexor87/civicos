'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions, usePermissionsLoading } from '@/hooks/usePermission'

const TABS = [
  { href: '/dashboard/settings/campaign',     label: 'Campaña',           permission: 'settings.campaign' },
  { href: '/dashboard/settings/team',         label: 'Equipo',            permission: 'team.view' },
  { href: '/dashboard/settings/integrations', label: 'Integraciones',     permission: 'settings.integrations' },
  { href: '/dashboard/settings/geo-data',     label: 'Base Geográfica',   permission: 'settings.geo' },
  { href: '/dashboard/settings/api',          label: 'API',               permission: 'settings.api' },
  { href: '/dashboard/settings/brand',        label: 'Marca e Identidad', permission: 'settings.brand' },
]

export function SettingsTabs() {
  const pathname = usePathname()
  const perms = usePermissions(TABS.map(t => t.permission))
  const loading = usePermissionsLoading()
  const visibleTabs = loading ? TABS : TABS.filter(t => perms[t.permission])

  return (
    <div className="border-b border-[#dcdee6]">
      <nav className="flex gap-1 -mb-px">
        {visibleTabs.map(tab => {
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
