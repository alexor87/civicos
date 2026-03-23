'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'

interface Palette {
  id:               string
  name:             string
  category:         string
  color_primary:    string
  color_secondary:  string
  color_accent:     string
  color_background: string
  color_surface:    string
}

export const BRAND_PALETTES: Palette[] = [
  // Clásicas
  { id: 'blue-inst',  name: 'Azul Institucional', category: 'Clásicas',
    color_primary: '#2960ec', color_secondary: '#1e293b', color_accent: '#ea580c', color_background: '#f8fafc', color_surface: '#ffffff' },
  { id: 'green-hope', name: 'Verde Esperanza',    category: 'Clásicas',
    color_primary: '#16a34a', color_secondary: '#14532d', color_accent: '#84cc16', color_background: '#f0fdf4', color_surface: '#ffffff' },
  { id: 'red-patria', name: 'Rojo Patria',        category: 'Clásicas',
    color_primary: '#dc2626', color_secondary: '#7f1d1d', color_accent: '#f97316', color_background: '#fff7f7', color_surface: '#ffffff' },
  { id: 'purple-tx',  name: 'Morado Transformación', category: 'Clásicas',
    color_primary: '#7c3aed', color_secondary: '#3b0764', color_accent: '#ec4899', color_background: '#faf5ff', color_surface: '#ffffff' },
  { id: 'orange-en',  name: 'Naranja Energía',    category: 'Clásicas',
    color_primary: '#ea580c', color_secondary: '#7c2d12', color_accent: '#fbbf24', color_background: '#fff7ed', color_surface: '#ffffff' },
  { id: 'indigo-pr',  name: 'Índigo Progreso',    category: 'Clásicas',
    color_primary: '#4338ca', color_secondary: '#1e1b4b', color_accent: '#06b6d4', color_background: '#eef2ff', color_surface: '#ffffff' },
  { id: 'teal-soc',   name: 'Teal Social',        category: 'Clásicas',
    color_primary: '#0d9488', color_secondary: '#134e4a', color_accent: '#f59e0b', color_background: '#f0fdfa', color_surface: '#ffffff' },
  // Modernas
  { id: 'sky-blue',   name: 'Azul Cielo',         category: 'Modernas',
    color_primary: '#0891b2', color_secondary: '#164e63', color_accent: '#a3e635', color_background: '#ecfeff', color_surface: '#ffffff' },
  { id: 'slate-el',   name: 'Gris Elegante',      category: 'Modernas',
    color_primary: '#475569', color_secondary: '#1e293b', color_accent: '#3b82f6', color_background: '#f8fafc', color_surface: '#ffffff' },
  { id: 'brown-ti',   name: 'Café Tierra',        category: 'Modernas',
    color_primary: '#92400e', color_secondary: '#451a03', color_accent: '#d97706', color_background: '#fdf8f0', color_surface: '#ffffff' },
  { id: 'rose-mo',    name: 'Rose Moderno',       category: 'Modernas',
    color_primary: '#e11d48', color_secondary: '#881337', color_accent: '#f97316', color_background: '#fff1f2', color_surface: '#ffffff' },
  { id: 'lime-fu',    name: 'Lima Futuro',        category: 'Modernas',
    color_primary: '#65a30d', color_secondary: '#365314', color_accent: '#0ea5e9', color_background: '#f7fee7', color_surface: '#ffffff' },
  { id: 'fuchsia-cr', name: 'Fucsia Creativo',    category: 'Modernas',
    color_primary: '#a21caf', color_secondary: '#581c87', color_accent: '#06b6d4', color_background: '#fdf4ff', color_surface: '#ffffff' },
  // Colombia regional
  { id: 'col-llanos', name: 'Verde Llanos',       category: 'Colombia',
    color_primary: '#15803d', color_secondary: '#14532d', color_accent: '#ca8a04', color_background: '#f0fdf4', color_surface: '#ffffff' },
  { id: 'col-cafe',   name: 'Rojo Cafetero',      category: 'Colombia',
    color_primary: '#b91c1c', color_secondary: '#450a0a', color_accent: '#16a34a', color_background: '#fff5f5', color_surface: '#ffffff' },
  { id: 'col-costa',  name: 'Azul Costa',         category: 'Colombia',
    color_primary: '#1d4ed8', color_secondary: '#172554', color_accent: '#fbbf24', color_background: '#eff6ff', color_surface: '#ffffff' },
  { id: 'col-sol',    name: 'Amarillo Sol',       category: 'Colombia',
    color_primary: '#ca8a04', color_secondary: '#713f12', color_accent: '#dc2626', color_background: '#fefce8', color_surface: '#ffffff' },
  { id: 'col-amazon', name: 'Verde Amazonía',     category: 'Colombia',
    color_primary: '#166534', color_secondary: '#052e16', color_accent: '#0891b2', color_background: '#f0fdf4', color_surface: '#ffffff' },
  { id: 'col-andina', name: 'Azul Andino',        category: 'Colombia',
    color_primary: '#1e40af', color_secondary: '#172554', color_accent: '#f97316', color_background: '#eff6ff', color_surface: '#ffffff' },
  { id: 'col-pacifico', name: 'Verde Pacífico',   category: 'Colombia',
    color_primary: '#065f46', color_secondary: '#022c22', color_accent: '#fbbf24', color_background: '#ecfdf5', color_surface: '#ffffff' },
]

