'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

const AGENT_ENDPOINTS = [
  '/api/agents/campaign-monitor',
  '/api/agents/smart-comms',
  '/api/agents/territory-redistribution',
]

type Status = 'idle' | 'running' | 'done' | 'partial'

export function ActivateAgentsButton() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [completedCount, setCompletedCount] = useState(0)

  const handleActivate = async () => {
    if (status === 'running') return

    setStatus('running')
    setCompletedCount(0)

    const results = await Promise.allSettled(
      AGENT_ENDPOINTS.map(async (endpoint) => {
        const res = await fetch(endpoint, { method: 'POST' })
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    setCompletedCount(succeeded)

    if (succeeded === AGENT_ENDPOINTS.length) {
      setStatus('done')
    } else if (succeeded > 0) {
      setStatus('partial')
    } else {
      setStatus('partial')
    }

    setTimeout(() => {
      router.refresh()
      setStatus('idle')
    }, 2500)
  }

  const label: Record<Status, string> = {
    idle: 'Activar agentes',
    running: 'Analizando campaña...',
    done: '¡Análisis completo!',
    partial: `${completedCount} de ${AGENT_ENDPOINTS.length} agentes completados`,
  }

  const icon: Record<Status, React.ReactNode> = {
    idle: <Zap className="h-4 w-4" />,
    running: <Loader2 className="h-4 w-4 animate-spin" />,
    done: <CheckCircle className="h-4 w-4" />,
    partial: <AlertTriangle className="h-4 w-4" />,
  }

  const bgClass: Record<Status, string> = {
    idle: 'bg-primary hover:shadow-lg hover:shadow-primary/30',
    running: 'bg-primary/70 cursor-wait',
    done: 'bg-emerald-500',
    partial: 'bg-amber-500',
  }

  return (
    <button
      onClick={handleActivate}
      disabled={status === 'running'}
      className={`shrink-0 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${bgClass[status]}`}
    >
      {icon[status]}
      {label[status]}
    </button>
  )
}
