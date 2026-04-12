'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Save, Check, CheckCircle, Loader2 } from 'lucide-react'
import {
  contactFormSchema,
  stepEssentialsSchema,
  stepLocationSchema,
  stepPoliticalSchema,
  stepAdditionalSchema,
  type ContactForm,
} from '@/lib/schemas/contact-form'
import { useContactFormStore } from '@/lib/stores/contact-form-store'
import { StepEssentials } from './steps/StepEssentials'
import { StepLocation } from './steps/StepLocation'
import { StepPolitical } from './steps/StepPolitical'
import { StepAdditional } from './steps/StepAdditional'
import { ContactFormSidebar } from './ContactFormSidebar'

const STEPS = [
  { label: 'Datos básicos', schema: stepEssentialsSchema },
  { label: 'Ubicación', schema: stepLocationSchema },
  { label: 'Perfil político', schema: stepPoliticalSchema },
  { label: 'Adicional', schema: stepAdditionalSchema },
]

const STEP_FIELDS: Record<number, (keyof ContactForm)[]> = {
  1: ['first_name', 'last_name', 'document_type', 'document_number', 'phone', 'status', 'email', 'phone_alternate'],
  2: ['department', 'municipality', 'commune', 'district_barrio', 'sector', 'address', 'voting_place', 'voting_table'],
  3: ['political_affinity', 'vote_intention', 'electoral_priority', 'campaign_role', 'preferred_party'],
  4: ['birth_date', 'gender', 'marital_status', 'contact_source', 'source_detail', 'referred_by', 'mobilizes_count', 'main_need', 'economic_sector', 'beneficiary_program'],
}

interface Props {
  campaignId: string
  initialData?: Partial<ContactForm>
  contactId?: string
}

export function ContactFormWizard({ campaignId, initialData, contactId }: Props) {
  const router = useRouter()
  const store = useContactFormStore()
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSavedAgo, setLastSavedAgo] = useState<string | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const methods = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
    defaultValues: initialData ?? store.formData,
  })

  const currentStep = store.currentStep

  // Check for existing draft on mount
  useEffect(() => {
    if (!initialData && store.hasDraft() && store.formData.first_name) {
      setShowDraftBanner(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to store every 10s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      const values = methods.getValues()
      setAutoSaving(true)
      store.setFormData(values)
      store.markSaved()
      setTimeout(() => setAutoSaving(false), 800)
    }, 10000)
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update "saved X ago" label every 5s
  useEffect(() => {
    const update = () => {
      const last = store.lastSaved
      if (!last) { setLastSavedAgo(null); return }
      const seconds = Math.floor((Date.now() - new Date(last).getTime()) / 1000)
      if (seconds < 10) setLastSavedAgo('hace un momento')
      else if (seconds < 60) setLastSavedAgo(`hace ${seconds}s`)
      else setLastSavedAgo(`hace ${Math.floor(seconds / 60)}min`)
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }) // runs every render to pick up store.lastSaved changes

  const discardDraft = useCallback(() => {
    store.reset()
    methods.reset()
    setShowDraftBanner(false)
  }, [store, methods])

  const continueDraft = useCallback(() => {
    setShowDraftBanner(false)
  }, [])

  const goToStep = useCallback((step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    store.setStep(step)
  }, [currentStep, store])

  const nextStep = useCallback(async () => {
    const schema = STEPS[currentStep - 1]?.schema
    if (schema) {
      const values = methods.getValues()
      const result = schema.safeParse(values)
      if (!result.success) {
        await methods.trigger(STEP_FIELDS[currentStep])
        return
      }
    }
    // Sync to store
    store.setFormData(methods.getValues())
    setDirection(1)
    store.nextStep()
  }, [currentStep, methods, store])

  const prevStep = useCallback(() => {
    store.setFormData(methods.getValues())
    setDirection(-1)
    store.prevStep()
  }, [methods, store])

  const saveDraft = useCallback(async () => {
    store.setFormData(methods.getValues())
    store.markSaved()
    toast.success('Borrador guardado')
  }, [methods, store])

  const submitForm = useCallback(async () => {
    const values = methods.getValues()

    // Validate full schema
    const fullResult = contactFormSchema.safeParse(values)
    if (!fullResult.success) {
      const fields = fullResult.error.issues.map(i => i.path.join('.')).join(', ')
      await methods.trigger()
      toast.error(`Campos por completar: ${fields}`)
      return
    }

    setSaving(true)
    try {
      const url = contactId ? `/api/contacts/${contactId}` : '/api/contacts'
      const method = contactId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error === 'duplicate') {
          toast.error('Ya existe un contacto con ese número de documento')
        } else if (err.error === 'validation') {
          toast.error('Datos inválidos. Revisa los campos.')
        } else {
          toast.error('Error al guardar el contacto')
        }
        return
      }

      const data = await res.json()
      // Stop auto-save interval before reset to prevent it from restoring old data
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
        autoSaveRef.current = null
      }
      store.reset()
      methods.reset()
      toast.success(contactId ? 'Contacto actualizado' : 'Contacto creado')
      router.push(`/dashboard/contacts/${data.id ?? contactId}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }, [methods, contactId, store, router])

  const isLastStep = currentStep === 4

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Draft recovery banner */}
        {showDraftBanner && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-blue-700">
              Tienes un borrador sin guardar de <strong>{store.formData.first_name} {store.formData.last_name}</strong>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={discardDraft}>Descartar</Button>
              <Button size="sm" onClick={continueDraft}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <nav aria-label="Progreso del formulario" className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const stepNum = i + 1
            const isActive = stepNum === currentStep
            const isCompleted = stepNum < currentStep
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => isCompleted ? goToStep(stepNum) : undefined}
                disabled={!isCompleted && !isActive}
                className="flex items-center gap-2 flex-1"
              >
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded ${
                    isCompleted ? 'bg-emerald-300' : 'bg-slate-200'
                  }`} />
                )}
              </button>
            )
          })}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 min-h-[400px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: direction * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -30 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && <StepEssentials campaignId={campaignId} />}
                  {currentStep === 2 && <StepLocation />}
                  {currentStep === 3 && <StepPolitical />}
                  {currentStep === 4 && <StepAdditional campaignId={campaignId} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-3">
                {autoSaving ? (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Guardando...
                  </span>
                ) : lastSavedAgo ? (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    Borrador {lastSavedAgo}
                  </span>
                ) : null}

                <Button type="button" variant="ghost" onClick={saveDraft}>
                  <Save className="h-4 w-4 mr-1" />
                  Guardar borrador
                </Button>

                {isLastStep ? (
                  <Button type="button" onClick={submitForm} disabled={saving}>
                    {saving ? 'Guardando...' : (contactId ? 'Guardar cambios' : 'Guardar contacto')}
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep}>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <ContactFormSidebar currentStep={currentStep} />
        </div>
      </div>
    </FormProvider>
  )
}
