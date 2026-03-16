import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

const RESULT_LABELS: Record<string, string> = {
  contacted: 'Contactado',
  positive: 'Positivo',
  negative: 'Negativo',
  undecided: 'Indeciso',
  no_home: 'No en casa',
  not_home: 'No en casa',
  neighbor_absent: 'Vecino informó',
  follow_up: 'Seguimiento',
  refused: 'Rechazó',
  moved: 'Se mudó',
  wrong_address: 'Dir. incorrecta',
  deceased: 'Fallecido',
  come_back_later: 'Volver después',
  inaccessible: 'Inaccesible',
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
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

  let query = supabase
    .from('canvass_visits')
    .select('id, result, sympathy_level, vote_intention, wants_to_volunteer, status, rejection_reason, notes, created_at, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (status) query = query.eq('status', status)

  const { data: visits, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map to readable columns
  const rows = (visits ?? []).map((v: Record<string, unknown>) => {
    const contact = v.contacts as { first_name: string; last_name: string } | null
    const volunteer = (v.profiles as { full_name: string | null } | null)
    const territory = (v.territories as { name: string } | null)
    return {
      'ID Visita': v.id,
      'Contacto': contact ? `${contact.first_name} ${contact.last_name}` : '',
      'Voluntario': volunteer?.full_name ?? '',
      'Territorio': territory?.name ?? '',
      'Resultado': RESULT_LABELS[v.result as string] ?? (v.result as string) ?? '',
      'Simpatía (1-5)': v.sympathy_level ?? '',
      'Intención de voto': v.vote_intention ?? '',
      'Quiere voluntariar': v.wants_to_volunteer ? 'Sí' : 'No',
      'Estado': STATUS_LABELS[v.status as string] ?? (v.status as string) ?? '',
      'Motivo rechazo': v.rejection_reason ?? '',
      'Notas': v.notes ?? '',
      'Fecha': new Date(v.created_at as string).toLocaleDateString('es-ES'),
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Visitas')

  if (format === 'xlsx') {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="visitas-canvassing.xlsx"',
      },
    })
  }

  const csv = XLSX.utils.sheet_to_csv(ws)
  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="visitas-canvassing.csv"',
    },
  })
}
