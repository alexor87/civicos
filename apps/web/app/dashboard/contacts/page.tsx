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
  searchParams: Promise<{ q?: string; status?: string; level?: string; cursor?: string; direction?: string; department?: string; municipality?: string }>
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
  const pageSize = 50

  // ── Geo units for cascade filter ────────────────────────────────────────────
  const { data: geoUnitsRaw } = await supabase
    .from('geo_units')
    .select('name, type, parent_id, id')
    .eq('campaign_id', campaignId ?? '')
    .in('type', ['departamento', 'municipio'])
    .order('type')
    .order('name')
    .limit(500)

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

  // ── Estimated total from campaign_stats (O(1) lookup) ────────────────────────
  let estimatedTotal = 0
  if (campaignId) {
    const { data: stats } = await supabase
      .from('campaign_stats')
      .select('total_contacts')
      .eq('campaign_id', campaignId)
      .single()
    estimatedTotal = (stats?.total_contacts as number) ?? 0
  }

  // ── Contacts query with cursor-based pagination ─────────────────────────────
  const isGoingBack = params.direction === 'prev'

  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, phone, email, status, document_number, document_type, address, city, district, department, municipality, commune, voting_place, voting_table, birth_date, gender, tags, notes, metadata, campaign_id, tenant_id, location_lat, location_lng, geocoding_status, contact_level, display_name, created_at, updated_at')
    .eq('campaign_id', campaignId ?? '')
    .is('deleted_at', null)
    .order('created_at', { ascending: isGoingBack })
    .limit(pageSize + 1) // Fetch N+1 to detect "has more"

  // Cursor-based pagination
  if (params.cursor) {
    if (isGoingBack) {
      query = query.gt('created_at', params.cursor)
    } else {
      query = query.lt('created_at', params.cursor)
    }
  }

  // Search: full-text search for 3+ chars, prefix ILIKE for 1-2 chars
  if (params.q) {
    const q = params.q.trim()
    if (q.length <= 2) {
      query = query.or(`first_name.ilike.${q}%,last_name.ilike.${q}%`)
    } else {
      query = query.textSearch('search_vec', `'${q.replace(/'/g, "''")}'`, { type: 'websearch', config: 'spanish' })
    }
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.level) {
    query = query.eq('contact_level', params.level)
  }
  if (params.department) {
    query = query.eq('department', params.department)
  }
  if (params.municipality) {
    query = query.eq('municipality', params.municipality)
  }

  const { data: rawContacts } = await query

  // Process cursor pagination results
  let contacts = rawContacts ?? []

  // If going backwards, we fetched in ascending order — reverse to show newest first
  if (isGoingBack) {
    contacts = contacts.reverse()
  }

  // Determine if there are more pages
  const hasMore = contacts.length > pageSize
  if (hasMore) {
    contacts = contacts.slice(0, pageSize)
  }

  // Determine if there's a previous page (we came from somewhere)
  const hasPrev = !!params.cursor

  // Build cursor values for navigation
  const nextCursor = hasMore && contacts.length > 0
    ? contacts[contacts.length - 1].created_at
    : undefined
  const prevCursor = hasPrev && contacts.length > 0
    ? contacts[0].created_at
    : undefined

  return (
    <div className="p-6 space-y-4 animate-page-in">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contactos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{estimatedTotal.toLocaleString()} contactos en la campaña</p>
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
              Importar contactos
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
        contacts={contacts}
        estimatedTotal={estimatedTotal}
        pageSize={pageSize}
        nextCursor={nextCursor}
        prevCursor={prevCursor}
        hasMore={hasMore}
        hasPrev={hasPrev}
        searchQuery={params.q}
        statusFilter={params.status}
        levelFilter={params.level}
        campaignId={campaignId ?? ''}
      />
    </div>
  )
}
