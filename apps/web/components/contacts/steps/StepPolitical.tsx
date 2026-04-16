'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AffinitySelector } from '@/components/contacts/selectors/AffinitySelector'
import { VoteIntentionSelector } from '@/components/contacts/selectors/VoteIntentionSelector'
import type { ContactForm } from '@/lib/schemas/contact-form'

export function StepPolitical() {
  const { setValue, watch } = useFormContext<ContactForm>()

  return (
    <div className="space-y-5">
      {/* Affinity */}
      <div className="space-y-1.5">
        <Label>Afinidad política</Label>
        <AffinitySelector
          value={watch('political_affinity') ?? null}
          onChange={(v) => setValue('political_affinity', v ?? undefined)}
        />
      </div>

      {/* Vote Intention */}
      <div className="space-y-1.5">
        <Label>Intención de voto</Label>
        <VoteIntentionSelector
          value={watch('vote_intention') ?? null}
          onChange={(v) => setValue('vote_intention', v ?? undefined)}
        />
      </div>

      {/* Electoral Priority — 3 segmented buttons */}
      <div className="space-y-1.5">
        <Label>Prioridad electoral</Label>
        <div className="flex gap-2">
          {(['alta', 'media', 'baja'] as const).map((priority) => {
            const selected = watch('electoral_priority') === priority
            const colors = {
              alta: 'bg-red-500 text-white ring-red-500/30',
              media: 'bg-yellow-400 text-gray-900 ring-yellow-400/30',
              baja: 'bg-slate-400 text-white ring-slate-400/30',
            }
            const labels = { alta: 'Alta', media: 'Media', baja: 'Baja' }
            return (
              <button
                key={priority}
                type="button"
                onClick={() => setValue('electoral_priority', selected ? undefined : priority)}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                  selected ? `${colors[priority]} ring-2 shadow-sm` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {labels[priority]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Campaign Role */}
      <div className="space-y-1.5">
        <Label htmlFor="campaign_role">Rol en campaña</Label>
        <Select
          value={watch('campaign_role') ?? ''}
          onValueChange={(v) => setValue('campaign_role', v as ContactForm['campaign_role'])}
        >
          <SelectTrigger id="campaign_role" className="w-full">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="votante">Votante</SelectItem>
            <SelectItem value="lider_barrial">Líder barrial</SelectItem>
            <SelectItem value="coordinador">Coordinador</SelectItem>
            <SelectItem value="voluntario">Voluntario</SelectItem>
            <SelectItem value="donante">Donante</SelectItem>
            <SelectItem value="testigo">Testigo electoral</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
