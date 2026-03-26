'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { FileText, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { KnowledgeDocumentMetaRow } from '@/lib/types/database'

const FILE_TYPE_BADGE: Record<string, string> = {
  pdf:  'bg-red-50 text-red-600 border-red-200',
  txt:  'bg-muted text-[#6a737d] border-[#dcdee6]',
  md:   'bg-purple-50 text-purple-600 border-purple-200',
  docx: 'bg-blue-50 text-blue-600 border-blue-200',
}

interface Props {
  documents: KnowledgeDocumentMetaRow[]
}

function DeleteDocumentButton({ docId, title }: { docId: string; title: string }) {
  const [open, setOpen]         = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router                  = useRouter()

  async function handleDelete() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/knowledge/documents/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`"${title}" eliminado`)
        setOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0" />
      }>
        <Trash2 className="h-3.5 w-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará &ldquo;{title}&rdquo; y todos sus fragmentos indexados. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDelete() }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 gap-2"
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando…</>
              : <><Trash2 className="h-4 w-4" /> Eliminar</>
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function KnowledgeDocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <div className="bg-white border border-[#dcdee6] rounded-md py-12 text-center">
        <FileText className="h-8 w-8 mx-auto text-[#dcdee6] mb-3" />
        <p className="text-sm font-semibold text-[#1b1f23]">Sin documentos aún</p>
        <p className="text-xs text-[#6a737d] mt-1 max-w-xs mx-auto">
          Sube documentos de la campaña para que los agentes IA y el chatbot de voluntarios puedan responder con base en ellos.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#dcdee6] rounded-md overflow-hidden">
      <div className="px-5 py-4 border-b border-[#dcdee6] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1b1f23]">Documentos indexados</h3>
        <span className="text-xs text-[#6a737d]">{documents.length} documento{documents.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-[#dcdee6]">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="h-8 w-8 rounded-md bg-[#2960ec]/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-[#2960ec]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1b1f23] truncate">{doc.title}</p>
              <p className="text-xs text-[#6a737d] mt-0.5">
                {doc.total_chunks} fragmentos · {new Date(doc.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {doc.file_type && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border uppercase ${FILE_TYPE_BADGE[doc.file_type] ?? FILE_TYPE_BADGE.txt}`}>
                  {doc.file_type}
                </span>
              )}
              <DeleteDocumentButton docId={doc.id} title={doc.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
