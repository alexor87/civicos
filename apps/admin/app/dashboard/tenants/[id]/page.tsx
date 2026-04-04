import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, Users, Layers3 } from 'lucide-react'
import { TenantActions } from '@/components/admin/TenantActions'
import { ImpersonateButton } from '@/components/admin/ImpersonateButton'
import { FeatureOverridesEditor } from '@/components/admin/FeatureOverridesEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch tenant + stats in parallel
  const [tenantRes, contactsRes, campaignsRes, membersRes, overridesRes, featuresRes, auditRes] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', id).single(),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('tenant_feature_overrides').select('*').eq('tenant_id', id),
    supabase.rpc('resolve_all_tenant_features', { p_tenant_id: id, p_plan: '' }), // plan overridden below
    supabase.from('admin_audit_log').select('*').eq('tenant_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  const tenant = tenantRes.data
  if (!tenant) notFound()

  // Re-resolve with correct plan
  const { data: resolvedFeatures } = await supabase.rpc('resolve_all_tenant_features', {
    p_tenant_id: id,
    p_plan: tenant.plan,
  })

  const contactCount = contactsRes.count ?? 0
  const campaignCount = campaignsRes.count ?? 0
  const memberCount = membersRes.count ?? 0
  const overrides = overridesRes.data ?? []
  const auditLog = auditRes.data ?? []

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

  const actionBadgeColors: Record<string, string> = {
    tenant_created: 'bg-emerald-100 text-emerald-700',
    tenant_updated: 'bg-blue-100 text-blue-700',
    plan_changed: 'bg-blue-100 text-blue-700',
    tenant_suspended: 'bg-red-100 text-red-700',
    tenant_reactivated: 'bg-emerald-100 text-emerald-700',
    feature_override_set: 'bg-amber-100 text-amber-700',
    feature_override_removed: 'bg-amber-100 text-amber-700',
    impersonate_start: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tenants" className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <ImpersonateButton tenantId={tenant.id} tenantName={tenant.name} tenantStatus={tenant.status} />
          <TenantActions tenantId={tenant.id} tenantName={tenant.name} currentPlan={tenant.plan} currentStatus={tenant.status} />
        </div>
      </div>

      {/* Info + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información general</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Plan</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${planBadgeColors[tenant.plan] ?? 'bg-slate-100'}`}>{tenant.plan}</span>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColors[tenant.status] ?? 'bg-slate-100'}`}>{tenant.status}</span>
            </div>
            <div>
              <p className="text-muted-foreground">País</p>
              <p className="text-foreground font-medium mt-1">{tenant.country?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Creado</p>
              <p className="text-foreground font-medium mt-1">{new Date(tenant.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Plan vence</p>
              <p className="text-foreground font-medium mt-1">{tenant.plan_expires_at ? new Date(tenant.plan_expires_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Notas internas</p>
              <p className="text-foreground mt-1">{tenant.internal_notes || '—'}</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{contactCount.toLocaleString('es-CO')}</p>
              <p className="text-xs text-muted-foreground">Contactos</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Layers3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{campaignCount}</p>
              <p className="text-xs text-muted-foreground">Campañas</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{memberCount}</p>
              <p className="text-xs text-muted-foreground">Miembros del equipo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overrides */}
      <FeatureOverridesEditor
        tenantId={tenant.id}
        tenantPlan={tenant.plan}
        resolvedFeatures={resolvedFeatures ?? []}
        overrides={overrides}
      />

      {/* Audit History */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Historial de actividad</h2>
        </div>
        <div className="divide-y divide-border">
          {auditLog.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">Sin actividad registrada</p>
          ) : (
            auditLog.map((entry: any) => (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionBadgeColors[entry.action] ?? 'bg-slate-100 text-slate-600'}`}>
                  {entry.action}
                </span>
                <span className="text-sm text-foreground flex-1">{entry.admin_email}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
