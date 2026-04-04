'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        slug: fd.get('slug'),
        plan: fd.get('plan'),
        country: fd.get('country'),
        admin_email: fd.get('admin_email'),
        internal_notes: fd.get('internal_notes'),
      }),
    })

    setLoading(false)
    if (res.ok) {
      const { id } = await res.json()
      setOpen(false)
      router.push(`/dashboard/tenants/${id}`)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" /> Nueva organización
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Nueva organización</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
                <input name="name" required className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Slug (URL) *</label>
                <input name="slug" required pattern="[a-z0-9-]+" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="mi-organizacion" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plan</label>
                  <select name="plan" defaultValue="esencial" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="esencial">Esencial</option>
                    <option value="pro">Pro</option>
                    <option value="campaign">Campaign</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">País</label>
                  <select name="country" defaultValue="co" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="co">Colombia</option>
                    <option value="es">España</option>
                    <option value="mx">México</option>
                    <option value="fr">Francia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email del Super Admin *</label>
                <input name="admin_email" type="email" required className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="admin@org.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notas internas</label>
                <textarea name="internal_notes" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Crear organización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
