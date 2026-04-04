'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

export function TenantFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/dashboard/tenants?${params.toString()}`)
  }, [router, searchParams])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams('q', search)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar organización..."
          className="pl-9 pr-3 py-2 w-64 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <select
        value={searchParams.get('plan') ?? 'all'}
        onChange={(e) => updateParams('plan', e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">Todos los planes</option>
        <option value="esencial">Esencial</option>
        <option value="pro">Pro</option>
        <option value="campaign">Campaign</option>
        <option value="enterprise">Enterprise</option>
      </select>

      <select
        value={searchParams.get('status') ?? 'all'}
        onChange={(e) => updateParams('status', e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">Todos los estados</option>
        <option value="active">Activo</option>
        <option value="trial">Trial</option>
        <option value="suspended">Suspendido</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>
  )
}
