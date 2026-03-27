'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PermissionGate } from '@/components/auth/PermissionGate'

const TABS = [
  { href: '/dashboard/settings/team', label: 'Miembros del equipo', exact: true },
  {
    href: '/dashboard/settings/team/roles',
    label: 'Roles y permisos',
    permission: 'roles.manage' as const,
  },
]

export function TeamSubNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-slate-200 mb-6">
      {TABS.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        const link = (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </Link>
        )

        if (tab.permission) {
          return (
            <PermissionGate key={tab.href} permission={tab.permission}>
              {link}
            </PermissionGate>
          )
        }

        return link
      })}
    </div>
  )
}
