'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { FlowTemplate, CATEGORY_CONFIG, FlowCategory } from './flowTypes'

const TABS: { key: FlowCategory | 'all'; label: string }[] = [
  { key: 'all',        label: 'Todas' },
  { key: 'birthday',   label: '🎂 Fechas' },
  { key: 'engagement', label: '🌡️ Engagement' },
  { key: 'sympathy',   label: '📈 Simpatía' },
  { key: 'donations',  label: '💰 Donaciones' },
  { key: 'canvassing', label: '🚪 Canvassing' },
]

export function TemplateLibrary() {
  const router = useRouter()
  const [templates, setTemplates]   = useState<FlowTemplate[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<FlowCategory | 'all'>('all')
  const [creating, setCreating]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/flows/templates')
      .then(r => r.json())
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeTab === 'all'
    ? templates
    : templates.filter(t => t.category === activeTab)

  async function useTemplate(template: FlowTemplate) {
    setCreating(template.id)
    try {
      const res = await fetch('/api/flows', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             template.name,
          description:      template.description,
          category:         template.category,
          icon:             template.icon,
          trigger_config:   template.trigger_config,
          filter_config:    template.filter_config,
          actions_config:   template.actions_config,
          status:           'draft',
          from_template_id: template.id,
          ai_generated:     false,
        }),
      })
      if (res.ok) {
        const flow = await res.json()
        router.push(`/dashboard/automatizaciones/${flow.id}`)
      }
    } finally {
      setCreating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div data-testid="template-library">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FlowCategory | 'all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de plantillas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(template => {
          const catCfg = CATEGORY_CONFIG[template.category as FlowCategory]
          const isCreating = creating === template.id

          return (
            <div
              key={template.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3"
              data-testid="template-card"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                  {template.icon ?? catCfg?.icon ?? '⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{template.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{template.description}</p>
                </div>
              </div>

              {template.preview_message && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 whitespace-pre-line">
                    {template.preview_message.replace(/\\n/g, '\n')}
                  </p>
                </div>
              )}

              <button
                onClick={() => useTemplate(template)}
                disabled={isCreating}
                className="w-full text-center text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                {isCreating
                  ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Creando…</span>
                  : 'Usar esta plantilla'
                }
              </button>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-8">No hay plantillas en esta categoría.</p>
      )}
    </div>
  )
}
