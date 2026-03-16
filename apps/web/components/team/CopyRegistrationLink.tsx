'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  campaignId: string
}

export function CopyRegistrationLink({ campaignId }: Props) {
  const [copied, setCopied] = useState(false)

  const url = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ''}/registro/${campaignId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: select input
    }
  }

  return (
    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 mb-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-indigo-900">Enlace de registro para voluntarios</p>
        <p className="text-xs text-indigo-500 truncate mt-0.5">{`/registro/${campaignId}`}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
        onClick={handleCopy}
      >
        {copied ? (
          <><Check className="h-3.5 w-3.5" />Copiado</>
        ) : (
          <><Link2 className="h-3.5 w-3.5" />Copiar enlace</>
        )}
      </Button>
    </div>
  )
}
