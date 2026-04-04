import { describe, it, expect } from 'vitest'
import { FEATURE_KEYS } from '@/lib/features/feature-keys'
import type { FeatureKey, PlanName } from '@/lib/features/feature-keys'

describe('FEATURE_KEYS', () => {
  it('is a frozen (as const) object with string values', () => {
    const keys = Object.keys(FEATURE_KEYS)
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      expect(typeof (FEATURE_KEYS as Record<string, string>)[k]).toBe('string')
    }
  })

  it('contains all expected feature keys', () => {
    const expectedKeys = [
      'GOOGLE_MAPS_GEOCODING',
      'GOOGLE_MAPS_MONTHLY_LIMIT',
      'TERRITORY_MAP',
      'AI_BYO_KEY',
      'AI_PROVIDERS',
      'ACTIVE_AGENTS',
      'AGENT_MODEL_OVERRIDE',
      'KNOWLEDGE_BASE',
      'OPERATIONS_MODULE',
      'CALENDAR_INTELLIGENCE',
      'FLOWS_MODULE',
      'CONTACT_EXPORT_CSV',
      'CONTACT_IMPORT_CSV',
      'WHATSAPP_CHANNEL',
      'CONTACT_LIMIT',
      'TEAM_MEMBER_LIMIT',
      'CUSTOM_ROLES',
      'DEMO_DATA',
    ]

    for (const key of expectedKeys) {
      expect(FEATURE_KEYS).toHaveProperty(key)
    }
  })

  it('maps UPPERCASE keys to snake_case values', () => {
    expect(FEATURE_KEYS.GOOGLE_MAPS_GEOCODING).toBe('google_maps_geocoding')
    expect(FEATURE_KEYS.TERRITORY_MAP).toBe('territory_map')
    expect(FEATURE_KEYS.AI_PROVIDERS).toBe('ai_providers')
    expect(FEATURE_KEYS.CONTACT_LIMIT).toBe('contact_limit')
    expect(FEATURE_KEYS.DEMO_DATA).toBe('demo_data')
  })

  it('has unique values (no duplicates)', () => {
    const values = Object.values(FEATURE_KEYS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it('FeatureKey type accepts valid feature key values', () => {
    const key: FeatureKey = 'google_maps_geocoding'
    expect(key).toBe('google_maps_geocoding')
  })

  it('PlanName type accepts valid plan names', () => {
    const plans: PlanName[] = ['esencial', 'pro', 'campaign', 'enterprise']
    expect(plans).toHaveLength(4)
  })
})
