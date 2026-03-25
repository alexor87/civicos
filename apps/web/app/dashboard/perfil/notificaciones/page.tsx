'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, Loader2 } from 'lucide-react'

export default function NotificacionesPage() {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        const prefs = data.preferences ?? {}
        setEnabled(prefs.notifications?.enabled !== false)
        setLoading(false)
      })
      .catch(() => { toast.error('Error al cargar preferencias'); setLoading(false) })
  }, [])

  function toggle() {
    setEnabled(prev => !prev)
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { notifications: { enabled } },
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar')
        return
      }
      toast.success('Preferencias guardadas')
      setDirty(false)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notificaciones</h1>
        <p className="text-sm text-slate-500 mt-1">Configura cómo recibes las notificaciones</p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          {enabled ? (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <BellOff className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div>
            <Label className="text-sm font-medium">Notificaciones</Label>
            <p className="text-xs text-slate-500">
              {enabled ? 'Recibirás notificaciones de la plataforma' : 'Las notificaciones están desactivadas'}
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle notificaciones"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <p className="text-sm text-slate-500">
          La configuración granular por tipo de notificación y horario de no molestar estarán disponibles próximamente.
        </p>
      </div>

      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  )
}
