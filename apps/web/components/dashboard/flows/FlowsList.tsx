'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Plus } from 'lucide-react'
import { AutomationFlow } from './flowTypes'
import { FlowCard } from './FlowCard'

interface Props {
  initialFlows: AutomationFlow[]
}

export function FlowsList({ initialFlows }: Props) {
  const [flows, setFlows] = useState(initialFlows)

  const active   = flows.filter(f => f.status === 'active').length
  const paused   = flows.filter(f => f.status === 'paused').length
  const drafts   = flows.filter(f => f.status === 'draft').length

  async function handleToggle(id: string, newStatus: 'active' | 'paused') {
    await fetch(`/api/flows/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    })
    setFlows(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
  }

  return (
    <div data-testid="flows-list">
      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">{active}</span> activos
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">{paused}</span> pausados
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">{drafts}</span> borradores
          </span>
        </div>
      </div>

      {/* Lista o Empty state */}
      {flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Aún no tienes automatizaciones
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Crea tu primera automatización y empieza a conectar con tus contactos en el momento justo.
          </p>
          <Link
            href="/dashboard/automatizaciones/new"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear mi primera automatización
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flows.map(flow => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
