import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useContactFormStore } from '@/lib/stores/contact-form-store'

describe('useContactFormStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useContactFormStore.setState(useContactFormStore.getInitialState())
    localStorage.clear()
  })

  it('starts at step 1 with empty form data', () => {
    const state = useContactFormStore.getState()
    expect(state.currentStep).toBe(1)
    expect(state.formData.first_name).toBe('')
    expect(state.formData.last_name).toBe('')
    expect(state.isDirty).toBe(false)
  })

  it('updates form data and marks as dirty', () => {
    useContactFormStore.getState().setFormData({ first_name: 'Juan' })
    const state = useContactFormStore.getState()
    expect(state.formData.first_name).toBe('Juan')
    expect(state.isDirty).toBe(true)
  })

  it('advances to next step', () => {
    useContactFormStore.getState().nextStep()
    expect(useContactFormStore.getState().currentStep).toBe(2)
  })

  it('goes back to previous step', () => {
    useContactFormStore.getState().nextStep()
    useContactFormStore.getState().nextStep()
    useContactFormStore.getState().prevStep()
    expect(useContactFormStore.getState().currentStep).toBe(2)
  })

  it('does not go below step 1', () => {
    useContactFormStore.getState().prevStep()
    expect(useContactFormStore.getState().currentStep).toBe(1)
  })

  it('does not go above max step for current level', () => {
    for (let i = 0; i < 10; i++) {
      useContactFormStore.getState().nextStep()
    }
    expect(useContactFormStore.getState().currentStep).toBe(4) // completo has 4 steps
  })

  it('sets step directly', () => {
    useContactFormStore.getState().setStep(3)
    expect(useContactFormStore.getState().currentStep).toBe(3)
  })

  it('clamps setStep to valid range for completo', () => {
    useContactFormStore.getState().setStep(10)
    expect(useContactFormStore.getState().currentStep).toBe(4)
    useContactFormStore.getState().setStep(0)
    expect(useContactFormStore.getState().currentStep).toBe(1)
  })

  it('resets form to initial state', () => {
    useContactFormStore.getState().setFormData({ first_name: 'Juan', phone: '3001234567' })
    useContactFormStore.getState().nextStep()
    useContactFormStore.getState().reset()
    const state = useContactFormStore.getState()
    expect(state.currentStep).toBe(1)
    expect(state.formData.first_name).toBe('')
    expect(state.isDirty).toBe(false)
  })

  it('marks as saved with timestamp', () => {
    useContactFormStore.getState().setFormData({ first_name: 'Juan' })
    expect(useContactFormStore.getState().isDirty).toBe(true)
    useContactFormStore.getState().markSaved()
    const state = useContactFormStore.getState()
    expect(state.isDirty).toBe(false)
    expect(state.lastSaved).toBeInstanceOf(Date)
  })

  it('loads initial data for edit mode', () => {
    useContactFormStore.getState().loadInitialData({
      first_name: 'María',
      last_name: 'López',
      phone: '3109876543',
      status: 'supporter',
    })
    const state = useContactFormStore.getState()
    expect(state.formData.first_name).toBe('María')
    expect(state.formData.last_name).toBe('López')
    expect(state.isDirty).toBe(false)
  })

  it('hasDraft returns true when there is dirty data', () => {
    expect(useContactFormStore.getState().hasDraft()).toBe(false)
    useContactFormStore.getState().setFormData({ first_name: 'Juan' })
    expect(useContactFormStore.getState().hasDraft()).toBe(true)
  })

  it('starts with completo contact level', () => {
    expect(useContactFormStore.getState().contactLevel).toBe('completo')
  })

  it('sets contact level and resets to step 1', () => {
    useContactFormStore.getState().nextStep()
    useContactFormStore.getState().nextStep()
    expect(useContactFormStore.getState().currentStep).toBe(3)

    useContactFormStore.getState().setContactLevel('opinion')
    expect(useContactFormStore.getState().contactLevel).toBe('opinion')
    expect(useContactFormStore.getState().currentStep).toBe(1)
  })

  it('limits steps to 3 for opinion level', () => {
    useContactFormStore.getState().setContactLevel('opinion')
    for (let i = 0; i < 10; i++) {
      useContactFormStore.getState().nextStep()
    }
    expect(useContactFormStore.getState().currentStep).toBe(3)
  })

  it('limits steps to 2 for anonimo level', () => {
    useContactFormStore.getState().setContactLevel('anonimo')
    for (let i = 0; i < 10; i++) {
      useContactFormStore.getState().nextStep()
    }
    expect(useContactFormStore.getState().currentStep).toBe(2)
  })

  it('totalSteps returns correct count per level', () => {
    expect(useContactFormStore.getState().totalSteps()).toBe(4) // completo
    useContactFormStore.getState().setContactLevel('opinion')
    expect(useContactFormStore.getState().totalSteps()).toBe(3)
    useContactFormStore.getState().setContactLevel('anonimo')
    expect(useContactFormStore.getState().totalSteps()).toBe(2)
  })

  it('reset restores contactLevel to completo', () => {
    useContactFormStore.getState().setContactLevel('anonimo')
    useContactFormStore.getState().reset()
    expect(useContactFormStore.getState().contactLevel).toBe('completo')
  })

  it('loadInitialData sets contact level', () => {
    useContactFormStore.getState().loadInitialData(
      { first_name: 'Test', last_name: 'User' },
      'opinion'
    )
    expect(useContactFormStore.getState().contactLevel).toBe('opinion')
    expect(useContactFormStore.getState().formData.first_name).toBe('Test')
  })

  it('loadInitialData defaults to completo when no level provided', () => {
    useContactFormStore.getState().setContactLevel('anonimo')
    useContactFormStore.getState().loadInitialData({ first_name: 'Test' })
    expect(useContactFormStore.getState().contactLevel).toBe('completo')
  })
})
