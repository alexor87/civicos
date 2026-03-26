'use client'

import { useState } from 'react'
import { Brain, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateCampaignBrief, type CampaignBrief, type BriefHealth } from '@/app/dashboard/ai/campaign-brief-action'

// ── Health config ──────────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<BriefHealth, { label: string; bg: string; text: string; border: string; Icon: React.ElementType }> = {
  green:  { label: 'Campaña en buen estado',   bg: 'bg-[#28a745]/8',   text: 'text-[#28a745]', border: 'border-[#28a745]/20', Icon: CheckCircle2 },
  yellow: { label: 'Requiere atención',         bg: 'bg-amber-500/8',   text: 'text-amber-600', border: 'border-amber-400/20', Icon: AlertTriangle },
  red:    { label: 'Situación crítica',         bg: 'bg-red-500/8',     text: 'text-red-600',   border: 'border-red-400/20',   Icon: XCircle },
}

const PRIORITY_CONFIG = {
  critical: { label: 'Crítica',  bg: 'bg-red-100',    text: 'text-red-700'   },
  high:     { label: 'Alta',     bg: 'bg-amber-100',  text: 'text-amber-700' },
  medium:   { label: 'Media',    bg: 'bg-blue-100',   text: 'text-[#2960ec]' },
}

// ── Component ──────────────────────────────────────────────────────────────────

type PanelState = 'idle' | 'loading' | 'done' | 'error'

export function CampaignBriefPanel() {
  const [state,  setState]  = useState<PanelState>('idle')
  const [brief,  setBrief]  = useState<CampaignBrief | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const handleGenerate = async () => {
    setState('loading')
    setBrief(null)
    const result = await generateCampaignBrief()
    if (result.error) {
      setErrMsg(result.error)
      setState('error')
      toast.error(result.error)
    } else if (result.brief) {
      setBrief(result.brief)
      setState('done')
    }
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="bg-white border border-[#dcdee6] rounded-md p-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#6f42c1]/10 flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-[#6f42c1]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1b1f23]">Informe Ejecutivo IA</p>
            <p className="text-xs text-[#6a737d] mt-0.5">
              Analiza todos los KPIs y genera un resumen ejecutivo con acciones prioritarias
            </p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          size="sm"
          className="shrink-0 gap-1.5 bg-[#6f42c1] hover:bg-[#5a32a3]"
        >
          <Brain className="h-3.5 w-3.5" />
          Generar Informe
        </Button>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="bg-white border border-[#dcdee6] rounded-md p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-[#6f42c1] shrink-0" />
        <p className="text-sm text-[#6a737d]">Analizando todos los indicadores de campaña…</p>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="bg-white border border-[#dcdee6] rounded-md p-5 flex items-center justify-between gap-4">
        <p className="text-sm text-red-600">{errMsg}</p>
        <Button variant="outline" size="sm" onClick={handleGenerate} className="shrink-0 gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (!brief) return null
  const health = HEALTH_CONFIG[brief.health]

  return (
    <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
      {/* Header — health badge + headline */}
      <div className={`px-5 py-4 border-b ${health.bg} ${health.border} border`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <health.Icon className={`h-4 w-4 ${health.text} shrink-0`} />
            <div>
              <span className={`text-xs font-semibold ${health.text} uppercase tracking-wide`}>
                {health.label}
              </span>
              <p className="text-sm font-medium text-[#1b1f23] mt-0.5 leading-snug">{brief.headline}</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="text-[#6a737d] hover:text-[#1b1f23] transition-colors shrink-0 mt-0.5"
            title="Regenerar informe"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* KPI Changes */}
        {brief.kpi_changes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-widest mb-3">
              Indicadores clave
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {brief.kpi_changes.map((kpi, i) => {
                const isUp   = kpi.direction === 'up'
                const isDown = kpi.direction === 'down'
                const good   = (kpi.is_positive && isUp) || (!kpi.is_positive && isDown)
                const bad    = (kpi.is_positive && isDown) || (!kpi.is_positive && isUp)
                return (
                  <div key={i} className="bg-muted rounded-md px-3 py-2.5">
                    <p className="text-[10px] text-[#6a737d] font-medium uppercase tracking-wide truncate">
                      {kpi.label}
                    </p>
                    <p className="text-xl font-bold text-[#1b1f23] tabular-nums mt-0.5">
                      {kpi.current.toLocaleString('es-ES')}
                    </p>
                    {kpi.delta !== 0 && (
                      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                        good ? 'text-[#28a745]' : bad ? 'text-red-500' : 'text-[#6a737d]'
                      }`}>
                        {isUp   ? <TrendingUp   className="h-3 w-3" /> :
                         isDown ? <TrendingDown className="h-3 w-3" /> :
                                  <Minus        className="h-3 w-3" />}
                        {kpi.delta > 0 ? '+' : ''}{kpi.delta.toLocaleString('es-ES')} vs semana ant.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {brief.anomalies.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-widest mb-2">
              Alertas detectadas
            </p>
            <div className="space-y-1.5">
              {brief.anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200/60 rounded px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Actions */}
        {brief.top_actions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-widest mb-2">
              Acciones prioritarias
            </p>
            <div className="space-y-2">
              {brief.top_actions.map((action, i) => {
                const p = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.medium
                return (
                  <div key={i} className="flex items-start gap-3 bg-muted rounded-md px-3 py-2.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${p.bg} ${p.text} shrink-0 mt-0.5`}>
                      {p.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1b1f23] leading-snug">{action.action}</p>
                      <p className="text-xs text-[#6a737d] mt-0.5">{action.rationale}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#6a737d]/40 shrink-0 mt-0.5" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#6a737d]">
          Generado {new Date(brief.generated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>
    </div>
  )
}
