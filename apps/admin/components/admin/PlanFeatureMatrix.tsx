'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'

interface Feature {
  key: string
  name: string
  type: string
  category: string
}

interface Props {
  features: Feature[]
  matrix: Record<string, Record<string, unknown>>
  plans: string[]
}

export function PlanFeatureMatrix({ features, matrix, plans }: Props) {
  const [edits, setEdits] = useState<Record<string, Record<string, unknown>>>({})
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const hasEdits = Object.keys(edits).length > 0

  function getValue(featureKey: string, plan: string): unknown {
    return edits[featureKey]?.[plan] ?? matrix[featureKey]?.[plan] ?? false
  }

  function setValue(featureKey: string, plan: string, value: unknown) {
    setEdits(prev => ({
      ...prev,
      [featureKey]: { ...(prev[featureKey] ?? {}), [plan]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const updates: { plan: string; feature_key: string; value: unknown }[] = []
    for (const [featureKey, planValues] of Object.entries(edits)) {
      for (const [plan, value] of Object.entries(planValues)) {
        updates.push({ plan, feature_key: featureKey, value })
      }
    }

    await fetch('/api/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })

    setEdits({})
    setSaving(false)
    router.refresh()
  }

  // Group features by category
  const categories = [...new Set(features.map(f => f.category))]

  const categoryLabels: Record<string, string> = {
    maps: 'Mapas',
    ai: 'Inteligencia Artificial',
    communications: 'Comunicaciones',
    operations: 'Operaciones',
    crm: 'CRM',
    limits: 'Límites',
  }

  const planColors: Record<string, string> = {
    esencial: 'text-slate-700',
    pro: 'text-blue-700',
    campaign: 'text-purple-700',
    enterprise: 'text-amber-700',
  }

  return (
    <div className="space-y-4">
      {/* Save bar */}
      {hasEdits && (
        <div className="sticky top-0 z-10 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-amber-800 font-medium">
            {Object.values(edits).reduce((sum, v) => sum + Object.keys(v).length, 0)} cambios sin guardar
          </p>
          <div className="flex gap-3">
            <button onClick={() => setEdits({})} className="px-3 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors">
              Descartar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Matrix table */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 w-64">Feature</th>
              {plans.map(plan => (
                <th key={plan} className={`text-center text-xs font-semibold px-5 py-3 capitalize ${planColors[plan] ?? ''}`}>
                  {plan}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <CategoryGroup key={cat}>
                {/* Category header */}
                <tr className="bg-muted/30">
                  <td colSpan={plans.length + 1} className="px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {categoryLabels[cat] ?? cat}
                  </td>
                </tr>

                {/* Features in this category */}
                {features.filter(f => f.category === cat).map(feat => (
                  <tr key={feat.key} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm text-foreground">{feat.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{feat.key}</p>
                    </td>
                    {plans.map(plan => {
                      const val = getValue(feat.key, plan)
                      const isEdited = edits[feat.key]?.[plan] !== undefined

                      return (
                        <td key={plan} className={`px-5 py-3 text-center ${isEdited ? 'bg-amber-50' : ''}`}>
                          {feat.type === 'boolean' ? (
                            <button
                              onClick={() => setValue(feat.key, plan, !val)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                val ? 'bg-primary' : 'bg-muted'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                val ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          ) : feat.type === 'numeric' ? (
                            <input
                              type="number"
                              value={String(val ?? 0)}
                              onChange={(e) => setValue(feat.key, plan, Number(e.target.value))}
                              className="w-24 px-2 py-1 text-sm text-center rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          ) : feat.type === 'enum' ? (
                            <input
                              type="text"
                              value={typeof val === 'string' ? val : JSON.stringify(val)}
                              onChange={(e) => {
                                try { setValue(feat.key, plan, JSON.parse(e.target.value)) } catch { /* ignore */ }
                              }}
                              className="w-40 px-2 py-1 text-xs font-mono rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{JSON.stringify(val)}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </CategoryGroup>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CategoryGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
