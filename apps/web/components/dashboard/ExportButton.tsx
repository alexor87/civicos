'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown } from 'lucide-react'

interface ExportButtonProps {
  /** Base API path, e.g. "/api/export/contacts" */
  baseUrl: string
  /** Extra query params to forward (e.g. current filters) */
  params?: Record<string, string>
}

export function ExportButton({ baseUrl, params = {} }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function buildUrl(format: 'csv' | 'xlsx') {
    const qs = new URLSearchParams({ ...params, format })
    return `${baseUrl}?${qs.toString()}`
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(prev => !prev)}
        className="gap-1.5"
      >
        <Download className="h-4 w-4" />
        Exportar
        <ChevronDown className="h-3 w-3 opacity-60" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-md z-50">
          <a
            href={buildUrl('csv')}
            download
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
            onClick={() => setOpen(false)}
          >
            Exportar CSV
          </a>
          <a
            href={buildUrl('xlsx')}
            download
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-md"
            onClick={() => setOpen(false)}
          >
            Exportar Excel (.xlsx)
          </a>
        </div>
      )}
    </div>
  )
}
