'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, Building2, User, MapPin, Plus, ChevronDown, Check, LogOut } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/contacts': 'CRM de Contactos',
  '/dashboard/canvassing': 'Territorio',
  '/dashboard/calendar/timeline': 'Línea de Tiempo Electoral',
  '/dashboard/calendar/warroom': 'Sala de Guerra',
  '/dashboard/calendar': 'Calendario',
  '/dashboard/comunicaciones': 'Comunicaciones',
  '/dashboard/ai': 'Centro de Inteligencia',
  '/dashboard/team': 'Equipo',
  '/dashboard/reportes': 'Reportes',
  '/dashboard/contenido': 'Contenido IA',
  '/dashboard/automatizaciones/new/ia': 'Crear Flow con IA',
  '/dashboard/automatizaciones/new': 'Nuevo Flow',
  '/dashboard/automatizaciones': 'Automatizaciones',
  '/dashboard/campaigns': 'Campañas',
  '/dashboard/settings': 'Configuración',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  campaign_manager: 'Campaign Manager',
  field_coordinator: 'Coordinador',
  volunteer: 'Voluntario',
  analyst: 'Analista',
}

interface SearchContact    { id: string; first_name: string; last_name: string; email?: string | null; phone?: string | null }
interface SearchTerritory  { id: string; name: string }
interface SearchResults    { contacts: SearchContact[]; territories: SearchTerritory[] }

interface Props {
  campaignName: string
  userFullName: string | null
  userInitials: string
  userRole: string
  campaigns?: { id: string; name: string }[]
  activeCampaignId?: string
}

export function DashboardHeader({ campaignName, userFullName, userInitials, userRole, campaigns = [], activeCampaignId }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const campaignRef = useRef<HTMLDivElement>(null)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  // Find best matching title
  const pageTitle = Object.entries(PAGE_TITLES)
    .filter(([path]) => pathname.startsWith(path))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data: SearchResults = await res.json()
        setResults(data)
        setOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  // Close on click outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
      if (campaignRef.current && !campaignRef.current.contains(e.target as Node)) {
        setCampaignOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const hasResults = results && (results.contacts.length > 0 || results.territories.length > 0)

  function goToContact(c: SearchContact) {
    setOpen(false); setQuery('')
    router.push(`/dashboard/contacts?q=${encodeURIComponent(`${c.first_name} ${c.last_name}`)}`)
  }

  function goToTerritory(t: SearchTerritory) {
    setOpen(false); setQuery('')
    router.push(`/dashboard/canvassing?territory=${encodeURIComponent(t.id)}`)
  }

  async function switchCampaign(id: string) {
    if (id === activeCampaignId || switching) return
    setSwitching(true)
    try {
      const res = await fetch('/api/campaigns/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id }),
      })
      if (res.ok) {
        setCampaignOpen(false)
        router.refresh()
      }
    } finally {
      setSwitching(false)
    }
  }

  const showCampaignSwitcher = userRole === 'super_admin' && campaigns.length > 0

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 flex-shrink-0 z-10">
      {/* Left: campaign name */}
      <div className="flex items-center gap-4">
        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded">
          <Building2 className="h-4 w-4 text-slate-500" />
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">{campaignName}</h2>
      </div>

      {/* Right: search + campaign switcher + notifications + user */}
      <div className="flex items-center gap-6">

        {/* Search */}
        <div ref={wrapperRef} className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''))}
            placeholder="Buscar datos, zonas..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
          />

          {/* Search Dropdown */}
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#dcdee6] rounded-lg shadow-lg overflow-hidden z-50">
              {loading && (
                <div className="px-4 py-3 text-xs text-[#6a737d]">Buscando…</div>
              )}

              {!loading && !hasResults && (
                <div className="px-4 py-3 text-xs text-[#6a737d]">Sin resultados para «{query}»</div>
              )}

              {!loading && results && results.contacts.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#6a737d] uppercase tracking-wider bg-muted">
                    Contactos
                  </div>
                  {results.contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => goToContact(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-6 w-6 rounded-full bg-[#2960ec]/10 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-[#2960ec]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1b1f23] truncate">
                          {c.first_name} {c.last_name}
                        </p>
                        {(c.email || c.phone) && (
                          <p className="text-xs text-[#6a737d] truncate">{c.email ?? c.phone}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && results && results.territories.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#6a737d] uppercase tracking-wider bg-muted">
                    Territorios
                  </div>
                  {results.territories.map(t => (
                    <button
                      key={t.id}
                      onClick={() => goToTerritory(t)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-6 w-6 rounded-full bg-[#28a745]/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-[#28a745]" />
                      </div>
                      <p className="text-sm font-medium text-[#1b1f23] truncate">{t.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Campaign Switcher */}
        {showCampaignSwitcher && (
          <div ref={campaignRef} className="relative">
            <button
              onClick={() => setCampaignOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm text-slate-700"
            >
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="max-w-[160px] truncate font-medium">Seleccionar campaña</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${campaignOpen ? 'rotate-180' : ''}`} />
            </button>

            {campaignOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#dcdee6] rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-3 py-2 text-[10px] font-semibold text-[#6a737d] uppercase tracking-wider border-b border-slate-100">
                  Campañas
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {campaigns.map(c => (
                    <button
                      key={c.id}
                      onClick={() => switchCampaign(c.id)}
                      disabled={switching}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-sm ${
                        c.id === activeCampaignId
                          ? 'bg-primary/5 text-primary font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                        c.id === activeCampaignId ? 'bg-primary/10' : 'bg-slate-100'
                      }`}>
                        {c.id === activeCampaignId
                          ? <Check className="h-3.5 w-3.5 text-primary" />
                          : <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        }
                      </div>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100">
                  <Link
                    href="/dashboard/campaigns/new"
                    onClick={() => setCampaignOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium">Nueva Campaña</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 ml-2 cursor-pointer hover:opacity-80 transition-opacity outline-none">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{userFullName ?? 'Usuario'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ROLE_LABELS[userRole] ?? userRole}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">{userInitials}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                  )
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
