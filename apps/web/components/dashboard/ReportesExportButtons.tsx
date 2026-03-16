'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, ChevronDown, Loader2 } from 'lucide-react'

export function ReportesExportButtons() {
  const [open, setOpen]           = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function handlePdf() {
    setOpen(false)
    setLoadingPdf(true)
    // Give the dropdown time to close before printing
    setTimeout(() => {
      window.print()
      setLoadingPdf(false)
    }, 150)
  }

  return (
    <div className="relative print:hidden" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(prev => !prev)}
        className="gap-1.5"
        disabled={loadingPdf}
        aria-label="Exportar reporte"
      >
        {loadingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Exportar
        <ChevronDown className="h-3 w-3 opacity-60" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 rounded-md border border-gray-200 bg-white shadow-md z-50">
          <button
            onClick={handlePdf}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-md text-left"
          >
            <FileText className="h-4 w-4 text-red-500" />
            Exportar PDF
          </button>
          <a
            href="/api/export/reportes"
            download
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-md"
            onClick={() => setOpen(false)}
          >
            <Download className="h-4 w-4 text-green-600" />
            Exportar Excel (.xlsx)
          </a>
        </div>
      )}
    </div>
  )
}
