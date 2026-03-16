'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, ChevronRight, Play, Pause } from 'lucide-react'
import {
  AutomationFlow,
  FLOW_STATUS_CONFIG,
  CATEGORY_CONFIG,
  TRIGGER_CONFIG,
} from './flowTypes'

function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca ejecutado'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)} días`
}

interface Props {
  flow:     AutomationFlow
  onToggle: (id: string, newStatus: 'active' | 'paused') => Promise<void>
}

export function FlowCard({ flow, onToggle }: Props) {
  const [toggling, setToggling] = useState(false)

  const statusCfg   = FLOW_STATUS_CONFIG[flow.status] ?? FLOW_STATUS_CONFIG.draft
  const categoryCfg = CATEGORY_CONFIG[(flow.category ?? 'custom') as keyof typeof CATEGORY_CONFIG]
  const triggerCfg  = TRIGGER_CONFIG[flow.trigger_config?.type as keyof typeof TRIGGER_CONFIG]

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return
    setToggling(true)
    const next = flow.status === 'active' ? 'paused' : 'active'
    await onToggle(flow.id, next)
    setToggling(false)
  }

  return (
    <Link
      href={`/dashboard/automatizaciones/${flow.id}`}
      className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
      data-testid="flow-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
            {flow.icon ?? categoryCfg?.icon ?? '⚡'}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{flow.name}</h3>
            <p className="text-[11px] text-slate-500 truncate">{triggerCfg?.label ?? 'Automatización'}</p>
          </div>
        </div>

        {/* Badge de estado */}
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {flow.execution_count ?? 0} ejecuciones
        </span>
        <span>·</span>
        <span>{timeAgo(flow.last_execution_at ?? null)}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Toggle activo/pausado */}
        {(flow.status === 'active' || flow.status === 'paused' || flow.status === 'draft') && (
          <button
            onClick={handleToggle}
            disabled={toggling || flow.status === 'draft'}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 ${
              flow.status === 'active'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : flow.status === 'paused'
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            aria-label={flow.status === 'active' ? 'Pausar flow' : 'Activar flow'}
          >
            {flow.status === 'active'
              ? <><Pause className="h-3 w-3" /> Pausar</>
              : flow.status === 'paused'
              ? <><Play className="h-3 w-3" /> Activar</>
              : <>Borrador</>
            }
          </button>
        )}

        <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-primary transition-colors">
          Ver detalles <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
