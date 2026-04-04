import { createAdminClient } from '@/lib/supabase/admin'
import { Globe, Key, Plug, Bot, Mail, MessageSquare } from 'lucide-react'

export default async function ServicesPage() {
  const supabase = createAdminClient()

  const [globalKeysRes, tenantsRes, aiRes, integrationsRes] = await Promise.all([
    supabase.from('global_service_keys').select('*'),
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('tenant_ai_config').select('id, provider', { count: 'exact' }),
    supabase.from('tenant_integrations').select('id, resend_api_key, twilio_sid, twilio_whatsapp_from'),
  ])

  const globalKeys = globalKeysRes.data ?? []
  const totalActive = tenantsRes.count ?? 0
  const aiConfigs = aiRes.data ?? []
  const integrations = integrationsRes.data ?? []

  const googleMaps = globalKeys.find(k => k.service === 'google_maps_geocoding')
  const usagePct = googleMaps?.monthly_limit
    ? Math.round((googleMaps.usage_this_month / googleMaps.monthly_limit) * 100)
    : 0

  // BYO stats
  const aiConfigured = aiConfigs.length
  const providerCounts: Record<string, number> = {}
  for (const c of aiConfigs) {
    providerCounts[c.provider] = (providerCounts[c.provider] ?? 0) + 1
  }
  const resendConfigured = integrations.filter(i => i.resend_api_key).length
  const twilioConfigured = integrations.filter(i => i.twilio_sid).length
  const whatsappConfigured = integrations.filter(i => i.twilio_whatsapp_from).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Servicios de Terceros</h1>
        <p className="text-sm text-muted-foreground mt-1">Keys globales de Scrutix y servicios BYO de los tenants</p>
      </div>

      {/* Global Services */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Servicios con key global de Scrutix</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Google Maps Geocoding</p>
              <p className="text-xs text-muted-foreground">
                API Key: {googleMaps?.api_key_hint ?? 'No configurada'}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              googleMaps?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {googleMaps?.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Uso este mes</span>
              <span>{googleMaps?.usage_this_month?.toLocaleString('es-CO') ?? 0} / {googleMaps?.monthly_limit?.toLocaleString('es-CO') ?? '∞'} ({usagePct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(usagePct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BYO Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-foreground">IA — Modelo por tenant</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tenants configurados</span>
              <span className="text-sm font-semibold text-foreground">{aiConfigured} de {totalActive}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${totalActive > 0 ? (aiConfigured / totalActive) * 100 : 0}%` }} />
            </div>
            {Object.entries(providerCounts).length > 0 && (
              <div className="space-y-1 pt-2">
                <p className="text-xs text-muted-foreground font-medium">Distribución de proveedores:</p>
                {Object.entries(providerCounts).sort((a, b) => b[1] - a[1]).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between text-xs">
                    <span className="text-foreground capitalize">{provider}</span>
                    <span className="text-muted-foreground">{count} tenants ({totalActive > 0 ? Math.round((count / totalActive) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resend */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-foreground">Resend (Email)</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tenants configurados</span>
              <span className="text-sm font-semibold text-foreground">{resendConfigured} de {totalActive}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalActive > 0 ? (resendConfigured / totalActive) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Tipo: BYO Key por tenant. Disponible en todos los planes.</p>
          </div>
        </div>

        {/* Twilio SMS */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-foreground">Twilio (SMS)</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tenants configurados</span>
              <span className="text-sm font-semibold text-foreground">{twilioConfigured} de {totalActive}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalActive > 0 ? (twilioConfigured / totalActive) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-foreground">WhatsApp (Twilio)</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tenants configurados</span>
              <span className="text-sm font-semibold text-foreground">{whatsappConfigured} de {totalActive}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalActive > 0 ? (whatsappConfigured / totalActive) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
