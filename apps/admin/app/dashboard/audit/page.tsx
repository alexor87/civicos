import { createAdminClient } from '@/lib/supabase/admin'
import { ScrollText, Search } from 'lucide-react'
import Link from 'next/link'
import { AuditFilters } from '@/components/admin/AuditFilters'

interface Props {
  searchParams: Promise<{ action?: string; tenant?: string; page?: string }>
}

const ACTION_BADGES: Record<string, string> = {
  tenant_created: 'bg-emerald-100 text-emerald-700',
  tenant_updated: 'bg-blue-100 text-blue-700',
  plan_changed: 'bg-blue-100 text-blue-700',
  tenant_suspended: 'bg-red-100 text-red-700',
  tenant_reactivated: 'bg-emerald-100 text-emerald-700',
  tenant_deleted: 'bg-red-100 text-red-700',
  feature_override_set: 'bg-amber-100 text-amber-700',
  feature_override_removed: 'bg-amber-100 text-amber-700',
  plan_features_updated: 'bg-amber-100 text-amber-700',
  admin_login: 'bg-slate-100 text-slate-600',
  admin_login_failed: 'bg-red-100 text-red-700',
  impersonate_start: 'bg-purple-100 text-purple-700',
  impersonate_end: 'bg-purple-100 text-purple-700',
  service_key_updated: 'bg-amber-100 text-amber-700',
}

export default async function AuditPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = createAdminClient()
  const page = parseInt(params.page ?? '1')
  const perPage = 30
  const offset = (page - 1) * perPage

  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' })

  if (params.action && params.action !== 'all') {
    query = query.eq('action', params.action)
  }
  if (params.tenant) {
    query = query.ilike('tenant_name', `%${params.tenant}%`)
  }

  const { data: logs, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Auditoría</h1>
        <p className="text-sm text-muted-foreground mt-1">Log inmutable de todas las acciones de administración</p>
      </div>

      <AuditFilters />

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Fecha</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Admin</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Acción</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Organización</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(!logs || logs.length === 0) ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <ScrollText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin registros de auditoría</p>
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('es-CO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground">{log.admin_email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_BADGES[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground">
                    {log.tenant_id ? (
                      <Link href={`/dashboard/tenants/${log.tenant_id}`} className="hover:text-primary transition-colors">
                        {log.tenant_name ?? log.tenant_id}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{log.ip_address ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">Página {page} de {totalPages} ({count} registros)</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/audit?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/audit?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
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
