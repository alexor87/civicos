'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  campaignId: string
}

const ALLOWED_TYPES = ['.pdf', '.txt', '.md', '.docx']
const ALLOWED_MIME  = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function KnowledgeUploader({ campaignId }: Props) {
  const [file, setFile]         = useState<File | null>(null)
  const [title, setTitle]       = useState('')
  const [isPending, setIsPending] = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)
  const router                  = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) {
      setTitle(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setIsPending(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('campaign_id', campaignId)
    fd.append('title', title || file.name.replace(/\.[^/.]+$/, ''))

    try {
      const res  = await fetch('/api/knowledge/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al subir el documento')
      } else {
        toast.success(`"${data.title}" subido — ${data.chunks} fragmentos indexados`)
        setFile(null)
        setTitle('')
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      }
    } catch {
      toast.error('Error de conexión al subir el documento')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#dcdee6] rounded-md p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[#1b1f23]">Subir documento</h3>

      {/* File input */}
      <div className="space-y-1.5">
        <Label htmlFor="kb-file">Archivo</Label>
        <div
          className="border-2 border-dashed border-[#dcdee6] rounded-md p-6 text-center cursor-pointer hover:border-[#2960ec] hover:bg-[#2960ec]/5 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[#1b1f23]">
              <FileText className="h-4 w-4 text-[#2960ec]" />
              <span className="font-medium">{file.name}</span>
              <span className="text-[#6a737d]">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <div className="text-[#6a737d] text-sm">
              <Upload className="h-6 w-6 mx-auto mb-2 text-[#dcdee6]" />
              <p>Haz clic para seleccionar un archivo</p>
              <p className="text-xs mt-1">PDF, TXT, MD, DOCX — máx. 10 MB</p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          id="kb-file"
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="kb-title">Título del documento</Label>
        <Input
          id="kb-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="ej. Plataforma política 2025"
        />
      </div>

      <Button
        type="submit"
        disabled={!file || isPending}
        className="w-full gap-2"
      >
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
          : <><Upload className="h-4 w-4" /> Subir e indexar</>
        }
      </Button>
    </form>
  )
}
