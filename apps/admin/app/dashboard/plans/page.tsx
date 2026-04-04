import { createAdminClient } from '@/lib/supabase/admin'
import { PlanFeatureMatrix } from '@/components/admin/PlanFeatureMatrix'

const PLANS = ['esencial', 'pro', 'campaign', 'enterprise'] as const

export default async function PlansPage() {
  const supabase = createAdminClient()

  const [featuresRes, planFeaturesRes] = await Promise.all([
    supabase.from('platform_features').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('plan_features').select('*'),
  ])

  const features = featuresRes.data ?? []
  const planFeatures = planFeaturesRes.data ?? []

  // Build matrix: { featureKey: { plan: value } }
  const matrix: Record<string, Record<string, unknown>> = {}
  for (const pf of planFeatures) {
    if (!matrix[pf.feature_key]) matrix[pf.feature_key] = {}
    matrix[pf.feature_key][pf.plan] = pf.value
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planes y Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">Define qué puede hacer cada plan sin tocar código</p>
      </div>

      <PlanFeatureMatrix
        features={features}
        matrix={matrix}
        plans={[...PLANS]}
      />
    </div>
  )
}
