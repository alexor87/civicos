'use client'

import { useState } from 'react'
import { User, MapPin, Shield, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Sympathy slider ──────────────────────────────────────────────────────────

const SYMPATHY_LEVELS = [
  { min: 0,  max: 25,  status: 'opponent',  label: 'Opositor',      color: 'text-red-600' },
  { min: 26, max: 50,  status: 'unknown',   label: 'Desconocido',   color: 'text-slate-500' },
  { min: 51, max: 75,  status: 'undecided', label: 'Indeciso',      color: 'text-amber-600' },
  { min: 76, max: 100, status: 'supporter', label: 'Fiel Seguidor', color: 'text-emerald-600' },
]

const STATUS_TO_VALUE: Record<string, number> = {
  opponent: 12,
  unknown:  38,
  undecided: 63,
  supporter: 88,
}

function getSympathyLevel(value: number) {
  return SYMPATHY_LEVELS.find(l => value >= l.min && value <= l.max) ?? SYMPATHY_LEVELS[1]
}

function SympathySlider({ initialStatus = 'unknown' }: { initialStatus?: string }) {
  const [value, setValue] = useState(STATUS_TO_VALUE[initialStatus] ?? 38)
  const level = getSympathyLevel(value)
  const pct = value

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Nivel de Simpatía
        </Label>
        <span className={`text-sm font-semibold ${level.color}`}>
          {pct}% ({level.label})
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-slate-900"
          style={{
            background: `linear-gradient(to right, #0f172a ${pct}%, #e2e8f0 ${pct}%)`,
          }}
        />
      </div>
      {/* Hidden input carries the status value to the server action */}
      <input type="hidden" name="status" value={level.status} />
    </div>
  )
}

// ── Tags input ───────────────────────────────────────────────────────────────

function TagsInput({ initialTags = [] }: { initialTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState('')

  function addTag() {
    const tag = input.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-2">
      {/* Hidden input carries comma-separated tags */}
      <input type="hidden" name="tags" value={tags.join(',')} />

      {/* Chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-slate-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add tag input */}
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: Voto Seguro"
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <Plus className="h-3 w-3" />
          Agregar Tag
        </button>
      </div>
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <span className="text-slate-500">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Grid helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

interface ContactFormFieldsProps {
  initialData?: {
    first_name?: string
    last_name?: string
    document_type?: string
    document_number?: string
    phone?: string
    email?: string
    birth_date?: string
    gender?: string
    address?: string
    city?: string
    district?: string
    voting_place?: string
    status?: string
    tags?: string[]
    notes?: string
  }
  zones?: string[]
}

export function ContactFormFields({ initialData, zones = [] }: ContactFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* 1 — Información Personal */}
      <FormSection icon={<User className="h-4 w-4" />} title="Información Personal">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <Input name="first_name" placeholder="Ej: Juan" defaultValue={initialData?.first_name ?? ''} required />
          </Field>
          <Field label="Apellido" required>
            <Input name="last_name" placeholder="Ej: Pérez" defaultValue={initialData?.last_name ?? ''} required />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Tipo Doc." required>
            <Select name="document_type" defaultValue={initialData?.document_type ?? ''} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC">CC</SelectItem>
                <SelectItem value="CE">CE</SelectItem>
                <SelectItem value="TI">TI</SelectItem>
                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                <SelectItem value="DNI">DNI</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Número" required>
            <Input name="document_number" placeholder="00000000" defaultValue={initialData?.document_number ?? ''} required />
          </Field>
          <Field label="Teléfono" required>
            <Input name="phone" type="tel" placeholder="+51 900 000 000" defaultValue={initialData?.phone ?? ''} required />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Email">
            <Input name="email" type="email" placeholder="juan.perez@ejemplo.com" defaultValue={initialData?.email ?? ''} />
          </Field>
          <Field label="F. Nacimiento">
            <Input name="birth_date" type="date" defaultValue={initialData?.birth_date ?? ''} />
          </Field>
          <Field label="Sexo / Género">
            <Select name="gender" defaultValue={initialData?.gender ?? ''}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="NB">No binario</SelectItem>
                <SelectItem value="NE">Prefiero no decir</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      {/* 2 — Ubicación Territorial */}
      <FormSection icon={<MapPin className="h-4 w-4" />} title="Ubicación Territorial">
        <Field label="Dirección Exacta">
          <Input name="address" placeholder="Calle, número, urbanización..." defaultValue={initialData?.address ?? ''} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ciudad / Distrito">
            <Input name="city" placeholder="Ej: Miraflores" defaultValue={initialData?.city ?? ''} />
          </Field>
          <Field label="Zona Electoral">
            {zones.length > 0 ? (
              <Select name="commune" defaultValue={initialData?.district ?? ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input name="commune" placeholder="Ej: Sector 04 - Norte" defaultValue={initialData?.district ?? ''} />
            )}
          </Field>
        </div>

        <Field label="Local de Votación Sugerido">
          <div className="relative">
            <Input
              name="voting_place"
              placeholder="I.E. Ricardo Palma - Pabellón A"
              defaultValue={initialData?.voting_place ?? ''}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600 tracking-wide">
              AUTOMÁTICO
            </span>
          </div>
        </Field>
      </FormSection>

      {/* 3 — Perfil Político y Notas */}
      <FormSection icon={<Shield className="h-4 w-4" />} title="Perfil Político y Notas">
        <SympathySlider initialStatus={initialData?.status ?? 'unknown'} />

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Tags de Segmentación
          </Label>
          <TagsInput initialTags={initialData?.tags ?? []} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Notas de Campo
          </Label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Observaciones sobre su última interacción..."
            defaultValue={initialData?.notes ?? ''}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 resize-none"
          />
        </div>
      </FormSection>
    </div>
  )
}
