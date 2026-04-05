import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle, Clock } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

const ELECTION_TYPE_LABELS: Record<string, string> = {
  presidente: 'Presidente',
  senador: 'Senador',
  representante: 'Representante a la Cámara',
  gobernador: 'Gobernador',
  diputado: 'Diputado Departamental',
  alcalde: 'Alcalde Municipal',
  concejal: 'Concejal Municipal',
  jal: 'Edil JAL',
  consulta: 'Consulta Interna',
}

export default async function ApprovalsPage() {
  const supabase = createAdminClient()

  const { data: pending } = await supabase
    .from('onboarding_state')
    .select('tenant_id, wizard_data, approval_requested_at, tenants(name, slug)')
    .eq('stage', 'pending_approval')
    .order('approval_requested_at', { ascending: true })

  const rows = (pending ?? []) as unknown as Array<{
    tenant_id: string
    wizard_data: Record<string, unknown>
    approval_requested_at: string
    tenants: { name: string; slug: string } | null
  }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aprobaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rows.length} {rows.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} de activación
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Organización</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Candidato</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Cargo</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Territorio</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Plan</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Solicitado</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay solicitudes pendientes</p>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const wd = r.wizard_data ?? {}
                const candidate = (wd.candidateName as string) ?? '—'
                const electionType = (wd.electionType as string) ?? ''
                const department = (wd.departmentName as string) ?? ''
                const municipality = (wd.municipalityName as string) ?? ''
                const plan = (wd.plan as string) ?? 'esencial'
                return (
                  <tr key={r.tenant_id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-foreground">{r.tenants?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{r.tenants?.slug ?? ''}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">{candidate}</td>
                    <td className="px-5 py-3 text-sm text-foreground">
                      {ELECTION_TYPE_LABELS[electionType] ?? electionType}
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">
                      {municipality && department ? `${municipality}, ${department}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        plan === 'pro' || plan === 'profesional'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(r.approval_requested_at).toLocaleString('es-CO', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ApprovalActions tenantId={r.tenant_id} tenantName={r.tenants?.name ?? ''} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
