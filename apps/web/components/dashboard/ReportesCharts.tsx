'use client'

import { TrendingUp, Users, UserCheck, Send, MapPin, Trophy, Globe } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReportesChartsProps {
  coverageRate:          number
  supportRate:           number
  activeVolunteers:      number
  communicationsReach:   number
  totalContacts:         number
  totalVisits:           number
  visitsByDay:           { date: string; visitas: number }[]
  visitResults:          { name: string; value: number }[]
  contactIntentions:     { name: string; value: number }[]
  territoryCoverage:     { name: string; visitas: number }[]
  volunteerRanking:      { id: string; name: string; visitas: number }[]
  geoZoneStats?:         { name: string; contactos: number; visitas: number }[]
}

// ── Color palette ──────────────────────────────────────────────────────────────

const PALETTE = ['#2960ec', '#10b981', '#f59e0b', '#ef4444', '#94a3b8', '#f97316', '#8b5cf6', '#06b6d4']

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, Icon, iconBg, iconColor, valueColor,
}: {
  label: string; value: string; sub?: string
  Icon: React.ElementType; iconBg: string; iconColor: string; valueColor: string
}) {
  return (
    <div className="bg-white border border-[#dcdee6] rounded-md flex items-center gap-4 px-5 py-4">
      <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums leading-none ${valueColor}`}>{value}</p>
        <p className="text-xs text-[#6a737d] mt-1">{label}</p>
        {sub && <p className="text-[11px] text-[#6a737d]/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ Icon, title, sub }: { Icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-4 border-b border-[#dcdee6]">
      <Icon className="h-4 w-4 text-[#2960ec]" />
      <div>
        <h2 className="text-sm font-semibold text-[#1b1f23]">{title}</h2>
        {sub && <p className="text-xs text-[#6a737d]">{sub}</p>}
      </div>
    </div>
  )
}

// ── Custom bar chart (vertical, single series) ─────────────────────────────────

function VerticalBarChart({ data }: { data: { date: string; visitas: number }[] }) {
  const max = Math.max(...data.map(d => d.visitas), 1)
  const step = Math.max(1, Math.ceil(data.length / 8))

  return (
    <div data-testid="bar-chart" className="flex flex-col h-56 select-none">
      <div className="flex-1 flex items-end gap-[2px] pb-1">
        {data.map((d, i) => {
          const heightPct = Math.max((d.visitas / max) * 100, d.visitas > 0 ? 1.5 : 0)
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full bg-[#2960ec] rounded-t-[2px] hover:bg-[#1a4fd6] transition-colors"
                style={{ height: `${heightPct}%` }}
              />
              {/* Tooltip */}
              {d.visitas > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-[#1b1f23] text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                    {d.date}: {d.visitas}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-[2px]">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center overflow-hidden">
            {i % step === 0 && (
              <span className="text-[9px] text-[#6a737d]">{d.date}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Custom donut chart (SVG, multi-segment) ────────────────────────────────────

function DonutChart({
  data,
  colors,
  centerLabel,
}: {
  data: { name: string; value: number }[]
  colors: string[]
  centerLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = 80; const cy = 80; const r = 54
  const circ = 2 * Math.PI * r
  const GAP = total > 1 ? 2 : 0  // gap in degrees between segments

  if (total === 0) {
    return (
      <div data-testid="donut-chart" className="flex items-center justify-center h-48 text-sm text-[#6a737d]">
        Sin datos aún
      </div>
    )
  }

  let startAngle = -90
  const segments = data.map((d, i) => {
    const angleDeg = (d.value / total) * 360 - GAP
    const seg = { ...d, color: colors[i % colors.length], startAngle, angleDeg }
    startAngle += angleDeg + GAP
    return seg
  })

  return (
    <div data-testid="donut-chart" className="flex flex-col items-center gap-4 w-full">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f3f5" strokeWidth="22" />
        {segments.map((s, i) => {
          const dashLen = (s.angleDeg / 360) * circ
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${Math.max(dashLen, 0)} ${circ}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
              transform={`rotate(${s.startAngle} ${cx} ${cy})`}
            />
          )
        })}
        {/* Center text */}
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1b1f23">{total}</text>
        {centerLabel && (
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#6a737d">{centerLabel}</text>
        )}
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-[280px]">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
              <span className="text-xs text-[#586069] truncate flex-1">{d.name}</span>
              <span className="text-xs font-semibold text-[#1b1f23] tabular-nums">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Dual horizontal bar chart (for geo zones) ──────────────────────────────────

function GeoZoneChart({ data }: { data: { name: string; contactos: number; visitas: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.contactos, d.visitas]), 1)

  return (
    <div data-testid="bar-chart" className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1b1f23] truncate max-w-[160px]">{d.name}</span>
            <span className="text-xs text-[#6a737d] tabular-nums shrink-0 ml-2">
              {d.contactos.toLocaleString('es-ES')} / {d.visitas.toLocaleString('es-ES')}
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2960ec] rounded-full transition-all"
                style={{ width: `${(d.contactos / maxVal) * 100}%` }}
              />
            </div>
            <div className="h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10b981] rounded-full transition-all"
                style={{ width: `${(d.visitas / maxVal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#2960ec]" />
          <span className="text-xs text-[#6a737d]">Contactos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          <span className="text-xs text-[#6a737d]">Visitas</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReportesCharts({
  coverageRate, supportRate, activeVolunteers, communicationsReach,
  totalContacts, totalVisits,
  visitsByDay, visitResults, contactIntentions, territoryCoverage, volunteerRanking, geoZoneStats,
}: ReportesChartsProps) {

  const visitColors     = [PALETTE[1], PALETTE[3], PALETTE[2], PALETTE[4], PALETTE[5]]
  const intentionColors = [PALETTE[0], PALETTE[3], PALETTE[2], PALETTE[4]]

  return (
    <div className="space-y-6">

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Cobertura de campo"
          value={`${coverageRate}%`}
          sub={`${totalVisits.toLocaleString('es-ES')} / ${totalContacts.toLocaleString('es-ES')} contactos`}
          Icon={TrendingUp}
          iconBg="bg-[#2960ec]/10" iconColor="text-[#2960ec]" valueColor="text-[#2960ec]"
        />
        <KpiCard
          label="Tasa de simpatizantes"
          value={`${supportRate}%`}
          Icon={UserCheck}
          iconBg="bg-[#28a745]/10" iconColor="text-[#28a745]" valueColor="text-[#28a745]"
        />
        <KpiCard
          label="Voluntarios activos (7d)"
          value={String(activeVolunteers)}
          Icon={Users}
          iconBg="bg-[#6f42c1]/10" iconColor="text-[#6f42c1]" valueColor="text-[#1b1f23]"
        />
        <KpiCard
          label="Alcance comunicaciones"
          value={communicationsReach.toLocaleString('es-ES')}
          sub="destinatarios totales"
          Icon={Send}
          iconBg="bg-orange-500/10" iconColor="text-orange-500" valueColor="text-[#1b1f23]"
        />
      </div>

      {/* ── Actividad canvassing ───────────────────────────────────────────── */}
      <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
        <SectionHeader Icon={TrendingUp} title="Actividad de campo" sub="Visitas por día (últimos 30 días)" />
        <div className="p-5">
          {visitsByDay.length > 0 ? (
            <VerticalBarChart data={visitsByDay} />
          ) : (
            <div data-testid="bar-chart" className="flex items-center justify-center h-56 text-sm text-[#6a737d]">
              Sin visitas registradas aún
            </div>
          )}
        </div>
      </div>

      {/* ── Donut charts row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
          <SectionHeader Icon={TrendingUp} title="Resultados de visita" />
          <div className="p-5 flex flex-col items-center">
            {visitResults.length > 0 ? (
              <DonutChart
                data={visitResults}
                colors={visitColors}
                centerLabel="visitas"
              />
            ) : (
              <div data-testid="donut-chart" className="flex items-center justify-center h-48 text-sm text-[#6a737d]">
                Sin visitas registradas aún
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
          <SectionHeader Icon={UserCheck} title="Intención de voto" />
          <div className="p-5 flex flex-col items-center">
            {contactIntentions.length > 0 ? (
              <DonutChart
                data={contactIntentions}
                colors={intentionColors}
                centerLabel="contactos"
              />
            ) : (
              <div data-testid="donut-chart" className="flex items-center justify-center h-48 text-sm text-[#6a737d]">
                Sin contactos clasificados aún
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Distribución por zona geográfica ─────────────────────────────── */}
      {geoZoneStats && geoZoneStats.length > 0 && (
        <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
          <SectionHeader Icon={Globe} title="Distribución por zona" sub="Contactos y visitas por departamento" />
          <div className="p-5">
            <GeoZoneChart data={geoZoneStats} />
          </div>
        </div>
      )}

      {/* ── Territorios + voluntarios row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
          <SectionHeader Icon={MapPin} title="Visitas por territorio" sub="Top 10" />
          <div className="divide-y divide-[#dcdee6]">
            {territoryCoverage.length === 0 ? (
              <p className="text-sm text-[#6a737d] px-5 py-8 text-center">
                Sin datos de territorios aún
              </p>
            ) : (
              territoryCoverage.map((t, i) => (
                <div key={t.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-semibold text-[#6a737d] w-5 tabular-nums">{i + 1}</span>
                  <span className="flex-1 text-sm text-[#1b1f23] truncate">{t.name}</span>
                  <span className="text-sm font-semibold text-[#2960ec] tabular-nums">{t.visitas}</span>
                  <span className="text-xs text-[#6a737d]">visitas</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
          <SectionHeader Icon={Trophy} title="Ranking de voluntarios" sub="Por visitas registradas" />
          <div className="divide-y divide-[#dcdee6]">
            {volunteerRanking.length === 0 ? (
              <p className="text-sm text-[#6a737d] px-5 py-8 text-center">
                Sin actividad de voluntarios aún
              </p>
            ) : (
              volunteerRanking.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`text-xs font-bold w-5 tabular-nums ${
                    i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-[#6a737d]'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1b1f23] truncate">{v.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#2960ec] tabular-nums">{v.visitas}</span>
                  <span className="text-xs text-[#6a737d]">visitas</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
