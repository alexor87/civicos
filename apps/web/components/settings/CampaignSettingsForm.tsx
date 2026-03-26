'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChipSelector } from '@/components/contacts/selectors/ChipSelector'
import { COLOMBIA_ELECTION_TYPES } from '@/lib/election-types'
import { Loader2, ChevronDown, Sparkles, Mail, Clock } from 'lucide-react'

interface Campaign {
  id:              string
  name:            string
  candidate_name?: string | null
  election_type?:  string | null
  election_date?:  string | null
  key_topics?:     string[] | null
  description?:    string | null
}

interface Props {
  campaign: Campaign
}

// ── Temas clave predefinidos para campañas en Colombia ──────────────────────
const KEY_TOPICS = [
  // Economía y trabajo
  'Empleo y trabajo', 'Emprendimiento', 'Desarrollo económico', 'Agricultura y campo',
  // Servicios y bienestar
  'Salud', 'Educación', 'Vivienda', 'Servicios públicos',
  // Seguridad y convivencia
  'Seguridad ciudadana', 'Convivencia y paz', 'Justicia y transparencia',
  // Ciudad y territorio
  'Vías e infraestructura', 'Transporte público', 'Medio ambiente', 'Espacio público',
  // Comunidad
  'Juventud', 'Mujer y género', 'Adulto mayor', 'Comunidades étnicas',
]

function getElectionCountdown(dateStr: string | null | undefined): { days: number; color: string } | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { days: diff, color: 'text-slate-400' }
  if (diff < 15) return { days: diff, color: 'text-red-600' }
  if (diff < 30) return { days: diff, color: 'text-orange-500' }
  if (diff < 90) return { days: diff, color: 'text-yellow-600' }
  return { days: diff, color: 'text-emerald-600' }
}

export function CampaignSettingsForm({ campaign }: Props) {
  const [name,          setName]          = useState(campaign.name ?? '')
  const [candidateName, setCandidateName] = useState(campaign.candidate_name ?? '')
  const [electionType,  setElectionType]  = useState(campaign.election_type  ?? '')
  const [electionDate,  setElectionDate]  = useState(campaign.election_date  ?? '')
  const [keyTopics,     setKeyTopics]     = useState<string[]>(campaign.key_topics ?? [])
  const [customTopic,   setCustomTopic]   = useState('')
  const [description,   setDescription]   = useState(campaign.description ?? '')
  const [saving,        setSaving]        = useState(false)
  const [aiInfoOpen,    setAiInfoOpen]    = useState(false)

  const countdown = getElectionCountdown(electionDate)

  const handleTopicsChange = (newTopics: string[]) => {
    // Max 5 topics
    if (newTopics.length <= 5) {
      setKeyTopics(newTopics)
    }
  }

  const handleAddCustomTopic = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = customTopic.trim()
      if (trimmed && !keyTopics.includes(trimmed) && keyTopics.length < 5) {
        setKeyTopics([...keyTopics, trimmed])
        setCustomTopic('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/settings/campaign', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        campaign_id:    campaign.id,
        name,
        candidate_name: candidateName || null,
        election_type:  electionType  || null,
        election_date:  electionDate  || null,
        key_topics:     keyTopics,
        description:    description   || null,
      }),
    })

    setSaving(false)

    if (res.ok) {
      toast.success('Configuración guardada correctamente')
    } else {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Error al guardar la configuración')
    }
  }

  // Merge predefined + any custom topics that are already selected but not in the predefined list
  const allChipOptions = [
    ...KEY_TOPICS,
    ...keyTopics.filter(t => !KEY_TOPICS.includes(t)),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Nombre de la campaña */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre de la campaña</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Campaña Alcaldía 2026"
          required
        />
      </div>

      {/* Nombre del candidato */}
      <div className="space-y-1.5">
        <Label htmlFor="candidate_name">Nombre del candidato / candidata</Label>
        <Input
          id="candidate_name"
          value={candidateName}
          onChange={e => setCandidateName(e.target.value)}
          placeholder="Ej: María López"
        />
        <p className="text-xs text-muted-foreground">
          Usado por los agentes IA para personalizar el contenido
        </p>
      </div>

      {/* Tipo de elección */}
      <div className="space-y-1.5">
        <Label htmlFor="election_type">Tipo de elección</Label>
        <select
          id="election_type"
          value={electionType}
          onChange={e => setElectionType(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seleccionar tipo…</option>
          {COLOMBIA_ELECTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Fecha de elección + Countdown */}
      <div className="space-y-1.5">
        <Label htmlFor="election_date">Fecha de la elección</Label>
        <Input
          id="election_date"
          type="date"
          value={electionDate}
          onChange={e => setElectionDate(e.target.value)}
        />
        {countdown && (
          <p className={`text-sm font-medium ${countdown.color}`}>
            {countdown.days > 0
              ? `Faltan ${countdown.days} días para la elección`
              : countdown.days === 0
                ? 'La elección es hoy'
                : `La elección fue hace ${Math.abs(countdown.days)} días`
            }
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Usada por los agentes IA para calcular la urgencia de las sugerencias
        </p>
      </div>

      {/* Temas clave — ChipSelector */}
      <div className="space-y-3">
        <div>
          <Label>Temas clave de la campaña</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona hasta 5 temas. La IA usa estos temas para generar contenido alineado con tu campaña.
          </p>
        </div>
        <ChipSelector
          options={allChipOptions}
          value={keyTopics}
          onChange={handleTopicsChange}
          label="Temas clave"
        />
        <Input
          value={customTopic}
          onChange={e => setCustomTopic(e.target.value)}
          onKeyDown={handleAddCustomTopic}
          placeholder="Agregar tema personalizado (Enter para añadir)"
          disabled={keyTopics.length >= 5}
        />
        {keyTopics.length >= 5 && (
          <p className="text-xs text-amber-600">Máximo 5 temas seleccionados</p>
        )}
      </div>

      {/* Descripción / propuesta */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Propuesta política / descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe brevemente los ejes de la campaña, valores y propuestas principales…"
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          Contexto que el motor de IA utiliza para personalizar sugerencias y generar contenido
        </p>
      </div>

      {/* Acordeón: ¿Cómo usa la IA esta información? */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setAiInfoOpen(!aiInfoOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            ¿Cómo usa la IA esta información?
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${aiInfoOpen ? 'rotate-180' : ''}`} />
        </button>
        {aiInfoOpen && (
          <div className="px-4 pb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Sugerencias personalizadas
              </p>
              <p className="text-xs text-slate-500">
                Los agentes IA usan el nombre del candidato y los temas para generar recomendaciones específicas para tu campaña.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                Contenido de comunicaciones
              </p>
              <p className="text-xs text-slate-500">
                El motor de comunicaciones usa la propuesta política para redactar mensajes alineados con los valores de tu campaña.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Urgencia de alertas
              </p>
              <p className="text-xs text-slate-500">
                La fecha de elección determina qué tan urgentes son las alertas y sugerencias del sistema.
              </p>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
