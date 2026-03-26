'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Clock, Copy, CheckCheck, Users, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { analyzeSmartComms, type SmartCommsReport } from '@/app/dashboard/comunicaciones/smart-comms-action'

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-[#2960ec] hover:text-[#1a4bc4] font-medium">
      {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'Alta confianza',   cls: 'bg-[#28a745]/10 text-[#28a745]'  },
  medium: { label: 'Confianza media',  cls: 'bg-amber-100   text-amber-700'   },
  low:    { label: 'Baja confianza',   cls: 'bg-muted   text-[#6a737d]'   },
}

const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// ── Main component ─────────────────────────────────────────────────────────────

type PanelState = 'collapsed' | 'idle' | 'loading' | 'done' | 'error'

export function SmartCommsPanel() {
  const [state,   setState]   = useState<PanelState>('collapsed')
  const [report,  setReport]  = useState<SmartCommsReport | null>(null)
  const [topic,   setTopic]   = useState('')
  const [errMsg,  setErrMsg]  = useState('')

  const handleAnalyze = async () => {
    setState('loading')
    const result = await analyzeSmartComms(topic.trim() || undefined)
    if (result.error) {
      setErrMsg(result.error)
      setState('error')
      toast.error(result.error)
    } else if (result.report) {
      setReport(result.report)
      setState('done')
    }
  }

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (state === 'collapsed') {
    return (
      <div className="bg-white border border-[#dcdee6] rounded-md">
        <button
          type="button"
          onClick={() => setState('idle')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#2960ec]/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#2960ec]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#1b1f23]">Comunicaciones Inteligentes</p>
              <p className="text-xs text-[#6a737d]">Horario óptimo · Variantes A/B · Reengagement</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-[#6a737d]" />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#dcdee6]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#2960ec]/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-[#2960ec]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1b1f23]">Comunicaciones Inteligentes</p>
            <p className="text-xs text-[#6a737d]">Análisis IA de tus campañas</p>
          </div>
        </div>
        <button
          onClick={() => setState('collapsed')}
          className="text-[#6a737d] hover:text-[#1b1f23] transition-colors"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Idle / controls */}
        {(state === 'idle' || state === 'error') && (
          <>
            {state === 'error' && (
              <p className="text-xs text-red-500">{errMsg}</p>
            )}
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Tema para variantes de asunto (opcional)"
                className="text-sm"
              />
              <Button onClick={handleAnalyze} className="shrink-0 gap-1.5 bg-[#2960ec] hover:bg-[#1a4bc4]">
                <Sparkles className="h-3.5 w-3.5" />
                Analizar
              </Button>
            </div>
            <p className="text-xs text-[#6a737d]">
              Analiza el historial de campañas enviadas para generar recomendaciones de horario, variantes de asunto y lista de reengagement.
            </p>
          </>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#2960ec]" />
            <p className="text-sm text-[#6a737d]">Analizando campañas y generando recomendaciones…</p>
          </div>
        )}

        {/* Done */}
        {state === 'done' && report && (
          <div className="space-y-5">
            {/* 1. Optimal send time */}
            {report.optimal_send && (() => {
              const conf = CONFIDENCE_CONFIG[report.optimal_send.confidence] ?? CONFIDENCE_CONFIG.medium
              const hour = report.optimal_send.hour
              const ampm = hour >= 12 ? (hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`) : `${hour}:00 AM`
              return (
                <div>
                  <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-widest mb-2">
                    Horario óptimo de envío
                  </p>
                  <div className="bg-muted rounded-md px-4 py-3 flex items-start gap-3">
                    <Clock className="h-4 w-4 text-[#2960ec] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#1b1f23] capitalize">
                          {DOW[report.optimal_send.hour] ?? report.optimal_send.day_of_week}, {ampm}
                        </span>
                        <span className="capitalize text-sm font-semibold text-[#1b1f23]">
                          {report.optimal_send.day_of_week}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${conf.cls}`}>
                          {conf.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#6a737d] mt-1">{report.optimal_send.rationale}</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 2. Subject variants */}
            {report.subject_variants.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-widest mb-2">
                  Variantes de asunto A/B
                </p>
                <div className="space-y-2">
                  {report.subject_variants.map((v, i) => (
                    <div key={i} className="border border-[#dcdee6] rounded-md px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-[#2960ec] uppercase">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-[10px] text-[#6a737d] capitalize">{v.tone}</span>
                          </div>
                          <p className="text-sm font-medium text-[#1b1f23]">{v.variant}</p>
                          <p className="text-xs text-[#6a737d] mt-0.5">{v.why}</p>
                        </div>
                        <CopyBtn text={v.variant} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Reengagement */}
            {report.reengagement && report.reengagement.count > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-widest mb-2">
                  Reengagement
                </p>
                <div className="bg-muted rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#6a737d] shrink-0" />
                    <p className="text-sm font-medium text-[#1b1f23]">
                      {report.reengagement.count.toLocaleString('es-ES')} contactos
                    </p>
                  </div>
                  <p className="text-xs text-[#6a737d]">{report.reengagement.segment_description}</p>
                  <div className="border border-[#dcdee6] rounded bg-white px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide">
                        Mensaje sugerido
                      </p>
                      <CopyBtn text={report.reengagement.suggested_message} />
                    </div>
                    <p className="text-xs text-[#1b1f23] leading-relaxed">
                      {report.reengagement.suggested_message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-[#6a737d]">
                Generado {new Date(report.generated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <button
                onClick={() => { setState('idle'); setReport(null) }}
                className="flex items-center gap-1 text-xs text-[#6a737d] hover:text-[#2960ec] transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Analizar de nuevo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
