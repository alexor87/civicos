'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Campaign {
  id:              string
  name:            string
  candidate_name?: string | null
  election_type?:  string | null
  election_date?:  string | null
  key_topics?:     string[] | null
  description?:    string | null
  brand_color?:    string | null
}

interface Props {
  campaign: Campaign
}

const ELECTION_TYPES = [
  { value: 'municipal',  label: 'Municipal' },
  { value: 'regional',   label: 'Regional / Departamental' },
  { value: 'nacional',   label: 'Nacional' },
  { value: 'otro',       label: 'Otro' },
]

export function CampaignSettingsForm({ campaign }: Props) {
  const [name,          setName]          = useState(campaign.name ?? '')
  const [candidateName, setCandidateName] = useState(campaign.candidate_name ?? '')
  const [electionType,  setElectionType]  = useState(campaign.election_type  ?? '')
  const [electionDate,  setElectionDate]  = useState(campaign.election_date  ?? '')
  const [keyTopicsRaw,  setKeyTopicsRaw]  = useState((campaign.key_topics ?? []).join(', '))
  const [description,   setDescription]  = useState(campaign.description ?? '')
  const [brandColor,    setBrandColor]    = useState(campaign.brand_color ?? '#2960ec')
  const [saving,        setSaving]        = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const key_topics = keyTopicsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const res = await fetch('/api/settings/campaign', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        campaign_id:    campaign.id,
        name,
        candidate_name: candidateName || null,
        election_type:  electionType  || null,
        election_date:  electionDate  || null,
        key_topics,
        description:    description   || null,
        brand_color:    brandColor,
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
          {ELECTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Fecha de elección */}
      <div className="space-y-1.5">
        <Label htmlFor="election_date">Fecha de la elección</Label>
        <Input
          id="election_date"
          type="date"
          value={electionDate}
          onChange={e => setElectionDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Usada por los agentes IA para calcular la urgencia de las sugerencias
        </p>
      </div>

      {/* Temas clave */}
      <div className="space-y-1.5">
        <Label htmlFor="key_topics">Temas clave (separados por coma)</Label>
        <Input
          id="key_topics"
          value={keyTopicsRaw}
          onChange={e => setKeyTopicsRaw(e.target.value)}
          placeholder="Ej: empleo, seguridad, educación, transporte"
        />
        <p className="text-xs text-muted-foreground">
          Los agentes IA usan estos temas para generar contenido alineado con tu campaña
        </p>
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

      {/* Color de marca */}
      <div className="space-y-1.5">
        <Label htmlFor="brand_color">Color de marca</Label>
        <div className="flex items-center gap-3">
          <input
            id="brand_color"
            type="color"
            value={brandColor}
            onChange={e => setBrandColor(e.target.value)}
            className="h-9 w-14 rounded-md border border-input cursor-pointer"
          />
          <span className="text-sm text-muted-foreground font-mono">{brandColor}</span>
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
