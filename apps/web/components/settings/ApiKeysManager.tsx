'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Copy, Plus, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKey {
  id:           string
  name:         string
  key_prefix:   string
  scopes:       string[]
  created_at:   string
  last_used_at: string | null
  revoked_at:   string | null
}

interface Props {
  initialKeys: ApiKey[]
  canManage:   boolean
}

const SCOPE_OPTIONS = [
  { value: 'contacts:read',   label: 'Leer contactos',  description: 'Consultar la lista de contactos y sus datos' },
  { value: 'contacts:write',  label: 'Crear contactos', description: 'Crear y actualizar contactos desde sistemas externos' },
  { value: 'campaigns:read',  label: 'Leer campaña',    description: 'Acceder a la información básica de la campaña' },
]

const EXPIRATION_OPTIONS = [
  { value: '30',  label: '30 días' },
  { value: '90',  label: '90 días' },
  { value: '365', label: '1 año' },
  { value: '',    label: 'Sin expiración' },
]

export function ApiKeysManager({ initialKeys, canManage }: Props) {
  const [keys,        setKeys]        = useState<ApiKey[]>(initialKeys)
  const [creating,    setCreating]    = useState(false)
  const [newKeyName,  setNewKeyName]  = useState('')
  const [newScopes,     setNewScopes]     = useState<string[]>(['contacts:read'])
  const [newExpiration, setNewExpiration] = useState('90')
  const [newKeyValue,   setNewKeyValue]   = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)

  async function handleCreate() {
    if (!newKeyName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), scopes: newScopes, expires_in_days: newExpiration ? Number(newExpiration) : null }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNewKeyValue(data.key)
      setKeys(prev => [data.api_key, ...prev])
      setNewKeyName('')
      setNewScopes(['contacts:read'])
      setNewExpiration('90')
    } catch {
      toast.error('No se pudo crear la API key')
      setCreating(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('No se pudo revocar la key'); return }
    setKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k))
    toast.success('API key revocada')
  }

  function toggleScope(scope: string) {
    setNewScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope])
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nueva API key
        </Button>
      )}

      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-[#6a737d]">
          <Key className="h-8 w-8 mb-3 opacity-30" />
          <p>No hay API keys creadas.</p>
          {canManage && <p className="mt-1">Crea una para integrar Scrutix con otros sistemas.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div
              key={k.id}
              className={`flex items-start justify-between p-3 rounded-lg border ${
                k.revoked_at ? 'bg-gray-50 opacity-60' : 'bg-white border-[#dcdee6]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1b1f23]">{k.name}</span>
                  {k.revoked_at && (
                    <Badge variant="outline" className="text-xs text-red-500 border-red-200">Revocada</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{k.key_prefix}••••</code>
                  <span className="text-xs text-[#6a737d]">
                    Creada {new Date(k.created_at).toLocaleDateString('es-ES')}
                  </span>
                  {k.last_used_at && (
                    <span className="text-xs text-[#6a737d]">
                      · Último uso {new Date(k.last_used_at).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {k.scopes.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              {canManage && !k.revoked_at && (
                <AlertDialog>
                  <AlertDialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50')}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Revocar API key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        La key <strong>{k.name}</strong> quedará inutilizable de inmediato. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRevoke(k.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sí, revocar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={creating && !newKeyValue} onOpenChange={open => { if (!open) setCreating(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva API key</DialogTitle>
            <DialogDescription>
              La key completa se mostrará una sola vez. Guárdala en un lugar seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-[#1b1f23] mb-1 block">Nombre</label>
              <Input
                placeholder="Ej: Integración CRM"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1b1f23] mb-1 block">Expiración</label>
              <select
                value={newExpiration}
                onChange={e => setNewExpiration(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Expiración"
              >
                {EXPIRATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1b1f23] mb-2 block">Permisos</label>
              <div className="space-y-3">
                {SCOPE_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newScopes.includes(opt.value)}
                      onChange={() => toggleScope(opt.value)}
                      className="rounded mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{opt.label}</span>
                        <code className="text-xs text-[#6a737d]">{opt.value}</code>
                      </div>
                      <p className="text-xs text-[#6a737d] mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading || !newKeyName.trim()}>
              {loading ? 'Creando...' : 'Crear key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show new key once */}
      <Dialog open={!!newKeyValue} onOpenChange={open => { if (!open) { setNewKeyValue(null); setCreating(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key creada</DialogTitle>
            <DialogDescription>
              Copia esta key ahora. No la podrás ver de nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-[#dcdee6] rounded-lg p-3">
              <code className="flex-1 text-xs font-mono break-all text-[#1b1f23]">{newKeyValue}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => newKeyValue && copyToClipboard(newKeyValue)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setNewKeyValue(null); setCreating(false) }}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
