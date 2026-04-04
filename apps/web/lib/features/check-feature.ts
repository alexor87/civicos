import type { SupabaseClient } from '@supabase/supabase-js'
import type { FeatureKey } from './feature-keys'

/**
 * Server-side feature check via RPC.
 * Use in server components, server actions, and API routes.
 */
export async function checkFeature(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const { data } = await supabase.rpc('resolve_tenant_feature', {
    p_tenant_id: tenantId,
    p_feature_key: featureKey,
  })

  if (!data || !Array.isArray(data) || data.length === 0) return false

  const val = data[0].resolved_value
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  if (typeof val === 'string') return val === 'true'
  if (Array.isArray(val)) return val.length > 0
  return Boolean(val)
}

/**
 * Get the raw resolved value for a feature.
 */
export async function getFeatureValue<T = unknown>(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: FeatureKey
): Promise<T | null> {
  const { data } = await supabase.rpc('resolve_tenant_feature', {
    p_tenant_id: tenantId,
    p_feature_key: featureKey,
  })

  if (!data || !Array.isArray(data) || data.length === 0) return null
  return data[0].resolved_value as T
}
