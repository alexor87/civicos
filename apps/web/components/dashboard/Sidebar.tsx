'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Map, Brain, UserCircle, LogOut, Mail, BarChart2, Settings, Sparkles, GitBranch, Megaphone, BookOpen, CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeSuggestionsBadge } from '@/components/dashboard/RealtimeSuggestionsBadge'

const NAV_GROUPS: { label?: string; items: { href: string; label: string; icon: typeof LayoutDashboard; badge?: boolean }[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { href: '/dashboard/contacts',  label: 'Contactos',   icon: Users      },
      { href: '/dashboard/calendar',  label: 'Calendario',  icon: CalendarDays },
      { href: '/dashboard/team',      label: 'Voluntarios', icon: UserCircle },
    ],
  },
  {
    label: 'Territorio',
    items: [
      { href: '/dashboard/canvassing', label: 'Territorio', icon: Map },
    ],
  },
  {
    label: 'Comunicaciones',
    items: [
      { href: '/dashboard/comunicaciones',    label: 'Comunicaciones',   icon: Mail      },
      { href: '/dashboard/campaigns',         label: 'Campañas',         icon: Megaphone },
      { href: '/dashboard/automatizaciones',  label: 'Automatizaciones', icon: GitBranch },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { href: '/dashboard/reportes',       label: 'Reportes',          icon: BarChart2 },
      { href: '/dashboard/ai',             label: 'Agentes IA',        icon: Brain, badge: true },
      { href: '/dashboard/ai/knowledge',   label: 'Base Conocimiento', icon: BookOpen  },
      { href: '/dashboard/contenido',      label: 'Contenido IA',      icon: Sparkles  },
    ],
  },
  {
    items: [
      { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
    ],
  },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  campaign_manager: 'Campaign Manager',
  field_coordinator: 'Coordinador',
  volunteer: 'Voluntario',
  analyst: 'Analista',
}

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
  userFullName,
  userRole,
  userInitials,
  campaignId,
  suggestionCount,
  brandColor,
  slogan,
  logoUrl,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 border-r border-slate-200 dark:border-slate-800">

      {/* Brand identity block */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Candidate photo or colored initials */}
          <div className="h-12 w-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-md"
            style={{ boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)' }}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={campaignName}
                width={48}
                height={48}
                className="h-12 w-12 object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 flex items-center justify-center text-white font-bold text-base bg-primary"
              >
                {campaignName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {/* Campaign name + slogan */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
              {campaignName}
            </p>
            {slogan ? (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate italic">"{slogan}"</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">{tenantName}</p>
            )}
          </div>
        </div>

        {/* Brand color accent strip */}
        <div className="mt-3 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 27%, transparent))' }} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <RealtimeSuggestionsBadge
                        campaignId={campaignId}
                        initialCount={suggestionCount}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-default">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-none">{userFullName ?? 'Usuario'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
