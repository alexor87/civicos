import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContactForm } from '@/lib/schemas/contact-form'

const TOTAL_STEPS = 4

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
  vote_intention: undefined,
  electoral_priority: undefined,
  campaign_role: undefined,
  preferred_party: '',
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
  formData: ContactForm
  isDirty: boolean
  lastSaved: Date | null

  setFormData: (partial: Partial<ContactForm>) => void
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  reset: () => void
  markSaved: () => void
  loadInitialData: (data: Partial<ContactForm>) => void
  hasDraft: () => boolean
}

const initialState = {
  currentStep: 1,
  formData: { ...emptyFormData },
  isDirty: false,
  lastSaved: null,
}

export const useContactFormStore = create<ContactFormState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFormData: (partial) =>
        set((state) => ({
          formData: { ...state.formData, ...partial },
          isDirty: true,
        })),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      setStep: (step) =>
        set(() => ({
          currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)),
        })),

      reset: () => set({ ...initialState, formData: { ...emptyFormData } }),

      markSaved: () => set({ isDirty: false, lastSaved: new Date() }),

      loadInitialData: (data) =>
        set({
          formData: { ...emptyFormData, ...data },
          isDirty: false,
          currentStep: 1,
        }),

      hasDraft: () => get().isDirty,
    }),
    {
      name: 'scrutix-contact-draft',
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        isDirty: state.isDirty,
      }),
    }
  )
)
