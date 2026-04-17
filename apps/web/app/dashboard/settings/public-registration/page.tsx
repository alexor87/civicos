import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicRegistrationSettingsForm } from '@/components/settings/PublicRegistrationSettingsForm'

const ALLOWED_ROLES = ['super_admin', 'campaign_manager']

export default async function PublicRegistrationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/dashboard/settings')
  }

  const campaignId = profile.campaign_ids?.[0]
  if (!campaignId) redirect('/dashboard/settings')

  // Get campaign name for slug suggestion
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', campaignId)
    .single()

  // Get existing config if any
  const { data: config } = await supabase
    .from('public_registration_config')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle()

  const initial = {
    campaign_id: campaignId,
    is_active: config?.is_active ?? false,
    slug: config?.slug ?? '',
    logo_url: config?.logo_url ?? null,
    video_url: config?.video_url ?? null,
    header_image_url: config?.header_image_url ?? null,
    title: config?.title ?? '',
    welcome_text: config?.welcome_text ?? '',
    primary_color: config?.primary_color ?? '#2262ec',
    button_text: config?.button_text ?? 'Unirme',
    show_email: config?.show_email ?? true,
    show_document: config?.show_document ?? true,
    show_gender: config?.show_gender ?? false,
    show_age_group: config?.show_age_group ?? false,
    show_district: config?.show_district ?? false,
    referral_enabled: config?.referral_enabled ?? true,
    level_names: config?.level_names ?? ['Simpatizante', 'Activista', 'Defensor', 'Líder', 'Embajador'],
    level_thresholds: config?.level_thresholds ?? [0, 5, 15, 30, 50],
    authorization_text: config?.authorization_text ?? '',
    privacy_policy_url: config?.privacy_policy_url ?? '',
    notify_new_registration: config?.notify_new_registration ?? false,
    geo_department_code: config?.geo_department_code ?? '',
    geo_department_name: config?.geo_department_name ?? '',
    geo_municipality_name: config?.geo_municipality_name ?? '',
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Página Pública de Captación</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configura tu formulario público de registro para captar simpatizantes y referidos.
        </p>
      </div>
      <PublicRegistrationSettingsForm
        initial={initial}
        campaignName={campaign?.name || ''}
      />
    </div>
  )
}
