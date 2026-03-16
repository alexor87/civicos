'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FlaskConical, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { sendTestEmail } from '@/app/dashboard/comunicaciones/actions'

interface Props {
  campaignId: string
  defaultEmail?: string
}

export function TestEmailButton({ campaignId, defaultEmail = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(defaultEmail)
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!email) return
    startTransition(async () => {
      const result = await sendTestEmail(campaignId, email)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Email de prueba enviado a ${email}`)
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[#6a737d] gap-1.5"
      >
        <FlaskConical className="h-4 w-4" />
        Enviar prueba
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-[#f6f7f8] border border-[#dcdee6] rounded-md px-3 py-2">
      <FlaskConical className="h-4 w-4 text-[#6a737d] shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Label htmlFor="test-email" className="text-xs text-[#6a737d] shrink-0">Enviar a:</Label>
        <Input
          id="test-email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          autoFocus
        />
      </div>
      <Button
        size="sm"
        onClick={handleSend}
        disabled={isPending || !email}
        className="h-7 text-xs px-3 shrink-0"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
      </Button>
      <button
        onClick={() => setOpen(false)}
        className="text-[#6a737d] hover:text-[#1b1f23] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
