import { createClient } from '@/lib/supabase/server'
import { ContactsTable } from '@/components/dashboard/ContactsTable'
import { GeoZoneFilter } from '@/components/dashboard/GeoZoneFilter'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/dashboard/ExportButton'
import Link from 'next/link'
import { Upload, Layers } from 'lucide-react'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; department?: string; municipality?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  const page = parseInt(params.page ?? '1')
  const pageSize = 50
  const offset = (page - 1) * pageSize

  // ── Geo units for cascade filter ────────────────────────────────────────────
  const { data: geoUnitsRaw } = await supabase
    .from('geo_units')
    .select('name, type, parent_id, id')
    .eq('campaign_id', campaignId ?? '')
    .in('type', ['departamento', 'municipio'])
    .order('type')
    .order('name')

  const departments = (geoUnitsRaw ?? [])
    .filter(u => u.type === 'departamento')
    .map(u => u.name as string)

  const deptIdByName: Record<string, string> = {}
  for (const u of geoUnitsRaw ?? []) {
    if (u.type === 'departamento') deptIdByName[u.name as string] = u.id as string
  }

  const municipiosByDept: Record<string, string[]> = {}
  for (const u of geoUnitsRaw ?? []) {
    if (u.type !== 'municipio' || !u.parent_id) continue
    const deptName = Object.entries(deptIdByName).find(([, id]) => id === u.parent_id)?.[0]
    if (!deptName) continue
    if (!municipiosByDept[deptName]) municipiosByDept[deptName] = []
    municipiosByDept[deptName].push(u.name as string)
  }

  // ── Contacts query ───────────────────────────────────────────────────────────
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaignId ?? '')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.q) {
    const like = `%${params.q}%`
    query = query.or(
      `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`
    )
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.department) {
    query = query.eq('department', params.department)
  }
  if (params.municipality) {
    query = query.eq('municipality', params.municipality)
  }

  const { data: contacts, count } = await query

  return (
    <div className="p-6 space-y-4 animate-page-in">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contactos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{count?.toLocaleString() ?? 0} contactos en la campaña</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/contacts/segments">
            <Button variant="outline" size="sm">
              <Layers className="h-4 w-4 mr-1.5" />
              Segmentos
            </Button>
          </Link>
          <ExportButton
            baseUrl="/api/export/contacts"
            params={{
              ...(params.status ? { status: params.status } : {}),
              ...(params.q ? { q: params.q } : {}),
            }}
          />
          <Link href="/dashboard/contacts/import">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1.5" />
              Importar CSV
            </Button>
          </Link>
        </div>
      </div>

      {departments.length > 0 && (
        <GeoZoneFilter
          departments={departments}
          municipiosByDept={municipiosByDept}
          currentDept={params.department ?? ''}
          currentMunicipality={params.municipality ?? ''}
        />
      )}

      <ContactsTable
        contacts={contacts ?? []}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        searchQuery={params.q}
        statusFilter={params.status}
        campaignId={campaignId ?? ''}
      />
    </div>
  )
}
