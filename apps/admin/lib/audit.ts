import { createAdminClient } from './supabase/admin'
import { headers } from 'next/headers'

interface AuditEntry {
  admin_id: string
  admin_email: string
  action: string
  tenant_id?: string
  tenant_name?: string
  payload?: Record<string, unknown>
}

/**
 * Insert an immutable audit log entry.
 * Called from server actions after every admin operation.
 */
export async function insertAuditLog(entry: AuditEntry): Promise<void> {
  const supabase = createAdminClient()
  const headerStore = await headers()

  const ip_address = headerStore.get('x-forwarded-for')
    ?? headerStore.get('x-real-ip')
    ?? 'unknown'
  const user_agent = headerStore.get('user-agent') ?? 'unknown'

  await supabase.from('admin_audit_log').insert({
    admin_id: entry.admin_id,
    admin_email: entry.admin_email,
    action: entry.action,
    tenant_id: entry.tenant_id ?? null,
    tenant_name: entry.tenant_name ?? null,
    payload: entry.payload ?? {},
    ip_address,
    user_agent,
  })
}
