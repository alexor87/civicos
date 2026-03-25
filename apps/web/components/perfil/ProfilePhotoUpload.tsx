'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  currentUrl: string | null
  initials: string
  onUploaded: (url: string) => void
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ProfilePhotoUpload({ currentUrl, initials, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Solo se aceptan JPG, PNG y WebP')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al subir la imagen')
        return
      }

      setPreviewUrl(data.url)
      onUploaded(data.url)
      toast.success('Foto actualizada')
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group h-24 w-24 rounded-full overflow-hidden border-2 border-slate-200 hover:border-primary transition-colors"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-primary flex items-center justify-center">
            <span className="text-white text-2xl font-semibold">{initials}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Subir foto de perfil"
      />

      <p className="text-xs text-slate-500">JPG, PNG o WebP. Máx 5MB</p>
    </div>
  )
}
