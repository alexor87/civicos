import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { SidebarProvider } from '@/components/dashboard/SidebarContext'
import { BrandProvider } from '@/components/dashboard/BrandProvider'
import { PermissionsProvider } from '@/components/providers/PermissionsProvider'
import { brandFromColor, type TenantBrand } from '@/lib/brand-utils'
import { Toaster } from '@/components/ui/sonner'
import { FeaturesProvider } from '@/components/providers/FeaturesProvider'
import { ImpersonationBanner } from '@/components/impersonation/ImpersonationBanner'
import { DemoBanner } from '@/components/onboarding/DemoBanner'
import { DemoCoachMarks } from '@/components/onboarding/DemoCoachMarks'
import type { PlanName } from '@/lib/features/feature-keys'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile (no tenants embed — we resolve the active tenant separately
  // because in multi-tenant the active tenant may differ from the home tenant).
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login?error=no-profile')
  }

  const homeTenantId = profile.tenant_id as string
  const activeTenantId = (profile.active_tenant_id as string | null) ?? homeTenantId

  // Active tenant data (name/plan drive UI). RLS scopes by JWT.tenant_id which
  // mirrors active_tenant_id, so this is the right source.
  const { data: activeTenant } = await supabase
    .from('tenants')
    .select('name, plan')
    .eq('id', activeTenantId)
    .single()
  const tenantName = (activeTenant as { name: string } | null)?.name ?? 'Scrutix'
  const tenantPlan = ((activeTenant as { plan?: string } | null)?.plan ?? 'esencial') as PlanName

  // Cross-tenant campaigns dropdown — fetched via admin client (service role)
  // strictly scoped by user_id. RLS on campaigns is single-tenant scoped, so we
  // cannot use the user's session client to list campaigns from other tenants.
  const admin = createAdminClient()
  const { data: memberships } = await admin
    .from('tenant_users')
    .select('tenant_id, campaign_ids, created_at, tenants(id, name)')
    .eq('user_id', user.id)

  const allCampaignIds = Array.from(
    new Set(((memberships ?? []) as Array<{ campaign_ids: string[] | null }>).flatMap(m => m.campaign_ids ?? []))
  )

  const cookieStore = await cookies()
  const cookieCampaignId = cookieStore.get('active_campaign_id')?.value

  const [
    { data: tenantBranding },
    { data: onboardingState },
    { data: campaignsData },
    { data: resolvedFeatures },
  ] = await Promise.all([
    supabase.from('tenant_branding').select('*').eq('tenant_id', activeTenantId).single(),
    supabase.from('onboarding_state').select('stage').eq('tenant_id', activeTenantId).single(),
    allCampaignIds.length > 0
      ? admin.from('campaigns').select('id, name, tenant_id').in('id', allCampaignIds).order('name')
      : Promise.resolve({ data: [] as { id: string; name: string; tenant_id: string }[] }),
    supabase.rpc('resolve_all_tenant_features', { p_tenant_id: activeTenantId, p_plan: tenantPlan }),
  ])

  // Decorate campaigns with tenant_name + is_new_tenant for the grouped dropdown.
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  type Membership = { tenant_id: string; campaign_ids: string[] | null; created_at: string; tenants: { name: string } | null }
  const enrichedCampaigns = ((campaignsData ?? []) as Array<{ id: string; name: string; tenant_id: string }>).map(c => {
    const m = (memberships as Membership[] | null)?.find(x => x.tenant_id === c.tenant_id)
    const tenantNameForCampaign = m?.tenants?.name ?? ''
    const createdAt = m?.created_at ? new Date(m.created_at).getTime() : 0
    const isNewTenant = m ? createdAt > sevenDaysAgo && m.tenant_id !== homeTenantId : false
    return { id: c.id, name: c.name, tenant_id: c.tenant_id, tenant_name: tenantNameForCampaign, is_new_tenant: isNewTenant }
  })

  // Resolve active campaign: prefer cookie if still valid; else first campaign of active tenant; else first overall.
  const validCampaignIds = enrichedCampaigns.map(c => c.id)
  const activeCampaignId = (cookieCampaignId && validCampaignIds.includes(cookieCampaignId))
    ? cookieCampaignId
    : (enrichedCampaigns.find(c => c.tenant_id === activeTenantId)?.id ?? enrichedCampaigns[0]?.id ?? '')

  const { count: suggestionCount } = await (
    supabase.from('ai_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', activeCampaignId)
      .in('status', ['active', 'pending_approval']) as Promise<{ count: number }>
  )

  const isDemoOrPending = onboardingState?.stage === 'demo' || onboardingState?.stage === 'pending' || onboardingState?.stage === 'seeding'

  // If still seeding, send user back to /welcome to wait
  if (onboardingState?.stage === 'pending' || onboardingState?.stage === 'seeding') {
    redirect('/welcome')
  }

  // Redirect to Brand Studio onboarding only AFTER activation (not during demo)
  if (tenantBranding && tenantBranding.onboarding_completed === false && !isDemoOrPending) {
    redirect('/onboarding')
  }

  const allCampaigns = enrichedCampaigns
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

  const features: Record<string, unknown> = {}
  if (resolvedFeatures && Array.isArray(resolvedFeatures)) {
    for (const row of resolvedFeatures) {
      features[row.feature_key] = row.resolved_value
    }
  }

  return (
    <>
    <ImpersonationBanner />
    <DemoBanner tenantId={activeTenantId} />
    <BrandProvider brand={effectiveBrand}>
      <FeaturesProvider features={features} plan={tenantPlan}>
      <PermissionsProvider
        userRole={profile.role}
        customRoleId={profile.custom_role_id ?? null}
        tenantId={activeTenantId}
      >
      <SidebarProvider>
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
            avatarUrl={profile.avatar_url}
            campaigns={allCampaigns}
            activeCampaignId={activeCampaignId}
            userId={user.id}
            notificationsEnabled={profile.preferences?.notifications?.enabled !== false}
          />
          <main className="flex-1 overflow-auto bg-background relative">
            <DemoCoachMarks tenantId={activeTenantId} />
            {children}
          </main>
        </div>
        <Toaster />
      </div>
      </SidebarProvider>
      </PermissionsProvider>
      </FeaturesProvider>
    </BrandProvider>
    </>
  )
}
