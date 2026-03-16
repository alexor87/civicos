import { notFound } from 'next/navigation'
import { getCampaignPublicData } from './actions'
import { VolunteerRegistrationForm } from '@/components/registro/VolunteerRegistrationForm'
import { Users } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaignPublicData(id)
  if (!campaign) return { title: 'Registro de voluntarios' }
  return {
    title:       `Únete al equipo — ${campaign.name}`,
    description: `Regístrate como voluntario de la campaña ${campaign.name}`,
  }
}

export default async function VolunteerRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campaign = await getCampaignPublicData(id)

  if (!campaign || !campaign.volunteer_registration_enabled) {
    notFound()
  }

  const brandColor = campaign.brand_color ?? '#2960ec'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header band */}
      <div className="h-2 w-full" style={{ backgroundColor: brandColor }} />

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-md">

          {/* Campaign identity */}
          <div className="flex flex-col items-center gap-3 mb-8 text-center">
            {campaign.logo_url ? (
              <img
                src={campaign.logo_url}
                alt={campaign.name}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : (
              <div
                className="h-16 w-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <Users className="h-8 w-8" style={{ color: brandColor }} />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                {campaign.candidate_name ?? campaign.name}
              </p>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                Únete como voluntario
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                Sé parte del equipo que está haciendo la diferencia. Completa el formulario y nos pondremos en contacto contigo.
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <VolunteerRegistrationForm
              campaignId={campaign.id}
              brandColor={brandColor}
            />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            {campaign.name} · Gestionado con CivicOS
          </p>
        </div>
      </div>
    </div>
  )
}
