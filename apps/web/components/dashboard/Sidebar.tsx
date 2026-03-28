'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Map, Brain, UserCircle, Mail, BarChart2, Sparkles,
  GitBranch, Megaphone, BookOpen, CalendarDays, Settings, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { RealtimeSuggestionsBadge } from '@/components/dashboard/RealtimeSuggestionsBadge'
import { usePermissions, usePermissionsLoading } from '@/hooks/usePermission'
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/components/ui/tooltip'

const NAV_GROUPS: { label?: string; items: { href: string; label: string; icon: typeof LayoutDashboard; badge?: boolean; permission?: string }[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { href: '/dashboard/contacts',  label: 'Contactos',   icon: Users,        permission: 'contacts.view' },
      { href: '/dashboard/calendar',  label: 'Calendario',  icon: CalendarDays, permission: 'calendar.view' },
      { href: '/dashboard/team',      label: 'Voluntarios', icon: UserCircle,   permission: 'volunteers.view' },
    ],
  },
  {
    label: 'Territorio',
    items: [
      { href: '/dashboard/canvassing', label: 'Territorio', icon: Map, permission: 'territory.view' },
    ],
  },
  {
    label: 'Comunicaciones',
    items: [
      { href: '/dashboard/comunicaciones',    label: 'Comunicaciones',   icon: Mail,      permission: 'communications.view' },
      { href: '/dashboard/campaigns',         label: 'Campañas',         icon: Megaphone, permission: 'communications.view' },
      { href: '/dashboard/automatizaciones',  label: 'Automatizaciones', icon: GitBranch, permission: 'flows.view' },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { href: '/dashboard/reportes',       label: 'Reportes',          icon: BarChart2, permission: 'reports.view' },
      { href: '/dashboard/ai',             label: 'Agentes IA',        icon: Brain, badge: true, permission: 'ai_agents.view' },
      { href: '/dashboard/ai/knowledge',   label: 'Base Conocimiento', icon: BookOpen,  permission: 'knowledge_base.view' },
      { href: '/dashboard/contenido',      label: 'Contenido IA',      icon: Sparkles,  permission: 'content_ia.view' },
    ],
  },
]

interface Props {
  tenantName: string
  campaignName: string
  userFullName: string | null
  userRole: string
  userInitials: string
  campaignId: string
  suggestionCount: number
  brandColor: string
  slogan?: string | null
  logoUrl?: string | null
}

export function Sidebar({
  tenantName,
  campaignName,
  campaignId,
  suggestionCount,
  slogan,
  logoUrl,
}: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const allNavPermissions = NAV_GROUPS.flatMap(g => g.items).map(i => i.permission).filter(Boolean) as string[]
  const perms = usePermissions(allNavPermissions)
  const permsLoading = usePermissionsLoading()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const settingsActive = pathname.startsWith('/dashboard/settings')

  return (
    <TooltipProvider>
      <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 border-r border-slate-200 dark:border-slate-800 transition-all duration-200`}>

        {/* Brand identity block */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} pt-5 pb-4 border-b border-slate-100 dark:border-slate-800`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`${collapsed ? 'h-10 w-10' : 'h-12 w-12'} rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-md transition-all duration-200`}
              style={{ boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)' }}>
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={campaignName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white font-bold text-base bg-primary">
                  {campaignName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {campaignName}
                </p>
                {slogan ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate italic">&ldquo;{slogan}&rdquo;</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-0.5">{tenantName}</p>
                )}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="mt-3 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 27%, transparent))' }} />
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'} py-2`}>
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = permsLoading
              ? group.items
              : group.items.filter(item => !item.permission || perms[item.permission])
            if (visibleItems.length === 0) return null
            return (
              <div key={gi}>
                {group.label && !collapsed && (
                  <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                )}
                {group.label && collapsed && gi > 0 && (
                  <div className="my-2 mx-1 h-px bg-slate-200 dark:bg-slate-700" />
                )}
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const active = isActive(item.href)
                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
                        {!collapsed && <span className="flex-1">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <RealtimeSuggestionsBadge
                            campaignId={campaignId}
                            initialCount={suggestionCount}
                          />
                        )}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger render={linkContent} />
                          <TooltipContent side="right" sideOffset={8}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return linkContent
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer: Settings + Collapse toggle */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} pb-3 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1`}>
          {/* Settings link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/dashboard/settings"
                    className={`flex items-center justify-center px-2 py-2 rounded-lg text-sm transition-colors ${
                      settingsActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Settings className={`h-4 w-4 ${settingsActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
                  </Link>
                }
              />
              <TooltipContent side="right" sideOffset={8}>
                Configuraci&oacute;n
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                settingsActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className={`h-4 w-4 flex-shrink-0 ${settingsActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="flex-1">Configuraci&oacute;n</span>
            </Link>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 w-full rounded-lg text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
