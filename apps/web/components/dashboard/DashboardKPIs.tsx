'use client'

import { useState } from 'react'
import { AreaChart } from '@tremor/react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TrendingDown, TrendingUp, Users, Heart, MapPin, Clock } from 'lucide-react'

interface WeeklyDataPoint {
  week: string
  contacts: number
}

interface Props {
  totalContacts: number
  supporters: number
  supportRate: number
  totalVisits: number
  coverageRate: number
  pendingVisits: number
  weeklyData: WeeklyDataPoint[]
}

/** Format an integer with period as thousands separator (Spanish style). */
function formatES(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const KPI_CONFIG = [
  {
    key: 'contacts',
    label: 'Contactos Totales',
    Icon: Users,
    iconClass: 'text-slate-400',
    trendClass: 'text-emerald-500',
  },
  {
    key: 'supporters',
    label: 'Simpatizantes',
    Icon: Heart,
    iconClass: 'text-slate-400',
    trendClass: 'text-emerald-500',
  },
  {
    key: 'coverage',
    label: 'Cobertura Canvassing',
    Icon: MapPin,
    iconClass: 'text-slate-400',
    trendClass: 'text-primary',
  },
  {
    key: 'pending',
    label: 'Visitas Pendientes',
    Icon: Clock,
    iconClass: 'text-slate-400',
    trendClass: 'text-amber-500',
  },
]

export function DashboardKPIs({
  totalContacts, supporters, supportRate,
  totalVisits, coverageRate, pendingVisits, weeklyData,
}: Props) {
  const [period, setPeriod] = useState<string[]>(['8w'])
  const activePeriod = period[0] ?? '8w'

  const filteredData = activePeriod === '4w' ? weeklyData.slice(-4) : activePeriod === '2w' ? weeklyData.slice(-2) : weeklyData

  const values = [
    { value: formatES(totalContacts), trend: null as string | null, trendUp: true,           subtitle: 'Contactos registrados' },
    { value: formatES(supporters),    trend: `+${supportRate}%`,    trendUp: true,           subtitle: `${supportRate}% de penetración` },
    { value: `${coverageRate}%`,      trend: `${formatES(totalVisits)} visitas`, trendUp: coverageRate > 0, subtitle: `${formatES(totalVisits)} visitas` },
    { value: formatES(pendingVisits), trend: pendingVisits > 0 ? `${pendingVisits} sin aprobar` : null, trendUp: false, subtitle: pendingVisits > 0 ? 'Requieren aprobación' : 'Todo aprobado' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_CONFIG.map((cfg, i) => {
          const { value, trend, trendUp, subtitle } = values[i]
          return (
            <div
              key={cfg.key}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-4">
                <cfg.Icon className={`h-5 w-5 ${cfg.iconClass}`} aria-hidden="true" />
                {trend ? (
                  <span className={`text-xs font-bold flex items-center gap-1 ${cfg.trendClass}`}>
                    {trendUp
                      ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                    {trend}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-primary">Live</span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-medium">{cfg.label}</p>
              <p data-testid="metric" className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                {value}
              </p>
            </div>
          )
        })}
      </div>

      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[#1b1f23]">Contactos por semana</CardTitle>
            <CardDescription>Evolución del total de contactos registrados</CardDescription>
            <CardAction>
              <ToggleGroup
                value={period}
                onValueChange={(v) => v.length > 0 && setPeriod(v)}
                variant="outline"
                className="hidden sm:flex"
              >
                <ToggleGroupItem value="8w">8 semanas</ToggleGroupItem>
                <ToggleGroupItem value="4w">4 semanas</ToggleGroupItem>
                <ToggleGroupItem value="2w">2 semanas</ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={filteredData}
              index="week"
              categories={['contacts']}
              colors={['blue']}
              valueFormatter={(v: number) => formatES(v)}
              showLegend={false}
              className="h-52"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
