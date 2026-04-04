import { createAdminClient } from '@/lib/supabase/admin'
import {
  Building2,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import Link from 'next/link'

// Plan prices for MRR calculation (COP/month)
const PLAN_PRICES: Record<string, number> = {
  esencial: 290000,
  pro: 690000,
  campaign: 1490000,
  enterprise: 3900000,
}

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  // Fetch KPIs in parallel
  const [tenantsRes, contactsRes, expiringRes, recentRes, aiConfigRes, integrationsRes] = await Promise.all([
    supabase.from('tenants').select('plan, status'),
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('tenants').select('id, name, plan, plan_expires_at')
      .eq('status', 'active')
      .not('plan_expires_at', 'is', null)
      .lt('plan_expires_at', new Date(Date.now() + 14 * 86400000).toISOString())
      .order('plan_expires_at'),
    supabase.from('tenants').select('id, name, plan, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('tenant_ai_config').select('id', { count: 'exact', head: true }),
    supabase.from('tenant_integrations').select('id, resend_api_key, twilio_sid'),
  ])

  const tenants = tenantsRes.data ?? []
  const activeCount = tenants.filter(t => t.status === 'active').length
  const totalContacts = contactsRes.count ?? 0
  const expiring = expiringRes.data ?? []
  const recentTenants = recentRes.data ?? []

  // MRR calculation
  const mrr = tenants
    .filter(t => t.status === 'active')
    .reduce((sum, t) => sum + (PLAN_PRICES[t.plan] ?? 0), 0)

  // BYO service stats
  const aiConfigured = aiConfigRes.count ?? 0
  const integrations = integrationsRes.data ?? []
  const resendConfigured = integrations.filter(i => i.resend_api_key).length
  const twilioConfigured = integrations.filter(i => i.twilio_sid).length

  const kpis = [
    { label: 'Organizaciones activas', value: activeCount, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Contactos totales', value: totalContacts.toLocaleString('es-CO'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'MRR estimado', value: `$${(mrr / 1000).toLocaleString('es-CO')}K`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Planes por vencer', value: expiring.length, icon: Clock, color: expiring.length > 0 ? 'text-amber-600' : 'text-slate-400', bg: expiring.length > 0 ? 'bg-amber-50' : 'bg-slate-50' },
  ]

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de la plataforma en tiempo real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Organizaciones recientes</h2>
            <Link href="/dashboard/tenants" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-border">
            {recentTenants.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No hay organizaciones</p>
            ) : (
              recentTenants.map((t) => (
                <Link key={t.id} href={`/dashboard/tenants/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planBadgeColors[t.plan] ?? 'bg-slate-100 text-slate-600'}`}>
                    {t.plan}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColors[t.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {t.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Servicios de terceros</h2>
          </div>
          <div className="divide-y divide-border">
            <ServiceRow label="IA (BYO Key)" configured={aiConfigured} total={activeCount} />
            <ServiceRow label="Resend (Email)" configured={resendConfigured} total={activeCount} />
            <ServiceRow label="Twilio (SMS/WhatsApp)" configured={twilioConfigured} total={activeCount} />
          </div>
        </div>
      </div>

      {/* Expiring Plans */}
      {expiring.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-200">
          <div className="px-5 py-4 border-b border-amber-200 bg-amber-50/50 rounded-t-xl">
            <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Planes que vencen en los próximos 14 días
            </h2>
          </div>
          <div className="divide-y divide-border">
            {expiring.map((t) => (
              <Link key={t.id} href={`/dashboard/tenants/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Plan {t.plan}</p>
                </div>
                <span className="text-xs font-medium text-amber-700">
                  Vence {new Date(t.plan_expires_at!).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceRow({ label, configured, total }: { label: string; configured: number; total: number }) {
  const pct = total > 0 ? Math.round((configured / total) * 100) : 0
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground w-24 text-right">
          {configured} de {total} ({pct}%)
        </span>
      </div>
    </div>
  )
}
