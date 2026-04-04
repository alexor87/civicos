import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BrandProvider } from '@/components/dashboard/BrandProvider'
import { PermissionsProvider } from '@/components/providers/PermissionsProvider'
import { brandFromColor, type TenantBrand } from '@/lib/brand-utils'
import { Toaster } from '@/components/ui/sonner'
import { FeaturesProvider } from '@/components/providers/FeaturesProvider'
import { ImpersonationBanner } from '@/components/impersonation/ImpersonationBanner'
import type { PlanName } from '@/lib/features/feature-keys'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile and tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenants(name, slug, plan)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login?error=no-profile')
  }

  // Fetch tenant branding (source of truth for brand identity)
  const { data: tenantBranding } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single()

  // Redirect to Brand Studio onboarding if not yet completed
  if (tenantBranding && tenantBranding.onboarding_completed === false) {
    redirect('/onboarding')
  }

  // Determine active campaign (cookie > first in array)
  const cookieStore = await cookies()
  const cookieCampaignId = cookieStore.get('active_campaign_id')?.value
  const campaignIds: string[] = profile.campaign_ids ?? []
  const activeCampaignId = (cookieCampaignId && campaignIds.includes(cookieCampaignId))
    ? cookieCampaignId
    : campaignIds[0] ?? ''

  // Fetch all user campaigns for the switcher
  let allCampaigns: { id: string; name: string }[] = []
  if (campaignIds.length > 0) {
    const { data } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('id', campaignIds)
      .order('name')
    allCampaigns = data ?? []
  }

  const campaignName = allCampaigns.find(c => c.id === activeCampaignId)?.name ?? 'Sin campaña'
  const firstCampaignId = activeCampaignId

  // Build effective brand — tenant_branding takes priority; fallback to defaults
  const effectiveBrand: TenantBrand = tenantBranding
    ? {
        color_primary:       tenantBranding.color_primary    ?? '#2960ec',
        color_secondary:     tenantBranding.color_secondary  ?? '#1e293b',
        color_accent:        tenantBranding.color_accent      ?? '#ea580c',
        color_background:    tenantBranding.color_background  ?? '#f8fafc',
        color_surface:       tenantBranding.color_surface     ?? '#ffffff',
        logo_url:            tenantBranding.logo_url,
        candidate_photo_url: tenantBranding.candidate_photo_url,
        slogan:              tenantBranding.slogan,
        candidate_name:      tenantBranding.candidate_name,
        candidate_role:      tenantBranding.candidate_role,
      }
    : brandFromColor('#2960ec')

  // Determine which image shows in the sidebar (candidate_photo preferred over logo)
  const sidebarPhotoUrl = effectiveBrand.candidate_photo_url ?? effectiveBrand.logo_url ?? null

  // Calculate user initials from full_name
  const userInitials = profile.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const tenantName = (profile.tenants as { name: string } | null)?.name ?? 'CivicOS'
  const tenantPlan = ((profile.tenants as { plan?: string } | null)?.plan ?? 'esencial') as PlanName

  // Resolve feature flags for the tenant
  const { data: resolvedFeatures } = await supabase.rpc('resolve_all_tenant_features', {
    p_tenant_id: profile.tenant_id,
    p_plan: tenantPlan,
  })
  const features: Record<string, unknown> = {}
  if (resolvedFeatures && Array.isArray(resolvedFeatures)) {
    for (const row of resolvedFeatures) {
      features[row.feature_key] = row.resolved_value
    }
  }

  // Active suggestion count for the realtime badge
  const { count: suggestionCount } = await supabase
    .from('ai_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', firstCampaignId)
    .in('status', ['active', 'pending_approval']) as { count: number }

  return (
    <>
    <ImpersonationBanner />
    <BrandProvider brand={effectiveBrand}>
      <FeaturesProvider features={features} plan={tenantPlan}>
      <PermissionsProvider
        userRole={profile.role}
        customRoleId={profile.custom_role_id ?? null}
        tenantId={profile.tenant_id}
      >
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          tenantName={tenantName}
          campaignName={campaignName}
          userFullName={profile.full_name}
          userRole={profile.role}
          userInitials={userInitials}
          campaignId={firstCampaignId}
          suggestionCount={suggestionCount ?? 0}
          brandColor={effectiveBrand.color_primary}
          slogan={effectiveBrand.slogan ?? null}
          logoUrl={sidebarPhotoUrl}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader
            campaignName={campaignName}
            userFullName={profile.full_name}
            userInitials={userInitials}
            userRole={profile.role}
            campaigns={allCampaigns}
            activeCampaignId={activeCampaignId}
          />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
      </PermissionsProvider>
      </FeaturesProvider>
    </BrandProvider>
    </>
  )
}
