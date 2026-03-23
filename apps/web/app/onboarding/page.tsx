import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  // If onboarding already done → go to dashboard
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('onboarding_completed, candidate_name')
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (branding?.onboarding_completed) redirect('/dashboard')

  return (
    <OnboardingWizard
      userFullName={profile.full_name ?? ''}
      defaultCandidateName={branding?.candidate_name ?? profile.full_name ?? ''}
    />
  )
}
