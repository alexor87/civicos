import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ReferralPanel } from './ReferralPanel'

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

export default async function MisReferidosPage({ params }: PageProps) {
  const { slug } = await params
  const config = await getConfig(slug)
  if (!config || !config.referral_enabled) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <ReferralPanel config={config} slug={slug} />

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Scrutix
        </p>
      </div>
    </div>
  )
}
