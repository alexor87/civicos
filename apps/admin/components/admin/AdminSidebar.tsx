'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Layers3,
  Plug,
  ScrollText,
  Shield,
  LogOut,
  CheckCircle,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: false },
  { href: '/dashboard/tenants', label: 'Organizaciones', icon: Building2, badge: false },
  { href: '/dashboard/approvals', label: 'Aprobaciones', icon: CheckCircle, badge: true },
  { href: '/dashboard/plans', label: 'Planes y Features', icon: Layers3, badge: false },
  { href: '/dashboard/services', label: 'Servicios', icon: Plug, badge: false },
  { href: '/dashboard/audit', label: 'Auditoría', icon: ScrollText, badge: false },
] as const

interface Props {
  adminName: string
  adminEmail: string
  pendingApprovals?: number
}

export function AdminSidebar({ adminName, adminEmail, pendingApprovals = 0 }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">Scrutix Admin</p>
            <p className="text-xs text-sidebar-foreground/50">Backoffice v1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && pendingApprovals > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {pendingApprovals}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Admin user */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-foreground">
            {adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{adminName}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{adminEmail}</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors" title="Cerrar sesión">
              <LogOut className="w-4 h-4 text-sidebar-foreground/50" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
