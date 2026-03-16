'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Download, Trash2, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  contactId:    string
  isAnonymized: boolean
}

export function GDPRActions({ contactId, isAnonymized }: Props) {
  const router = useRouter()
  const [exporting,   setExporting]   = useState(false)
  const [anonymizing, setAnonymizing] = useState(false)

  if (isAnonymized) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-[#6a737d]">
        <ShieldOff className="h-4 w-4" />
        <span>Datos personales eliminados (Ley 1581)</span>
      </div>
    )
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/personal-data`)
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `datos-personales-${contactId}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Datos exportados correctamente')
    } catch {
      toast.error('No se pudieron exportar los datos')
    } finally {
      setExporting(false)
    }
  }

  async function handleAnonymize() {
    setAnonymizing(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/personal-data`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al anonimizar')
      toast.success('Datos personales eliminados correctamente')
      router.refresh()
    } catch {
      toast.error('No se pudieron eliminar los datos personales')
    } finally {
      setAnonymizing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={handleExport}
        disabled={exporting}
      >
        <Download className="h-3.5 w-3.5" />
        {exporting ? 'Exportando...' : 'Exportar datos'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          data-testid="gdpr-delete-trigger"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700')}
          disabled={anonymizing}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {anonymizing ? 'Eliminando...' : 'Eliminar datos personales'}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar datos personales?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción anonimizará de forma permanente los datos personales de este contacto
              (nombre, email, teléfono, documento, dirección, etc.) en cumplimiento de la Ley 1581
              de protección de datos. Los registros estadísticos se conservarán. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAnonymize}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
