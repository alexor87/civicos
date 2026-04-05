'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COLOMBIA_ELECTION_TYPES } from '@/lib/election-types'

interface ActivateStep1Data {
  electionType: string
  candidateName: string
}

interface Props {
  data: ActivateStep1Data
  onChange: (data: ActivateStep1Data) => void
}

export function ActivateStep1({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Tipo de cargo</h2>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona el cargo al que aspira tu candidato
        </p>
      </div>

      {/* Election type grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {COLOMBIA_ELECTION_TYPES.map(type => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange({ ...data, electionType: type.value })}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              data.electionType === type.value
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span className="text-sm font-medium">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Candidate name */}
      <div className="space-y-2">
        <Label htmlFor="candidateName">Nombre del candidato</Label>
        <Input
          id="candidateName"
          placeholder="María García López"
          value={data.candidateName}
          onChange={e => onChange({ ...data, candidateName: e.target.value })}
        />
        <p className="text-xs text-slate-400">
          El nombre que aparecerá en la plataforma y materiales de campaña
        </p>
      </div>
    </div>
  )
}
