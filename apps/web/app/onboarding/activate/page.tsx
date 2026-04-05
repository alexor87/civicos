'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ChevronLeft, ChevronRight, Loader2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivateStep1 } from '@/components/onboarding/ActivateStep1'
import { ActivateStep2 } from '@/components/onboarding/ActivateStep2'
import { ActivateStep3 } from '@/components/onboarding/ActivateStep3'

interface WizardData {
  // Step 1
  electionType: string
  candidateName: string
  // Step 2
  departmentCode: string | null
  municipalityCode: string | null
  departmentName: string
  municipalityName: string
  // Step 3
  plan: 'esencial' | 'profesional'
  electionDate: string
}

const INITIAL_DATA: WizardData = {
  electionType: '',
  candidateName: '',
  departmentCode: null,
  municipalityCode: null,
  departmentName: '',
  municipalityName: '',
  plan: 'profesional',
  electionDate: '',
}

const STEP_TITLES = [
  { title: 'Tipo de cargo', subtitle: 'Selecciona el cargo y nombre del candidato' },
  { title: 'Territorio', subtitle: 'Define el ámbito geográfico de tu campaña' },
  { title: 'Plan y fecha', subtitle: 'Elige tu plan y configura la fecha de elección' },
]

export default function ActivatePage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const canAdvance = [
    // Step 1: need election type and candidate name
    data.electionType && data.candidateName.trim(),
    // Step 2: need department and municipality
    data.departmentCode && data.municipalityCode,
    // Step 3: always valid (plan has default, date optional)
    true,
  ]

  async function handleActivate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al activar')

      // Redirect to success page → then to branding wizard
      router.push('/onboarding/success')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2960ec] flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Scrutix</span>
          <span className="text-slate-300 mx-2">|</span>
          <span className="text-sm text-slate-500">Activar campaña real</span>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 font-medium">
            Paso {step + 1} de 3
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full">
          <div
            className="h-1.5 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {step === 0 && (
          <ActivateStep1
            data={data}
            onChange={d => setData(prev => ({ ...prev, ...d }))}
          />
        )}
        {step === 1 && (
          <ActivateStep2
            data={data}
            onChange={d => setData(prev => ({ ...prev, ...d }))}
          />
        )}
        {step === 2 && (
          <ActivateStep3
            data={data}
            onChange={d => setData(prev => ({ ...prev, ...d }))}
          />
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => step === 0 ? router.push('/dashboard') : setStep(s => s - 1)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? 'Volver al dashboard' : 'Anterior'}
          </Button>

          {step < 2 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance[step]}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={loading}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Enviar para revisión
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
