import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandSettingsForm } from '@/components/settings/BrandSettingsForm'

const ALLOWED_ROLES = ['super_admin', 'campaign_manager']

export default async function BrandSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/dashboard/settings')
  }

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single()

  const initial = {
    logo_url:            branding?.logo_url            ?? null,
    candidate_photo_url: branding?.candidate_photo_url ?? null,
    candidate_name:      branding?.candidate_name      ?? null,
    candidate_role:      branding?.candidate_role      ?? null,
    slogan:              branding?.slogan              ?? null,
    color_primary:       branding?.color_primary       ?? '#2960ec',
    color_secondary:     branding?.color_secondary     ?? '#1e293b',
    color_accent:        branding?.color_accent         ?? '#ea580c',
    color_background:    branding?.color_background     ?? '#f8fafc',
    color_surface:       branding?.color_surface        ?? '#ffffff',
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Marca e Identidad</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Foto, eslogan y colores que se reflejan en el panel lateral de todos los usuarios.
        </p>
      </div>
      <BrandSettingsForm initial={initial} />
    </div>
  )
}
