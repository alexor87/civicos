import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ContactFormWizard } from '@/components/contacts/ContactFormWizard'

export default async function NewContactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) redirect('/dashboard/contacts')

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Contactos
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nuevo Contacto</h1>
          <p className="text-sm text-gray-500 mt-0.5">Completa la información en 4 pasos</p>
        </div>
      </div>

      <ContactFormWizard campaignId={campaignId} />
    </div>
  )
}
