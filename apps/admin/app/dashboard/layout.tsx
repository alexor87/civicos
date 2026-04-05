import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify the user is a valid admin
  const admin = await verifyAdminUser(user.id)
  if (!admin) {
    await supabase.auth.signOut()
    redirect('/login?error=not-authorized')
  }

  // Count pending approvals for sidebar badge
  const adminSupabase = createAdminClient()
  const { count: pendingApprovals } = await adminSupabase
    .from('onboarding_state')
    .select('tenant_id', { count: 'exact', head: true })
    .eq('stage', 'pending_approval')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar
        adminName={admin.full_name}
        adminEmail={admin.email}
        pendingApprovals={pendingApprovals ?? 0}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 px-6 flex items-center border-b border-border bg-card shrink-0">
          <h2 className="text-sm font-medium text-muted-foreground">Backoffice de Administración</h2>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
