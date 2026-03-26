'use client'

import { MapPin, Users, Clock, TrendingUp } from 'lucide-react'

interface ResultItem {
  name: string
  value: number
}

interface Props {
  totalZones: number
  totalVisits: number
  pendingApproval: number
  positives: number
  resultDistribution: ResultItem[]
}

export function CanvassingStats({
  totalZones, totalVisits, pendingApproval, positives, resultDistribution,
}: Props) {
  const approvalRate = totalVisits > 0
    ? Math.floor(((totalVisits - pendingApproval) / totalVisits) * 100)
    : 0

  const stats = [
    {
      label: 'Territorios activos',
      value: totalZones,
      Icon: MapPin,
      iconBg: 'bg-[#2960ec]/10',
      iconColor: 'text-[#2960ec]',
      valueColor: 'text-[#1b1f23]',
    },
    {
      label: 'Visitas totales',
      value: totalVisits,
      Icon: Users,
      iconBg: 'bg-muted',
      iconColor: 'text-[#6a737d]',
      valueColor: 'text-[#1b1f23]',
    },
    {
      label: 'Pendientes aprobación',
      value: pendingApproval,
      Icon: Clock,
      iconBg: pendingApproval > 0 ? 'bg-orange-50' : 'bg-muted',
      iconColor: pendingApproval > 0 ? 'text-orange-500' : 'text-[#6a737d]',
      valueColor: pendingApproval > 0 ? 'text-orange-600' : 'text-[#1b1f23]',
    },
    {
      label: 'Contactos positivos',
      value: positives,
      Icon: TrendingUp,
      iconBg: 'bg-[#28a745]/10',
      iconColor: 'text-[#28a745]',
      valueColor: 'text-[#28a745]',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Inline stat strip — no cards, just a divided row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#dcdee6] rounded-md overflow-hidden divide-x divide-[#dcdee6]">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 px-5 py-4">
            <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}>
              <stat.Icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold tabular-nums leading-none ${stat.valueColor}`}>{stat.value}</p>
              <p className="text-xs text-[#6a737d] mt-1 leading-tight">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Approval progress bar — only rendered when there are visits */}
      <div className="bg-white border border-[#dcdee6] rounded-md px-5 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#1b1f23]">Tasa de aprobación</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6a737d]">{approvalRate}% aprobadas</span>
            <span className="text-xs text-[#6a737d] tabular-nums">
              {totalVisits - pendingApproval}/{totalVisits}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            data-testid="progress-bar"
            data-value={approvalRate}
            className="h-full bg-[#2960ec] rounded-full transition-all duration-500"
            style={{ width: `${approvalRate}%` }}
          />
        </div>
      </div>

      {/* Result distribution — only when there's data */}
      {resultDistribution.length > 0 && (
        <div data-testid="bar-list" className="bg-white border border-[#dcdee6] rounded-md px-5 py-4">
          <p className="text-xs font-semibold text-[#1b1f23] mb-3">Distribución de resultados</p>
          <div className="space-y-2.5">
            {resultDistribution.map((item) => {
              const max = Math.max(...resultDistribution.map(r => r.value))
              const pct = max > 0 ? (item.value / max) * 100 : 0
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-[#6a737d] w-24 shrink-0 truncate">{item.name}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2960ec] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#1b1f23] w-5 text-right tabular-nums">{item.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
