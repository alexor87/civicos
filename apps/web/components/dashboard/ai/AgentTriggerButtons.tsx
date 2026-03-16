'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Activity, Map, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onRunComplete: () => void
}

type AgentKey = 'campaign-monitor' | 'smart-comms' | 'territory-redistribution'

const AGENTS: { key: AgentKey; label: string; description: string; icon: React.ReactNode; endpoint: string }[] = [
  {
    key: 'campaign-monitor',
    label: 'Monitor de campaña',
    description: 'Analiza KPIs y detecta anomalías del día',
    icon: <Activity className="h-4 w-4" />,
    endpoint: '/api/agents/campaign-monitor',
  },
  {
    key: 'smart-comms',
    label: 'Comunicaciones inteligentes',
    description: 'Optimiza canales de email y SMS',
    icon: <MessageSquare className="h-4 w-4" />,
    endpoint: '/api/agents/smart-comms',
  },
  {
    key: 'territory-redistribution',
    label: 'Redistribución de territorio',
    description: 'Propone rebalanceo de voluntarios por zona',
    icon: <Map className="h-4 w-4" />,
    endpoint: '/api/agents/territory-redistribution',
  },
]

export function AgentTriggerButtons({ onRunComplete }: Props) {
  const [runningAgent, setRunningAgent] = useState<AgentKey | null>(null)

  const triggerAgent = async (agent: typeof AGENTS[number]) => {
    setRunningAgent(agent.key)
    try {
      const res = await fetch(agent.endpoint, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Error ${res.status}`)
      }
      toast.success(`${agent.label} ejecutado correctamente`)
      onRunComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al ejecutar agente')
    } finally {
      setRunningAgent(null)
    }
  }

  return (
    <div className="space-y-2 mb-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Ejecutar ahora
      </p>
      {AGENTS.map(agent => (
        <div key={agent.key} className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{agent.icon}</span>
            <div>
              <p className="text-sm font-medium">{agent.label}</p>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={runningAgent !== null}
            onClick={() => triggerAgent(agent)}
            aria-label={`Ejecutar ${agent.label}`}
          >
            {runningAgent === agent.key ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              'Ejecutar'
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
