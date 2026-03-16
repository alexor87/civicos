import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

const STATUS_LABELS: Record<string, string> = {
  supporter: 'Simpatizante',
  prospect: 'Prospecto',
  undecided: 'Indeciso',
  opponent: 'Oponente',
  unknown: 'Desconocido',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') ?? 'csv'
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, status, document_id, department, municipality, gender, tags, created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (status) query = query.eq('status', status)
  if (q) query = query.textSearch('search_vec', q, { type: 'websearch' })

  const { data: contacts, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map to readable columns
  const rows = (contacts ?? []).map(c => ({
    'ID': c.id,
    'Nombre': c.first_name,
    'Apellido': c.last_name,
    'Email': c.email ?? '',
    'Teléfono': c.phone ?? '',
    'Estado': STATUS_LABELS[c.status] ?? c.status ?? '',
    'Cédula': c.document_id ?? '',
    'Departamento': c.department ?? '',
    'Municipio': c.municipality ?? '',
    'Género': c.gender ?? '',
    'Etiquetas': Array.isArray(c.tags) ? c.tags.join(', ') : '',
    'Fecha registro': new Date(c.created_at).toLocaleDateString('es-ES'),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Contactos')

  if (format === 'xlsx') {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="contactos.xlsx"',
      },
    })
  }

  // Default: CSV
  const csv = XLSX.utils.sheet_to_csv(ws)
  return new Response('\uFEFF' + csv, {   // BOM for Excel UTF-8 compatibility
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="contactos.csv"',
    },
  })
}
