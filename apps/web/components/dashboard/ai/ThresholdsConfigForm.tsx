'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type AgentThresholds } from '@/lib/agents/thresholds'

interface Props {
  campaignId: string
  initialThresholds: AgentThresholds
}

const FIELDS: { key: keyof AgentThresholds; label: string; description: string; unit: string }[] = [
  { key: 'visit_drop_pct',        label: 'Alerta caída de visitas',       description: 'Genera alerta si las visitas caen más de este % vs el día anterior', unit: '%' },
  { key: 'coverage_low_pct',      label: 'Cobertura baja de territorio',  description: 'Umbrales para considerar un territorio con baja cobertura', unit: '%' },
  { key: 'inactive_volunteers_min', label: 'Mínimo voluntarios activos',  description: 'Alerta si hay menos de este número de voluntarios activos en 7 días', unit: 'voluntarios' },
  { key: 'inactive_contact_days', label: 'Días sin contacto (inactivo)', description: 'Considera un contacto inactivo si no ha sido contactado en este período', unit: 'días' },
  { key: 'stale_draft_days',      label: 'Borrador pendiente (días)',     description: 'Alerta si hay borradores de email/SMS sin enviar tras este período', unit: 'días' },
]

export function ThresholdsConfigForm({ campaignId, initialThresholds }: Props) {
  const [values, setValues] = useState<AgentThresholds>({ ...initialThresholds })
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (key: keyof AgentThresholds, raw: string) => {
    const num = parseInt(raw, 10)
    if (!isNaN(num)) setValues(prev => ({ ...prev, [key]: num }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/campaigns/thresholds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, thresholds: values }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al guardar')
      }
      toast.success('Configuración guardada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Umbrales de los agentes IA</CardTitle>
        <CardDescription>
          Ajusta cuándo los agentes disparan alertas y sugerencias para esta campaña.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, description, unit }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={key}
                  type="number"
                  min={1}
                  value={values[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
