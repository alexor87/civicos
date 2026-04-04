import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Search, Building2 } from 'lucide-react'
import { TenantFilters } from '@/components/admin/TenantFilters'
import { CreateTenantDialog } from '@/components/admin/CreateTenantDialog'

interface Props {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; page?: string }>
}

export default async function TenantsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = createAdminClient()
  const page = parseInt(params.page ?? '1')
  const perPage = 20
  const offset = (page - 1) * perPage

  let query = supabase
    .from('tenants')
    .select('id, name, slug, plan, status, country, plan_expires_at, created_at', { count: 'exact' })

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,slug.ilike.%${params.q}%`)
  }
  if (params.plan && params.plan !== 'all') {
    query = query.eq('plan', params.plan)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data: tenants, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const totalPages = Math.ceil((count ?? 0) / perPage)

  const planBadgeColors: Record<string, string> = {
    esencial: 'bg-slate-100 text-slate-700',
    pro: 'bg-blue-100 text-blue-700',
    campaign: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }

  const statusBadgeColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-blue-100 text-blue-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{count ?? 0} organizaciones en total</p>
        </div>
        <CreateTenantDialog />
      </div>

      <TenantFilters />

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Organización</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Plan</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Estado</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">País</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Vence</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(!tenants || tenants.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron organizaciones</p>
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/tenants/${t.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {t.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planBadgeColors[t.plan] ?? 'bg-slate-100'}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColors[t.status] ?? 'bg-slate-100'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-foreground">{t.country?.toUpperCase()}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-muted-foreground">
                      {t.plan_expires_at
                        ? new Date(t.plan_expires_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/tenants?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/tenants?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
