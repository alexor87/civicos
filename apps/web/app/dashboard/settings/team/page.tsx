import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const ROLE_LABELS: Record<string, string> = {
  super_admin:        'Super Admin',
  campaign_manager:   'Campaign Manager',
  field_coordinator:  'Coordinador de Terreno',
  volunteer:          'Voluntario',
  analyst:            'Analista',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin:       'bg-purple-50 text-purple-700',
  campaign_manager:  'bg-blue-50 text-blue-700',
  field_coordinator: 'bg-indigo-50 text-indigo-700',
  volunteer:         'bg-emerald-50 text-emerald-700',
  analyst:           'bg-amber-50 text-amber-700',
}

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('tenant_id', profile?.tenant_id ?? '')
    .order('created_at', { ascending: true })

  const canManage = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1b1f23]">Miembros del equipo</h2>
          <p className="text-sm text-[#6a737d] mt-0.5">{members?.length ?? 0} personas en la organización</p>
        </div>
        {canManage && (
          <Link href="/dashboard/team/invite">
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Invitar miembro
            </Button>
          </Link>
        )}
      </div>

      <div className="border border-[#dcdee6] rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f6f7f8]/60">
              <TableHead className="text-xs font-semibold text-[#6a737d]">Nombre</TableHead>
              <TableHead className="text-xs font-semibold text-[#6a737d]">Email</TableHead>
              <TableHead className="text-xs font-semibold text-[#6a737d]">Rol</TableHead>
              <TableHead className="text-xs font-semibold text-[#6a737d]">Desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(members ?? []).map(member => (
              <TableRow key={member.id} className="hover:bg-[#f6f7f8]/60">
                <TableCell className="font-medium text-sm text-[#1b1f23]">
                  {member.full_name ?? '—'}
                  {member.id === user.id && (
                    <span className="ml-2 text-xs text-[#6a737d]">(tú)</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-[#6a737d]">{member.email ?? '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-[#f6f7f8] text-[#6a737d]'}`}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#6a737d]">
                  {new Date(member.created_at).toLocaleDateString('es-ES')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
