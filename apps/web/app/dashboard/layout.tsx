import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BrandProvider } from '@/components/dashboard/BrandProvider'
import { brandFromColor, type TenantBrand } from '@/lib/brand-utils'
import { Toaster } from '@/components/ui/sonner'

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

  if (!profile) redirect('/login')

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

  // Fetch active campaign name
  const firstCampaignId = profile.campaign_ids?.[0] ?? ''
  let campaignName = 'Sin campaña'

  if (firstCampaignId) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name')
      .eq('id', firstCampaignId)
      .single()
    if (campaign?.name) campaignName = campaign.name
  }

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

  // Active suggestion count for the realtime badge
  const { count: suggestionCount } = await supabase
    .from('ai_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', firstCampaignId)
    .in('status', ['active', 'pending_approval']) as { count: number }

  return (
    <BrandProvider brand={effectiveBrand}>
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
          />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </BrandProvider>
  )
}
