'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import type { SegmentFilter, SegmentFilterField, SegmentFilterOperator } from '@/lib/types/database'

// ── Field metadata ──────────────────────────────────────────────────────────

type FieldMeta = {
  label: string
  operators: { value: SegmentFilterOperator; label: string }[]
  input: 'text' | 'select' | 'number' | 'none'
  options?: { value: string; label: string }[]
}

const FIELDS: Record<SegmentFilterField, FieldMeta> = {
  status: {
    label: 'Estado',
    operators: [
      { value: 'eq', label: 'es' },
      { value: 'neq', label: 'no es' },
    ],
    input: 'select',
    options: [
      { value: 'prospect', label: 'Prospecto' },
      { value: 'supporter', label: 'Simpatizante' },
      { value: 'undecided', label: 'Indeciso' },
      { value: 'opponent', label: 'Oponente' },
      { value: 'unknown', label: 'Desconocido' },
    ],
  },
  department: {
    label: 'Departamento',
    operators: [{ value: 'eq', label: 'es' }],
    input: 'text',
  },
  municipality: {
    label: 'Municipio',
    operators: [{ value: 'eq', label: 'es' }],
    input: 'text',
  },
  gender: {
    label: 'Género',
    operators: [{ value: 'eq', label: 'es' }],
    input: 'select',
    options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' },
      { value: 'otro', label: 'Otro' },
    ],
  },
  tags: {
    label: 'Etiqueta',
    operators: [{ value: 'contains', label: 'contiene' }],
    input: 'text',
  },
  has_visits: {
    label: 'Visitas de canvassing',
    operators: [
      { value: 'is_true', label: 'tiene visitas' },
      { value: 'is_false', label: 'no tiene visitas' },
    ],
    input: 'none',
  },
  sympathy_level: {
    label: 'Nivel de simpatía',
    operators: [
      { value: 'gte', label: '≥' },
      { value: 'lte', label: '≤' },
    ],
    input: 'number',
  },
  vote_intention: {
    label: 'Intención de voto',
    operators: [{ value: 'eq', label: 'es' }],
    input: 'text',
  },
}

const FIELD_OPTIONS = Object.entries(FIELDS).map(([value, meta]) => ({
  value: value as SegmentFilterField,
  label: meta.label,
}))

// ── FilterRow ───────────────────────────────────────────────────────────────

function FilterRow({
  filter,
  onChange,
  onRemove,
}: {
  filter: SegmentFilter
  onChange: (f: SegmentFilter) => void
  onRemove: () => void
}) {
  const meta = FIELDS[filter.field]

  function handleFieldChange(field: string | null) {
    if (!field) return
    const f = field as SegmentFilterField
    const newMeta = FIELDS[f]
    onChange({
      field: f,
      operator: newMeta.operators[0].value,
      value: newMeta.input === 'none' ? true : '',
    })
  }

  function handleOperatorChange(operator: string | null) {
    if (!operator) return
    onChange({ ...filter, operator: operator as SegmentFilterOperator })
  }

  function handleValueChange(value: string | number | boolean | null) {
    if (value === null) return
    onChange({ ...filter, value })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Field selector */}
      <Select value={filter.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELD_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select value={filter.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {meta.operators.map(op => (
            <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {meta.input === 'text' && (
        <Input
          className="w-40 h-8 text-xs"
          value={String(filter.value)}
          onChange={e => handleValueChange(e.target.value)}
          placeholder="valor…"
        />
      )}
      {meta.input === 'number' && (
        <Input
          type="number"
          className="w-20 h-8 text-xs"
          min={1}
          max={5}
          value={String(filter.value)}
          onChange={e => handleValueChange(Number(e.target.value))}
        />
      )}
      {meta.input === 'select' && meta.options && (
        <Select value={String(filter.value)} onValueChange={handleValueChange}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta.options.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {meta.input === 'none' && <span className="w-40" />}

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
        onClick={onRemove}
        aria-label="Eliminar filtro"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ── SegmentFilterBuilder ────────────────────────────────────────────────────

export function SegmentFilterBuilder({ initial = [] }: { initial?: SegmentFilter[] }) {
  const [filters, setFilters] = useState<SegmentFilter[]>(initial)
  const [json, setJson] = useState(JSON.stringify(initial))

  useEffect(() => {
    setJson(JSON.stringify(filters))
  }, [filters])

  function addFilter() {
    setFilters(prev => [
      ...prev,
      { field: 'status', operator: 'eq', value: 'supporter' },
    ])
  }

  function updateFilter(index: number, updated: SegmentFilter) {
    setFilters(prev => prev.map((f, i) => (i === index ? updated : f)))
  }

  function removeFilter(index: number) {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Filtros <span className="text-gray-400 font-normal">({filters.length})</span>
        </span>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={addFilter}>
          <Plus className="h-3.5 w-3.5" />
          Agregar filtro
        </Button>
      </div>

      {filters.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-md">
          Sin filtros — el segmento incluirá todos los contactos de la campaña
        </p>
      )}

      <div className="space-y-2">
        {filters.map((f, i) => (
          <FilterRow
            key={i}
            filter={f}
            onChange={updated => updateFilter(i, updated)}
            onRemove={() => removeFilter(i)}
          />
        ))}
      </div>

      {/* Hidden serialized value for form submission */}
      <input type="hidden" name="filters" value={json} />
    </div>
  )
}
