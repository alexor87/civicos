'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useCallback } from 'react'

const ACTIONS = [
  { value: 'all', label: 'Todas las acciones' },
  { value: 'tenant_created', label: 'Tenant creado' },
  { value: 'tenant_updated', label: 'Tenant actualizado' },
  { value: 'plan_changed', label: 'Plan cambiado' },
  { value: 'tenant_suspended', label: 'Suspensión' },
  { value: 'tenant_reactivated', label: 'Reactivación' },
  { value: 'feature_override_set', label: 'Override activado' },
  { value: 'feature_override_removed', label: 'Override eliminado' },
  { value: 'plan_features_updated', label: 'Features actualizados' },
  { value: 'admin_login', label: 'Login' },
  { value: 'impersonate_start', label: 'Impersonación' },
]

export function AuditFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tenant, setTenant] = useState(searchParams.get('tenant') ?? '')

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/dashboard/audit?${params.toString()}`)
  }, [router, searchParams])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams('tenant', tenant)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder="Buscar por organización..."
          className="pl-9 pr-3 py-2 w-64 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <select
        value={searchParams.get('action') ?? 'all'}
        onChange={(e) => updateParams('action', e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {ACTIONS.map(a => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>
    </div>
  )
}
