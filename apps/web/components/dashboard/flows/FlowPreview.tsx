'use client'

import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

interface ContactPreview {
  id:        string
  name:      string | null
  barrio:    string | null
  municipio: string | null
}

interface Props {
  message:        string
  initialContact: ContactPreview | null
  renderedMessage: string | null
}

export function FlowPreview({ message, initialContact, renderedMessage: initialRendered }: Props) {
  const [contact, setContact]         = useState<ContactPreview | null>(initialContact)
  const [rendered, setRendered]       = useState<string | null>(initialRendered)
  const [loading, setLoading]         = useState(false)

  async function loadNextContact() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ message })
      if (contact?.id) params.set('skip', contact.id)
      const res = await fetch(`/api/flows/preview?${params}`)
      if (res.ok) {
        const data = await res.json()
        setContact(data.contact)
        setRendered(data.renderedMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!contact) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-sm text-slate-400">
        No hay contactos en la campaña para mostrar una vista previa.
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-primary/20 rounded-xl overflow-hidden"
      data-testid="flow-preview"
    >
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
        <p className="text-xs font-semibold text-primary">¿Cómo se vería esto con un contacto real?</p>
      </div>

      <div className="p-4">
        {/* Datos del contacto de ejemplo */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {contact.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{contact.name}</p>
            <p className="text-[10px] text-slate-400">
              {[contact.barrio, contact.municipio].filter(Boolean).join(' · ') || 'Sin ubicación'}
            </p>
          </div>
        </div>

        {/* Mensaje renderizado */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-3 mb-3">
          <p className="text-sm text-slate-800 dark:text-white whitespace-pre-wrap leading-relaxed">
            {loading ? '…' : (rendered ?? message)}
          </p>
        </div>

        {/* Botón "Ver otro ejemplo" */}
        <button
          onClick={loadNextContact}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
        >
          {loading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />
          }
          Ver otro ejemplo
        </button>
      </div>
    </div>
  )
}