const CATEGORIES = ['Clásicas', 'Modernas', 'Colombia']

interface Props {
  initialColors: {
    color_primary:    string
    color_secondary:  string
    color_accent:     string
    color_background: string
    color_surface:    string
  }
}

function findMatchingPalette(colors: Props['initialColors']): Palette | null {
  return BRAND_PALETTES.find(p => p.color_primary === colors.color_primary) ?? null
}

export function BrandColorsForm({ initialColors }: Props) {
  const [activeCategory,  setActiveCategory]  = useState('Clásicas')
  const [selected,        setSelected]        = useState<Palette | null>(findMatchingPalette(initialColors))
  const [customPrimary,   setCustomPrimary]   = useState(initialColors.color_primary)
  const [saving,          setSaving]          = useState(false)

  const effectivePrimary = selected?.color_primary ?? customPrimary

  async function handleSave() {
    setSaving(true)
    const payload = selected
      ? {
          color_primary:    selected.color_primary,
          color_secondary:  selected.color_secondary,
          color_accent:     selected.color_accent,
          color_background: selected.color_background,
          color_surface:    selected.color_surface,
        }
      : {
          color_primary:    customPrimary,
          color_secondary:  initialColors.color_secondary,
          color_accent:     initialColors.color_accent,
          color_background: initialColors.color_background,
          color_surface:    initialColors.color_surface,
        }

    const res = await fetch('/api/settings/brand', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Colores guardados — se aplicarán al recargar el dashboard')
    } else {
      toast.error('Error al guardar los colores')
    }
  }

  const filtered = BRAND_PALETTES.filter(p => p.category === activeCategory)

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Category tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? 'text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={activeCategory === cat ? { backgroundColor: effectivePrimary } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Palette grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {filtered.map(palette => (
          <button
            key={palette.id}
            onClick={() => { setSelected(palette); setCustomPrimary(palette.color_primary) }}
            className={`relative p-3 rounded-xl border-2 text-left transition-all ${
              selected?.id === palette.id ? 'shadow-md' : 'border-slate-200 hover:border-slate-300'
            }`}
            style={selected?.id === palette.id ? { borderColor: palette.color_primary } : {}}
          >
            <div className="flex gap-1 mb-1.5">
              {[palette.color_primary, palette.color_secondary, palette.color_accent].map(c => (
                <div key={c} className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="text-[11px] font-semibold text-slate-700 leading-tight">{palette.name}</p>
            {selected?.id === palette.id && (
              <div
                className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: palette.color_primary }}
              >
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom color */}
      <div className="space-y-1.5">
        <Label>Color personalizado (solo color primario)</Label>
        <div className="flex items-center gap-3">
          <label className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden relative">
            <input
              type="color"
              value={customPrimary}
              onChange={e => { setCustomPrimary(e.target.value); setSelected(null) }}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <div className="h-5 w-5 rounded-full" style={{ backgroundColor: customPrimary }} />
          </label>
          <span className="text-sm font-mono text-slate-600">{customPrimary}</span>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar colores'}
      </Button>
    </div>
  )
}
