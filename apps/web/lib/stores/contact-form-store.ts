import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContactForm, ContactLevel } from '@/lib/schemas/contact-form'


const emptyFormData: ContactForm = {
  first_name: '',
  last_name: '',
  document_type: 'CC',
  document_number: '',
  phone: '',
  status: 'unknown',
  email: '',
  phone_alternate: '',
  department: '',
  municipality: '',
  commune: '',
  district_barrio: '',
  address: '',
  voting_place: '',
  voting_table: '',
  location_lat: null,
  location_lng: null,
  geocoding_status: 'pending',
  political_affinity: undefined,
  political_orientation: undefined,
  vote_intention: undefined,
  electoral_priority: undefined,
  campaign_role: undefined,
  birth_date: '',
  gender: undefined,
  marital_status: undefined,
  contact_source: undefined,
  source_detail: '',
  referred_by: '',
  mobilizes_count: undefined,
  main_need: '',
  economic_sector: '',
  beneficiary_program: '',
  tags: '',
  notes: '',
}

interface ContactFormState {
  currentStep: number
  contactLevel: ContactLevel
  formData: ContactForm
  isDirty: boolean
  lastSaved: Date | null

  setContactLevel: (level: ContactLevel) => void
  setFormData: (partial: Partial<ContactForm>) => void
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  reset: () => void
  markSaved: () => void
  loadInitialData: (data: Partial<ContactForm>, level?: ContactLevel) => void
  hasDraft: () => boolean
  totalSteps: () => number
}

const STEPS_PER_LEVEL: Record<ContactLevel, number> = {
  completo: 4,
  opinion: 3,
  anonimo: 2,
}

const initialState = {
  currentStep: 1,
  contactLevel: 'completo' as ContactLevel,
  formData: { ...emptyFormData },
  isDirty: false,
  lastSaved: null,
}

export const useContactFormStore = create<ContactFormState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setContactLevel: (level) =>
        set({ contactLevel: level, currentStep: 1 }),

      setFormData: (partial) =>
        set((state) => ({
          formData: { ...state.formData, ...partial },
          isDirty: true,
        })),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, STEPS_PER_LEVEL[state.contactLevel]),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      setStep: (step) =>
        set((state) => ({
          currentStep: Math.max(1, Math.min(step, STEPS_PER_LEVEL[state.contactLevel])),
        })),

      reset: () => set({ ...initialState, formData: { ...emptyFormData } }),

      markSaved: () => set({ isDirty: false, lastSaved: new Date() }),

      loadInitialData: (data, level) =>
        set({
          formData: { ...emptyFormData, ...data },
          contactLevel: level ?? 'completo',
          isDirty: false,
          currentStep: 1,
        }),

      hasDraft: () => get().isDirty,

      totalSteps: () => STEPS_PER_LEVEL[get().contactLevel],
    }),
    {
      name: 'scrutix-contact-draft',
      partialize: (state) => ({
        currentStep: state.currentStep,
        contactLevel: state.contactLevel,
        formData: state.formData,
        isDirty: state.isDirty,
      }),
    }
  )
)
