import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CampaignSettingsForm } from '@/components/settings/CampaignSettingsForm'

export default async function CampaignSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) {
    return (
      <div className="text-sm text-[#6a737d]">
        No tienes una campaña activa asignada.
      </div>
    )
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return (
      <div className="text-sm text-[#6a737d]">
        No se pudo cargar la campaña. Verifica que la migración 010 esté aplicada en Supabase.
      </div>
    )
  }

  const canEdit = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#1b1f23]">Perfil de la campaña</h2>
        <p className="text-sm text-[#6a737d] mt-0.5">
          Esta información es usada por el motor de IA para personalizar sugerencias y generar contenido.
        </p>
      </div>

      {canEdit ? (
        <CampaignSettingsForm campaign={campaign} />
      ) : (
        <p className="text-sm text-[#6a737d]">Solo el Campaign Manager puede editar esta configuración.</p>
      )}
    </div>
  )
}
