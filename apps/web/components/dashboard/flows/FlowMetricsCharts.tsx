'use client'

import { useMemo } from 'react'
import { AreaChart } from '@tremor/react'
import { FlowExecution } from './flowTypes'

interface Props {
  executions: FlowExecution[]
}

function formatDay(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

export function FlowMetricsCharts({ executions }: Props) {
  const chartData = useMemo(() => {
    if (executions.length === 0) return []

    // Build last-30-days buckets
    const buckets: Record<string, { Exitosas: number; 'Con error': number }> = {}
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = formatDay(d.toISOString())
      buckets[key] = { Exitosas: 0, 'Con error': 0 }
    }

    for (const exec of executions) {
      const key = formatDay(exec.started_at)
      if (!buckets[key]) continue
      if (exec.status === 'completed') buckets[key].Exitosas++
      else if (exec.status === 'failed')  buckets[key]['Con error']++
    }

    return Object.entries(buckets).map(([date, vals]) => ({ date, ...vals }))
  }, [executions])

  if (executions.length === 0) {
    return (
      <div data-testid="flow-metrics-charts" className="mt-6">
        <p data-testid="metrics-empty" className="text-center text-sm text-slate-400 py-8">
          Este Flow aún no ha sido ejecutado. Las métricas aparecerán aquí una vez que se active.
        </p>
      </div>
    )
  }

  return (
    <div data-testid="flow-metrics-charts" className="mt-6 space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p data-testid="chart-title" className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Ejecuciones — últimos 30 días
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Exitosas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
              Con error
            </span>
          </div>
        </div>
        <AreaChart
          data-testid="executions-area-chart"
          data={chartData}
          index="date"
          categories={['Exitosas', 'Con error']}
          colors={['emerald', 'red']}
          valueFormatter={(v: number) => String(v)}
          showLegend={false}
          showGridLines={false}
          className="h-44"
        />
      </div>
    </div>
  )
}
