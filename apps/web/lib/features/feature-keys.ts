/**
 * Type-safe feature flag keys matching platform_features.key in DB.
 * Single source of truth for both frontend and server-side code.
 */

export const FEATURE_KEYS = {
  GOOGLE_MAPS_GEOCODING: 'google_maps_geocoding',
  GOOGLE_MAPS_MONTHLY_LIMIT: 'google_maps_monthly_limit',
  TERRITORY_MAP: 'territory_map',
  AI_BYO_KEY: 'ai_byo_key',
  AI_PROVIDERS: 'ai_providers',
  ACTIVE_AGENTS: 'active_agents',
  AGENT_MODEL_OVERRIDE: 'agent_model_override',
  KNOWLEDGE_BASE: 'knowledge_base',
  OPERATIONS_MODULE: 'operations_module',
  CALENDAR_INTELLIGENCE: 'calendar_intelligence',
  FLOWS_MODULE: 'flows_module',
  CONTACT_EXPORT_CSV: 'contact_export_csv',
  CONTACT_IMPORT_CSV: 'contact_import_csv',
  WHATSAPP_CHANNEL: 'whatsapp_channel',
  CONTACT_LIMIT: 'contact_limit',
  TEAM_MEMBER_LIMIT: 'team_member_limit',
  CUSTOM_ROLES: 'custom_roles',
  DEMO_DATA: 'demo_data',
} as const

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS]

/** Map of feature keys to their resolved value types */
export type FeatureValueMap = {
  google_maps_geocoding: boolean
  google_maps_monthly_limit: number
  territory_map: boolean
  ai_byo_key: boolean
  ai_providers: string[]
  active_agents: number
  agent_model_override: boolean
  knowledge_base: boolean
  operations_module: boolean
  calendar_intelligence: boolean
  flows_module: boolean
  contact_export_csv: boolean
  contact_import_csv: boolean
  whatsapp_channel: boolean
  contact_limit: number
  team_member_limit: number
  custom_roles: boolean
  demo_data: boolean
}

export type PlanName = 'esencial' | 'pro' | 'campaign' | 'enterprise'
