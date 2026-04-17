import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, Users, MapPin, UserCircle, Smile, Download, Zap, Clock } from 'lucide-react'
import { RealtimeKPIs } from '@/components/dashboard/RealtimeKPIs'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const campaignId = profile.campaign_ids?.[0]

  // M-3: use pre-computed campaign_stats (O(1)) instead of 4 COUNT queries
  const [
    { data: stats },
    { data: suggestions },
    { data: recentRuns },
  ] = await Promise.all([
    supabase.from('campaign_stats')
      .select('total_contacts, supporters, total_visits, pending_visits')
      .eq('campaign_id', campaignId ?? '')
      .single(),
    supabase.from('ai_suggestions').select('id, title, priority, module, status, created_at, description')
      .eq('campaign_id', campaignId ?? '')
      .in('status', ['active', 'pending_approval'])
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('agent_runs').select('id, agent_id, status, created_at')
      .eq('campaign_id', campaignId ?? '')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const totalContacts = stats?.total_contacts ?? 0
  const supporters = stats?.supporters ?? 0
  const totalVisits = stats?.total_visits ?? 0
  const pendingVisits = stats?.pending_visits ?? 0

  const supportRate = totalContacts ? Math.round((supporters / totalContacts) * 100) : 0
  const coverageRate = totalContacts ? Math.round((totalVisits / totalContacts) * 100) : 0

  const { data: recentContacts } = await supabase
    .from('contacts')
    .select('created_at')
    .eq('campaign_id', campaignId ?? '')
    .is('deleted_at', null)
    .gte('created_at', new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })
    .limit(500)

  const weeklyMap: Record<string, number> = {}
  recentContacts?.forEach(c => {
    const d = new Date(c.created_at)
    const weekNum = Math.ceil(d.getDate() / 7)
    const month = d.toLocaleString('es-ES', { month: 'short' })
    const key = `S${weekNum} ${month}`
    weeklyMap[key] = (weeklyMap[key] ?? 0) + 1
  })
  const weeklyData = Object.entries(weeklyMap).map(([week, contacts]) => ({ week, contacts }))

  const priorityBadge: Record<string, { label: string; className: string }> = {
    critical: { label: 'Alerta Crítica', className: 'bg-red-100 text-red-600 border-red-200' },
    high:     { label: 'Alerta Alta',    className: 'bg-orange-100 text-orange-600 border-orange-200' },
    medium:   { label: 'Media',          className: 'bg-amber-100 text-amber-600 border-amber-200' },
    low:      { label: 'Baja',           className: 'bg-slate-100 text-slate-500 border-slate-200' },
  }

  const runStatusConfig: Record<string, { dot: string; label: string }> = {
    completed: { dot: 'bg-emerald-500',  label: 'Completado' },
    running:   { dot: 'bg-primary animate-pulse', label: 'Ejecutando' },
    failed:    { dot: 'bg-red-500',      label: 'Error' },
    pending:   { dot: 'bg-amber-500',    label: 'Pendiente' },
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    return `Hace ${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 animate-page-in">
      {/* Hero Title */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Centro de Inteligencia</h3>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
          <Download className="h-4 w-4" />
          Exportar Reporte
        </button>
      </div>

      {/* AI Suggestions Panel */}
      {(suggestions?.length ?? 0) > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-bold">Sugerencias IA — Prioridad Alta</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions!.slice(0, 2).map(s => {
              const badge = priorityBadge[s.priority] ?? priorityBadge.low
              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-xl p-5 shadow-xl shadow-primary/5 transition-all hover:border-primary"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${badge.className}`}>
                          {badge.label}
                        </span>
                        <span className="text-slate-400 text-xs italic">{timeAgo(s.created_at)}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{s.title}</h5>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                        {(s as { description?: string }).description ?? s.module}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">{s.module}</span>
                        {s.status === 'pending_approval' && (
                          <button className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition-all">
                            Aprobar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section>
          <a
            href="/dashboard/ai"
            className="group flex items-center gap-5 bg-white dark:bg-slate-900 border-2 border-dashed border-primary/30 rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">Los agentes IA aún no han generado reportes</h5>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Genera el primer análisis inteligente de tu campaña. Los reportes se actualizan automáticamente cada día.
              </p>
            </div>
            <div className="shrink-0 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold group-hover:shadow-lg group-hover:shadow-primary/30 transition-all flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Activar agentes
            </div>
          </a>
        </section>
      )}

      {/* Real-time KPIs */}
      <section>
        <RealtimeKPIs
          campaignId={campaignId ?? ''}
          initialKPIs={{
            totalContacts: totalContacts ?? 0,
            supporters: supporters ?? 0,
            supportRate,
            totalVisits: totalVisits ?? 0,
            coverageRate,
            pendingVisits: pendingVisits ?? 0,
            weeklyData,
          }}
        />
      </section>

      {/* Bottom: Timeline + Quick Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold">Actividad de Agentes IA</h4>
            <a href="/dashboard/ai" className="text-primary text-sm font-bold hover:underline">Ver todo</a>
          </div>

          {!recentRuns?.length ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-slate-500">Sin actividad reciente de agentes</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent dark:before:from-slate-800 dark:before:via-slate-800">
              {recentRuns.map(run => {
                const cfg = runStatusConfig[run.status] ?? runStatusConfig.pending
                return (
                  <div key={run.id} className="relative flex items-center gap-6">
                    <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-white dark:ring-slate-900 shadow-lg ${
                      run.status === 'completed' ? 'bg-emerald-500' :
                      run.status === 'running' ? 'bg-primary' :
                      run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                    }`}>
                      <Brain className="h-4 w-4" />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold">{run.agent_id}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{timeAgo(run.created_at)} · {cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Insights + Channel Distribution */}
        <div className="space-y-6">
          {/* Quick Insights */}
          <div className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-xl text-white shadow-xl">
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" />
              Quick Insights
            </h4>
            <div className="space-y-3">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                <p className="text-xs font-medium text-white/70">Total contactos</p>
                <p className="text-xl font-bold">{(totalContacts ?? 0).toLocaleString('es-ES')}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                <p className="text-xs font-medium text-white/70">Tasa de simpatizantes</p>
                <p className="text-xl font-bold">{supportRate}%</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                <p className="text-xs font-medium text-white/70">Cobertura canvassing</p>
                <p className="text-xl font-bold">{coverageRate}%</p>
              </div>
            </div>
          </div>

          {/* All Suggestions */}
          {(suggestions?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h4 className="font-bold mb-4">Sugerencias IA</h4>
              <div className="space-y-3">
                {suggestions!.map(s => {
                  const badge = priorityBadge[s.priority] ?? priorityBadge.low
                  return (
                    <div key={s.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border whitespace-nowrap mt-0.5 ${badge.className}`}>
                        {s.priority}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{s.title}</p>
                        <p className="text-xs text-slate-500">{s.module}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
