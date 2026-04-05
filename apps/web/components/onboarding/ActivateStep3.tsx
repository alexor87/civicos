'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'

interface ActivateStep3Data {
  plan: 'esencial' | 'profesional'
  electionDate: string
}

interface Props {
  data: ActivateStep3Data
  onChange: (data: ActivateStep3Data) => void
}

const PLANS = [
  {
    id: 'esencial' as const,
    name: 'Esencial',
    price: 'Gratis',
    priceNote: 'Para siempre',
    features: [
      'Hasta 1,000 contactos',
      'Canvassing básico',
      'Calendario de eventos',
      '1 usuario',
    ],
  },
  {
    id: 'profesional' as const,
    name: 'Profesional',
    price: '$149,000 COP',
    priceNote: '/mes',
    features: [
      'Contactos ilimitados',
      'Territorios + mapa en vivo',
      'Agentes IA + sugerencias',
      'Equipo ilimitado',
      'Comunicaciones (email + SMS)',
      'Analítica avanzada',
    ],
    popular: true,
  },
]

export function ActivateStep3({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Plan y fecha</h2>
        <p className="text-sm text-slate-500 mt-1">
          Elige tu plan y la fecha de las elecciones
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange({ ...data, plan: plan.id })}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              data.plan === plan.id
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 right-3 bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Popular
              </span>
            )}

            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-xs text-slate-400">{plan.priceNote}</span>
              </div>
            </div>

            <ul className="space-y-1.5">
              {plan.features.map(feat => (
                <li key={feat} className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {feat}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Election date */}
      <div className="space-y-2">
        <Label htmlFor="electionDate">Fecha de elección</Label>
        <Input
          id="electionDate"
          type="date"
          value={data.electionDate}
          onChange={e => onChange({ ...data, electionDate: e.target.value })}
        />
        <p className="text-xs text-slate-400">
          La plataforma te mostrará una cuenta regresiva y optimizará la agenda según esta fecha
        </p>
      </div>
    </div>
  )
}
