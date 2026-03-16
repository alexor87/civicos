'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react'
import { FlowExecution } from './flowTypes'

type Filter = 'all' | 'today' | 'week' | 'month'

interface Props {
  executions: FlowExecution[]
}

function statusIcon(status: FlowExecution['status']) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'partial':   return <AlertCircle   className="h-4 w-4 text-amber-500" />
    case 'failed':    return <XCircle       className="h-4 w-4 text-red-500" />
    case 'running':   return <Clock         className="h-4 w-4 text-blue-500" />
    case 'skipped':   return <Clock         className="h-4 w-4 text-slate-400" />
  }
}

function statusLabel(status: FlowExecution['status']) {
  return {
    completed: 'Exitoso',
    partial:   'Parcial',
    failed:    'Error',
    running:   'Ejecutando',
    skipped:   'Omitido',
  }[status] ?? status
}

function filterExecs(executions: FlowExecution[], filter: Filter): FlowExecution[] {
  const now  = new Date()
  switch (filter) {
    case 'today': {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return executions.filter(e => new Date(e.started_at) >= today)
    }
    case 'week': {
      const week = new Date(now.getTime() - 7 * 86400000)
      return executions.filter(e => new Date(e.started_at) >= week)
    }
    case 'month': {
      const month = new Date(now.getFullYear(), now.getMonth(), 1)
      return executions.filter(e => new Date(e.started_at) >= month)
    }
    default: return executions
  }
}

export function FlowExecutionHistory({ executions }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filterExecs(executions, filter)

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week',  label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'all',   label: 'Todas' },
  ]

  return (
    <div data-testid="execution-history">
      {/* Filtros */}
      <div className="flex gap-1 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-10 w-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No hay ejecuciones en este período.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exec => (
            <div
              key={exec.id}
              className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg"
            >
              <div className="mt-0.5 flex-shrink-0">{statusIcon(exec.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {exec.contact_name ?? 'Contacto desconocido'}
                  </p>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(exec.started_at).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{exec.triggered_by}</p>
                {exec.status === 'failed' && exec.error_message && (
                  <p className="text-xs text-red-600 mt-1 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
                    {exec.error_message}
                  </p>
                )}
              </div>
              <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                exec.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                exec.status === 'failed'    ? 'bg-red-100 text-red-700' :
                exec.status === 'partial'   ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {statusLabel(exec.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
