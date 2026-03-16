'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Pause, Trash2, Loader2, CheckCircle2, Zap, BarChart2 } from 'lucide-react'
import { AutomationFlow, FlowExecution, FLOW_STATUS_CONFIG, TriggerConfig, ActionConfig } from './flowTypes'
import { FlowRecipeCard } from './FlowRecipeCard'
import { FlowExecutionHistory } from './FlowExecutionHistory'

interface Props {
  flow:       AutomationFlow & { executions?: FlowExecution[] }
}

export function FlowDetail({ flow: initialFlow }: Props) {
  const router = useRouter()
  const [flow, setFlow]         = useState(initialFlow)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const statusCfg = FLOW_STATUS_CONFIG[flow.status] ?? FLOW_STATUS_CONFIG.draft
  const executions = (flow as AutomationFlow & { executions?: FlowExecution[] }).executions ?? []

  // Métricas básicas
  const total     = executions.length
  const completed = executions.filter(e => e.status === 'completed').length
  const failed    = executions.filter(e => e.status === 'failed').length
  const successPct = total > 0 ? Math.round((completed / total) * 100) : 0

  async function handleToggle() {
    setToggling(true)
    const next = flow.status === 'active' ? 'paused' : 'active'
    const res  = await fetch(`/api/flows/${flow.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: next }),
    })
    if (res.ok) {
      const updated = await res.json()
      setFlow(f => ({ ...f, status: updated.status }))
    }
    setToggling(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/flows/${flow.id}`, { method: 'DELETE' })
    router.push('/dashboard/automatizaciones')
  }

  return (
    <div data-testid="flow-detail">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            {flow.icon ?? '⚡'}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{flow.name}</h2>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle activo/pausado */}
          {(flow.status === 'active' || flow.status === 'paused' || flow.status === 'draft') && (
            <button
              onClick={handleToggle}
              disabled={toggling || flow.status === 'draft'}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                flow.status === 'active'
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  : flow.status === 'paused'
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              aria-label={flow.status === 'active' ? 'Pausar flow' : 'Activar flow'}
            >
              {toggling
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : flow.status === 'active'
                ? <><Pause className="h-3.5 w-3.5" /> Pausar</>
                : <><Play className="h-3.5 w-3.5" /> Activar</>
              }
            </button>
          )}

          {/* Eliminar */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Eliminar flow"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">¿Eliminar?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="flow">
        <TabsList className="mb-5">
          <TabsTrigger value="flow">El Flow</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        {/* Tab: El Flow */}
        <TabsContent value="flow">
          <FlowRecipeCard
            name={flow.name}
            trigger_config={flow.trigger_config as TriggerConfig}
            filter_config={flow.filter_config}
            actions_config={flow.actions_config as ActionConfig[]}
            editable={false}
          />
        </TabsContent>

        {/* Tab: Actividad */}
        <TabsContent value="activity">
          <FlowExecutionHistory executions={executions} />
        </TabsContent>

        {/* Tab: Métricas */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-3 gap-4" data-testid="metrics-panel">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{total}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total ejecuciones</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{successPct}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Tasa de éxito</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart2 className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-red-500 tabular-nums">{failed}</p>
              <p className="text-xs text-slate-500 mt-0.5">Con error</p>
            </div>
          </div>

          {executions.length === 0 && (
            <p className="text-center text-sm text-slate-400 mt-8">
              Este Flow aún no ha sido ejecutado.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
