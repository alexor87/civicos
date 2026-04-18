import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CampaignHero } from '@/components/CampaignHero'
import { PublicRegistrationForm } from '@/components/PublicRegistrationForm'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getConfig(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .rpc('get_public_registration_config', { p_slug: slug })

  return data?.[0] ?? null
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const config = await getConfig(slug)
  if (!config) return { title: 'No encontrado' }
  return {
    title: config.title || 'Únete',
    description: config.welcome_text || 'Regístrate como simpatizante',
  }
}

export default async function RegistrationPage({ params }: PageProps) {
  const { slug } = await params
  const config = await getConfig(slug)
  if (!config) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="p-6">
            <CampaignHero
              logoUrl={config.logo_url}
              videoUrl={config.video_url}
              headerImageUrl={config.header_image_url}
              title={config.title}
              welcomeText={config.welcome_text}
              primaryColor={config.primary_color}
              registrationCount={config.registration_count ?? 0}
            />

            <PublicRegistrationForm config={config} />
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Scrutix
        </p>
      </div>
    </div>
  )
}
