import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ConfirmationContent } from './ConfirmationContent'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ code?: string; existing?: string }>
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

export default async function ConfirmacionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { code, existing } = await searchParams
  const config = await getConfig(slug)
  if (!config) notFound()

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://unete.scrutix.co'}/${slug}?ref=${code || ''}`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <ConfirmationContent
            config={config}
            referralLink={referralLink}
            slug={slug}
            isExisting={existing === '1'}
            code={code || ''}
          />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Scrutix
        </p>
      </div>
    </div>
  )
}
