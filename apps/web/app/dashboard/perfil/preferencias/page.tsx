'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Monitor, Loader2 } from 'lucide-react'

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun, preview: 'bg-white border-slate-200' },
  { value: 'dark', label: 'Oscuro', icon: Moon, preview: 'bg-slate-900 border-slate-700' },
  { value: 'system', label: 'Automático', icon: Monitor, preview: 'bg-gradient-to-r from-white to-slate-900 border-slate-300' },
]

const FONT_OPTIONS = [
  { value: 'normal', label: 'Normal', size: 'text-sm' },
  { value: 'large', label: 'Grande', size: 'text-base' },
  { value: 'x-large', label: 'Muy grande', size: 'text-lg' },
]

export default function PreferenciasPage() {
  const [themeMode, setThemeMode] = useState('system')
  const [fontSize, setFontSize] = useState('normal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setThemeMode(data.theme_mode ?? 'system')
        setFontSize(data.font_size ?? 'normal')
        setLoading(false)
      })
      .catch(() => { toast.error('Error al cargar preferencias'); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_mode: themeMode, font_size: fontSize }),
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
        <h1 className="text-xl font-bold text-slate-900">Preferencias</h1>
        <p className="text-sm text-slate-500 mt-1">Personaliza la apariencia de la plataforma</p>
      </div>

      {/* Theme mode */}
      <div className="space-y-3">
        <Label>Modo de interfaz</Label>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon, preview }) => (
            <button
              key={value}
              onClick={() => { setThemeMode(value); setDirty(true) }}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                themeMode === value
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`h-12 w-full rounded-md border ${preview}`} />
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">La aplicación visual del tema estará disponible próximamente</p>
      </div>

      {/* Font size */}
      <div className="space-y-3">
        <Label>Tamaño de fuente</Label>
        <div className="grid grid-cols-3 gap-3">
          {FONT_OPTIONS.map(({ value, label, size }) => (
            <button
              key={value}
              onClick={() => { setFontSize(value); setDirty(true) }}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                fontSize === value
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`${size} font-medium text-slate-700`}>Aa</span>
              <span className="text-xs text-slate-500">{label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">La aplicación visual del tamaño estará disponible próximamente</p>
      </div>

      {/* Save button */}
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
