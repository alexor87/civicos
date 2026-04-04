'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'

interface ResolvedFeature {
  feature_key: string
  resolved_value: unknown
  source: string
}

interface Override {
  id: string
  feature_key: string
  value: unknown
  reason: string | null
}

interface Props {
  tenantId: string
  tenantPlan: string
  resolvedFeatures: ResolvedFeature[]
  overrides: Override[]
}

export function FeatureOverridesEditor({ tenantId, tenantPlan, resolvedFeatures, overrides }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  const overrideMap = new Map(overrides.map(o => [o.feature_key, o]))

  async function toggleOverride(featureKey: string, currentValue: unknown) {
    setSaving(featureKey)
    const hasOverride = overrideMap.has(featureKey)

    if (hasOverride) {
      // Remove override
      await fetch(`/api/tenants/${tenantId}/overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey }),
      })
    } else {
      // Create override with opposite boolean value
      const newValue = typeof currentValue === 'boolean' ? !currentValue : currentValue
      await fetch(`/api/tenants/${tenantId}/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey, value: newValue }),
      })
    }

    setSaving(null)
    router.refresh()
  }

  async function setNumericOverride(featureKey: string, value: number) {
    setSaving(featureKey)
    await fetch(`/api/tenants/${tenantId}/overrides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature_key: featureKey, value }),
    })
    setSaving(null)
    router.refresh()
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Feature overrides</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Plan actual: {tenantPlan}. Los overrides individuales prevalecen sobre el plan.</p>
      </div>
      <div className="divide-y divide-border">
        {resolvedFeatures.map((feat) => {
          const override = overrideMap.get(feat.feature_key)
          const isOverridden = feat.source === 'override'
          const isBool = typeof feat.resolved_value === 'boolean'
          const isNum = typeof feat.resolved_value === 'number'

          return (
            <div key={feat.feature_key} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">{feat.feature_key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {isOverridden ? (
                    <span className="text-amber-600 font-medium">Override activo</span>
                  ) : (
                    <span>Valor del plan</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Current value display */}
                <span className="text-sm font-mono text-muted-foreground w-28 text-right">
                  {JSON.stringify(feat.resolved_value)}
                </span>

                {/* Toggle for booleans */}
                {isBool && (
                  <button
                    onClick={() => toggleOverride(feat.feature_key, feat.resolved_value)}
                    disabled={saving === feat.feature_key}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                      feat.resolved_value ? 'bg-primary' : 'bg-muted'
                    } ${isOverridden ? 'ring-2 ring-amber-300' : ''}`}
                  >
                    {saving === feat.feature_key ? (
                      <Loader2 className="absolute left-1/2 -translate-x-1/2 w-3 h-3 animate-spin text-white" />
                    ) : (
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feat.resolved_value ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    )}
                  </button>
                )}

                {/* Remove override button */}
                {isOverridden && (
                  <button
                    onClick={() => toggleOverride(feat.feature_key, feat.resolved_value)}
                    className="p-1 rounded hover:bg-accent transition-colors"
                    title="Eliminar override"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
