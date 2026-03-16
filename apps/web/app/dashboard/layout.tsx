import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        tenantName={tenantName}
        campaignName={campaignName}
        userFullName={profile.full_name}
        userRole={profile.role}
        userInitials={userInitials}
        campaignId={firstCampaignId}
        suggestionCount={suggestionCount ?? 0}
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
  )
}
