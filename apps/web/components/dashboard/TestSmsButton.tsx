'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { sendTestSms } from '@/app/dashboard/comunicaciones/sms-actions'

interface Props {
  campaignId: string
}

export function TestSmsButton({ campaignId }: Props) {
  const [expanded, setExpanded]   = useState(false)
  const [phone, setPhone]         = useState('')
  const [sent, setSent]           = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!phone.trim()) return
    startTransition(async () => {
      const result = await sendTestSms(campaignId, phone.trim())
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        setSent(true)
        toast.success('SMS de prueba enviado')
        setTimeout(() => { setSent(false); setExpanded(false); setPhone('') }, 3000)
      }
    })
  }

  if (!expanded) {
    return (
      <Button variant="outline" className="gap-2" onClick={() => setExpanded(true)}>
        <FlaskConical className="h-4 w-4" />
        Enviar SMS de prueba
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="tel"
        placeholder="+573001234567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-44"
        disabled={isPending || sent}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <Button
        variant="outline"
        className="gap-2 shrink-0"
        onClick={handleSend}
        disabled={!phone.trim() || isPending || sent}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : sent ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <FlaskConical className="h-4 w-4" />
        )}
        {sent ? 'Enviado' : 'Enviar'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => { setExpanded(false); setPhone('') }}>
        Cancelar
      </Button>
    </div>
  )
}
