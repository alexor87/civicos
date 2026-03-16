export const DEFAULT_AGENT_THRESHOLDS = {
  visit_drop_pct: 20,
  coverage_low_pct: 40,
  inactive_volunteers_min: 3,
  inactive_contact_days: 30,
  stale_draft_days: 7,
} as const

export type AgentThresholds = {
  visit_drop_pct: number
  coverage_low_pct: number
  inactive_volunteers_min: number
  inactive_contact_days: number
  stale_draft_days: number
}

export function resolveThresholds(config: unknown): AgentThresholds {
  const cfg = (config as Record<string, unknown> | null) ?? {}
  const stored = (cfg.agent_thresholds as Partial<AgentThresholds> | null) ?? {}
  return { ...DEFAULT_AGENT_THRESHOLDS, ...stored }
}
