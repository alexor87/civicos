'use client'

import { BarChart } from '@tremor/react'
import { Send, MailOpen, MousePointerClick, TriangleAlert } from 'lucide-react'

interface Props {
  recipientCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
}

function pct(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatES(n: number): string {
  return n.toLocaleString('es-ES')
}

const KPIS = [
  { key: 'delivered', label: 'Entregados', Icon: Send,               color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'opened',    label: 'Abiertos',   Icon: MailOpen,           color: 'text-blue-600',    bg: 'bg-blue-50' },
  { key: 'clicked',   label: 'Clics',      Icon: MousePointerClick,  color: 'text-violet-600',  bg: 'bg-violet-50' },
  { key: 'bounced',   label: 'Rebotes',    Icon: TriangleAlert,      color: 'text-red-500',     bg: 'bg-red-50' },
] as const

export function EmailCampaignAnalytics({
  recipientCount,
  deliveredCount,
  openedCount,
  clickedCount,
  bouncedCount,
}: Props) {
  const values: Record<string, number> = {
    delivered: deliveredCount,
    opened: openedCount,
    clicked: clickedCount,
    bounced: bouncedCount,
  }

  const funnelData = [
    { etapa: 'Enviados',   Cantidad: recipientCount },
    { etapa: 'Entregados', Cantidad: deliveredCount },
    { etapa: 'Abiertos',   Cantidad: openedCount },
    { etapa: 'Clics',      Cantidad: clickedCount },
  ]

  const hasData = deliveredCount > 0 || openedCount > 0 || clickedCount > 0 || bouncedCount > 0

  return (
    <div data-testid="email-campaign-analytics" className="space-y-4">
      <p className="text-xs font-semibold text-[#6a737d] uppercase tracking-wide">Métricas de la campaña</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIS.map(({ key, label, Icon, color, bg }) => (
          <div
            key={key}
            className="bg-white border border-[#dcdee6] rounded-lg px-4 py-3.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-md ${bg} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <span className="text-xs text-[#6a737d]">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums text-[#1b1f23]">
                {formatES(values[key])}
              </span>
              <span className="text-xs text-[#6a737d]">
                {pct(values[key], key === 'bounced' ? recipientCount : deliveredCount || recipientCount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement funnel */}
      {hasData && (
        <div className="bg-white border border-[#dcdee6] rounded-lg p-5">
          <p className="text-sm font-semibold text-[#1b1f23] mb-4">Embudo de engagement</p>
          <BarChart
            data={funnelData}
            index="etapa"
            categories={['Cantidad']}
            colors={['blue']}
            valueFormatter={(v: number) => formatES(v)}
            showLegend={false}
            showGridLines={false}
            className="h-44"
          />
        </div>
      )}

      {!hasData && (
        <div className="bg-white border border-[#dcdee6] rounded-lg px-5 py-8 text-center">
          <p className="text-sm text-[#6a737d]">
            Las métricas se actualizarán a medida que los destinatarios interactúen con el email.
          </p>
        </div>
      )}
    </div>
  )
}
