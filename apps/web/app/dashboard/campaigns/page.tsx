import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Flag, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('tenant_id', profile?.tenant_id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between pb-8 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Campañas</h1>
          <p className="text-sm text-gray-500 mt-1.5">{campaigns?.length ?? 0} campañas en tu organización</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/campaigns/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva campaña
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns?.map(campaign => (
          <Card key={campaign.id} className="hover:shadow-md cursor-pointer transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Flag className="h-4 w-4 text-indigo-600" />
                </div>
                <Badge variant="outline" className={campaign.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                  {campaign.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <h2 className="font-semibold text-gray-900">{campaign.name}</h2>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
              )}
              {campaign.election_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                  <Calendar className="h-3 w-3" />
                  Elección: {new Date(campaign.election_date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Creada {new Date(campaign.created_at).toLocaleDateString('es-ES')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
