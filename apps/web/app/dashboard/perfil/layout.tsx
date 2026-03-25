'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Shield, Bell, Building2, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { href: '/dashboard/perfil/informacion', label: 'Información personal', icon: User },
  { href: '/dashboard/perfil/seguridad', label: 'Seguridad', icon: Shield },
  { href: '/dashboard/perfil/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/perfil/campanas', label: 'Mis campañas', icon: Building2 },
  { href: '/dashboard/perfil/preferencias', label: 'Preferencias', icon: Palette },
]

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full">
      {/* Left menu */}
      <nav className="w-[220px] border-r border-slate-200 bg-white p-4 flex-shrink-0">
        <h2 className="text-sm font-bold text-slate-900 mb-4 px-3">Mi perfil</h2>
        <ul className="space-y-1">
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Right content */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  )
}
