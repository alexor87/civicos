'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, CheckCircle, XCircle, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/types/database'
import type { AgentThresholds } from '@/lib/agents/thresholds'
import { DEFAULT_AGENT_THRESHOLDS } from '@/lib/agents/thresholds'
import { AgentTriggerButtons } from '@/components/dashboard/ai/AgentTriggerButtons'
import { ThresholdsConfigForm } from '@/components/dashboard/ai/ThresholdsConfigForm'
import { AIChatPanel } from '@/components/dashboard/ai/AIChatPanel'

type Suggestion = Database['public']['Tables']['ai_suggestions']['Row']
type AgentRun = Database['public']['Tables']['agent_runs']['Row']

const priorityBorderColor: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-[#dcdee6]',
}

const priorityConfig = {
  critical: { label: 'Crítica', className: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Media', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: 'Baja', className: 'bg-[#f6f7f8] text-[#6a737d] border-[#dcdee6]' },
}

const moduleLabels: Record<string, string> = {
  crm: 'CRM',
  canvassing: 'Canvassing',
  communications: 'Comunicaciones',
  volunteers: 'Voluntarios',
  analytics: 'Analítica',
  content: 'Contenido',
}

function SuggestionCard({ suggestion, onAction }: { suggestion: Suggestion; onAction: (id: string, action: 'approved' | 'dismissed') => void }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const priority = priorityConfig[suggestion.priority] ?? priorityConfig.medium

  return (
    <Card className={`border-l-4 ${priorityBorderColor[suggestion.priority] ?? 'border-l-slate-300'}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priority.className}`}>
                {priority.label}
              </span>
              <Badge variant="outline" className="text-xs">
                {moduleLabels[suggestion.module] ?? suggestion.module}
              </Badge>
              {suggestion.status === 'pending_approval' && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
                  <Clock className="h-3 w-3 mr-1" />
                  Requiere aprobación
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-[#1b1f23]">{suggestion.title}</h3>
            <p className="text-sm text-[#586069] mt-1">{suggestion.description}</p>

            {expanded && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {suggestion.reasoning && (
                  <div>
                    <p className="text-xs font-medium text-[#6a737d] mb-1">Razonamiento IA:</p>
                    <p className="text-sm text-[#586069]">{suggestion.reasoning}</p>
                  </div>
                )}
                {suggestion.estimated_impact && (
                  <div>
                    <p className="text-xs font-medium text-[#6a737d] mb-1">Impacto estimado:</p>
                    <p className="text-sm text-[#586069]">{suggestion.estimated_impact}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-[#2960ec] mt-2 hover:text-blue-800"
            >
              {expanded ? <><ChevronUp className="h-3 w-3" /> Menos detalle</> : <><ChevronDown className="h-3 w-3" /> Más detalle</>}
            </button>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button
              size="sm"
              className="text-xs bg-green-600 hover:bg-green-700"
              disabled={isPending}
              onClick={() => startTransition(() => onAction(suggestion.id, 'approved'))}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Aplicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-[#6a737d]"
              disabled={isPending}
              onClick={() => startTransition(() => onAction(suggestion.id, 'dismissed'))}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Descartar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface Props {
  suggestions: Suggestion[]
  history: Suggestion[]
  agentRuns: AgentRun[]
  campaignId: string
  userRole: string
  campaignName: string
  thresholds: AgentThresholds
}

export function AISuggestionsPanel({ suggestions, history, agentRuns, campaignId, userRole, campaignName, thresholds }: Props) {
  const router = useRouter()
  const [activeSuggestions, setActiveSuggestions] = useState(suggestions)

  // Realtime subscription — live updates when new suggestions arrive
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('ai_suggestions_live')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'ai_suggestions',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const newSuggestion = payload.new as Suggestion
          if (['active', 'pending_approval'].includes(newSuggestion.status)) {
            setActiveSuggestions(prev => {
              // Avoid duplicates
              if (prev.some(s => s.id === newSuggestion.id)) return prev
              return [newSuggestion, ...prev]
            })
            toast.info(`Nueva sugerencia: ${newSuggestion.title}`)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  async function handleAction(id: string, action: 'approved' | 'dismissed') {
    const res = await fetch('/api/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })

    if (res.ok) {
      setActiveSuggestions(prev => prev.filter(s => s.id !== id))
      toast.success(action === 'approved' ? 'Sugerencia aplicada' : 'Sugerencia descartada')
    } else {
      toast.error('Error al procesar la acción')
    }
  }

  const critical = activeSuggestions.filter(s => s.priority === 'critical')
  const high = activeSuggestions.filter(s => s.priority === 'high')
  const others = activeSuggestions.filter(s => !['critical', 'high'].includes(s.priority))

  return (
    <div className="space-y-4">
      <Tabs defaultValue="suggestions">
        <TabsList>
          <TabsTrigger value="suggestions">
            Sugerencias
            {activeSuggestions.length > 0 && (
              <span className="ml-2 bg-[#2960ec]/10 text-[#2960ec] text-xs px-1.5 py-0.5 rounded-full">
                {activeSuggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="agents">Agentes IA</TabsTrigger>
          <TabsTrigger value="chat">Chat IA</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4 mt-4">
          {activeSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 text-[#e1e4e8] mx-auto mb-3" />
                <p className="text-[#6a737d]">No hay sugerencias activas en este momento</p>
                <p className="text-xs text-[#d1d5da] mt-1">Los agentes analizan continuamente tu campaña</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {critical.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-red-700 mb-2">🚨 Críticas ({critical.length})</h2>
                  <div className="space-y-3">
                    {critical.map(s => <SuggestionCard key={s.id} suggestion={s} onAction={handleAction} />)}
                  </div>
                </div>
              )}
              {high.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-orange-700 mb-2">⚡ Prioridad alta ({high.length})</h2>
                  <div className="space-y-3">
                    {high.map(s => <SuggestionCard key={s.id} suggestion={s} onAction={handleAction} />)}
                  </div>
                </div>
              )}
              {others.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#586069] mb-2">Otras sugerencias ({others.length})</h2>
                  <div className="space-y-3">
                    {others.map(s => <SuggestionCard key={s.id} suggestion={s} onAction={handleAction} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="agents" className="mt-4 space-y-3">
          <AgentTriggerButtons onRunComplete={() => router.refresh()} />
          {agentRuns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 text-[#e1e4e8] mx-auto mb-3" />
                <p className="text-[#6a737d]">Sin actividad de agentes aún</p>
              </CardContent>
            </Card>
          ) : (
            agentRuns.map(run => (
              <Card key={run.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2 w-2 rounded-full ${
                          run.status === 'completed' ? 'bg-green-500' :
                          run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          run.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="font-medium text-sm">{run.agent_id}</span>
                      </div>
                      <p className="text-xs text-[#6a737d]">Trigger: {run.trigger}</p>
                      <p className="text-xs text-[#6a737d] mt-1">
                        {new Date(run.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <Badge variant={run.status === 'completed' ? 'outline' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                      {run.status}
                    </Badge>
                  </div>
                  {run.error && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">{run.error}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <AIChatPanel
            campaignId={campaignId}
            campaignName={campaignName}
            recentSuggestions={activeSuggestions.slice(0, 3).map(s => ({ priority: s.priority, title: s.title }))}
          />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <ThresholdsConfigForm campaignId={campaignId} initialThresholds={thresholds} />
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-[#6a737d]">
                Sin historial aún
              </CardContent>
            </Card>
          ) : (
            history.map(s => (
              <div key={s.id} className="p-4 border rounded-lg bg-[#f6f7f8] flex items-center gap-3">
                {s.status === 'applied' ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#6a737d] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#24292e] truncate">{s.title}</p>
                  <p className="text-xs text-[#6a737d]">{moduleLabels[s.module]} · {new Date(s.updated_at).toLocaleDateString('es-ES')}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs capitalize">{s.status}</Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
