'use client'

import { useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { analyzeTerritoryAction, type TerritoryAnalysisReport } from '@/app/dashboard/canvassing/territory-analysis-action'

// ── Sentiment icon ─────────────────────────────────────────────────────────────

function SentimentIcon({ sentiment }: { sentiment: TerritoryAnalysisReport['overall_sentiment'] }) {
  if (sentiment === 'positivo') return <TrendingUp  className="h-4 w-4 text-[#28a745]" />
  if (sentiment === 'negativo') return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-[#6a737d]" />
}

function sentimentClass(s: TerritoryAnalysisReport['overall_sentiment']) {
  if (s === 'positivo') return 'bg-[#28a745]/10 border-[#28a745]/20 text-[#28a745]'
  if (s === 'negativo') return 'bg-red-50 border-red-200 text-red-600'
  return 'bg-[#f8cf0c]/10 border-[#f8cf0c]/30 text-[#2a2a2a]'
}

// ── Report view ────────────────────────────────────────────────────────────────

function ReportView({ report }: { report: TerritoryAnalysisReport }) {
  const [showDetails, setShowDetails] = useState(false)

  const gaps = report.territory_insights.filter(t => t.coverage_gap)
  const coaching = report.volunteer_insights.filter(v => v.needs_coaching)

  return (
    <div className="space-y-4">
      {/* Overall sentiment banner */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-md border ${sentimentClass(report.overall_sentiment)}`}>
        <SentimentIcon sentiment={report.overall_sentiment} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{report.overall_assessment}</p>
          <p className="text-xs mt-1 opacity-70">{report.coverage_summary}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-md px-2 py-2.5">
          <p className="text-lg font-semibold text-[#1b1f23]">{report.total_visits}</p>
          <p className="text-[10px] text-[#6a737d] leading-tight">visitas<br/>últimos {report.period_days}d</p>
        </div>
        <div className={`rounded-md px-2 py-2.5 ${gaps.length > 0 ? 'bg-orange-50' : 'bg-[#28a745]/10'}`}>
          <p className={`text-lg font-semibold ${gaps.length > 0 ? 'text-orange-600' : 'text-[#28a745]'}`}>{gaps.length}</p>
          <p className="text-[10px] text-[#6a737d] leading-tight">territorios<br/>sin cobertura</p>
        </div>
        <div className={`rounded-md px-2 py-2.5 ${coaching.length > 0 ? 'bg-[#2960ec]/10' : 'bg-[#28a745]/10'}`}>
          <p className={`text-lg font-semibold ${coaching.length > 0 ? 'text-[#2960ec]' : 'text-[#28a745]'}`}>{coaching.length}</p>
          <p className="text-[10px] text-[#6a737d] leading-tight">voluntarios<br/>con alerta</p>
        </div>
      </div>

      {/* Next week recommendations */}
      {report.next_week_recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#1b1f23] mb-2">Prioridades próxima semana</p>
          <ul className="space-y-1.5">
            {report.next_week_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#6a737d]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2960ec] mt-0.5 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Territory / volunteer details toggle */}
      {(gaps.length > 0 || coaching.length > 0) && (
        <div>
          <button
            onClick={() => setShowDetails(d => !d)}
            className="flex items-center gap-1 text-xs text-[#2960ec] hover:text-[#0a41cc] font-medium"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-3">
              {gaps.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide mb-2">Territorios con brecha</p>
                  <div className="space-y-1.5">
                    {gaps.map(t => (
                      <div key={t.territory_id} className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded px-2.5 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1b1f23] truncate">{t.territory_name}</p>
                          <p className="text-[10px] text-[#6a737d]">{t.visits} visitas · {t.positive_rate}% positivas</p>
                          <p className="text-[10px] text-orange-600 mt-0.5">{t.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {coaching.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#6a737d] uppercase tracking-wide mb-2">Voluntarios — requieren atención</p>
                  <div className="space-y-1.5">
                    {coaching.map(v => (
                      <div key={v.volunteer_id} className="flex items-start gap-2 bg-[#2960ec]/5 border border-[#2960ec]/20 rounded px-2.5 py-2">
                        <div className="h-3.5 w-3.5 rounded-full bg-[#2960ec]/20 mt-0.5 shrink-0 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2960ec]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1b1f23] truncate">{v.volunteer_name}</p>
                          <p className="text-[10px] text-[#6a737d]">{v.visits} visitas · {v.positive_rate}% positivas</p>
                          <p className="text-[10px] text-[#2960ec] mt-0.5">{v.insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[10px] text-[#dcdee6] text-right">
        Generado {new Date(report.generated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TerritoryAnalysisPanel() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [report, setReport] = useState<TerritoryAnalysisReport | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  const handleAnalyze = async () => {
    setState('loading')
    setError(null)
    const result = await analyzeTerritoryAction()
    if (result.error) {
      setError(result.error)
      setState('error')
    } else if (result.report) {
      setReport(result.report)
      setState('done')
    }
  }

  return (
    <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#dcdee6]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#2960ec]" />
          <h2 className="text-sm font-semibold text-[#1b1f23]">Análisis IA</h2>
        </div>
        {state !== 'idle' && (
          <button
            onClick={() => { setState('idle'); setReport(null); setError(null) }}
            className="text-[10px] text-[#6a737d] hover:text-[#1b1f23]"
          >
            Reiniciar
          </button>
        )}
      </div>

      <div className="p-4">
        {state === 'idle' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="h-10 w-10 rounded-full bg-[#2960ec]/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-[#2960ec]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1b1f23]">Análisis de terreno</p>
              <p className="text-xs text-[#6a737d] mt-1">Analiza cobertura, resultados y rendimiento del equipo con IA</p>
            </div>
            <Button size="sm" onClick={handleAnalyze} className="gap-1.5 mt-1">
              <Brain className="h-3.5 w-3.5" />
              Analizar ahora
            </Button>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-6 w-6 text-[#2960ec] animate-spin" />
            <p className="text-sm text-[#6a737d]">Analizando datos de terreno…</p>
            <p className="text-xs text-[#dcdee6]">Esto puede tardar unos segundos</p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <p className="text-sm text-[#1b1f23]">No se pudo completar el análisis</p>
            <p className="text-xs text-[#6a737d]">{error}</p>
            <Button variant="outline" size="sm" onClick={handleAnalyze}>Reintentar</Button>
          </div>
        )}

        {state === 'done' && report && <ReportView report={report} />}
      </div>
    </div>
  )
}
