'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, MessageSquare, CheckCircle2, Zap, BarChart3, Users, Clock, Globe, Bot } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Channel = 'email' | 'sms' | 'whatsapp'

interface Props {
  channel: Channel
  isConfigured: boolean
}

const CHANNEL_CONFIG: Record<Channel, {
  title: string
  description: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  accentColor: string
  benefits: { icon: React.ElementType; text: string }[]
}> = {
  email: {
    title: 'Configura tu servicio de Email',
    description: 'Conecta Resend para enviar campañas de email a tus contactos.',
    icon: Mail,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    accentColor: 'bg-blue-600 hover:bg-blue-700',
    benefits: [
      { icon: Users, text: 'Envío masivo a segmentos de contactos' },
      { icon: BarChart3, text: 'Métricas de apertura y entrega en tiempo real' },
      { icon: CheckCircle2, text: 'Plantillas reutilizables para campañas recurrentes' },
    ],
  },
  sms: {
    title: 'Configura tu servicio de SMS',
    description: 'Conecta Twilio para enviar campañas de SMS a tus contactos.',
    icon: MessageSquare,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accentColor: 'bg-violet-600 hover:bg-violet-700',
    benefits: [
      { icon: Zap, text: '98% de tasa de apertura — el canal más efectivo' },
      { icon: Clock, text: 'Entrega inmediata para comunicaciones urgentes' },
      { icon: Globe, text: 'Alcance universal — no requiere internet del destinatario' },
    ],
  },
  whatsapp: {
    title: 'Configura tu servicio de WhatsApp',
    description: 'Conecta la API de WhatsApp Business para comunicarte por el canal preferido.',
    icon: MessageSquare,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    accentColor: 'bg-[#25D366] hover:bg-[#1fb855]',
    benefits: [
      { icon: Users, text: 'Comunicación conversacional y personalizada' },
      { icon: Zap, text: 'Envío de imágenes, documentos y multimedia' },
      { icon: Bot, text: 'Chatbot con IA para atención automática 24/7' },
    ],
  },
}

export function ServiceSetupModal({ channel, isConfigured }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  if (isConfigured) return null

  const cfg = CHANNEL_CONFIG[channel]
  const Icon = cfg.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-3">
            <div className={`h-14 w-14 rounded-2xl ${cfg.iconBg} flex items-center justify-center`}>
              <Icon className={`h-7 w-7 ${cfg.iconColor}`} />
            </div>
            <DialogTitle className="text-lg">{cfg.title}</DialogTitle>
            <DialogDescription>{cfg.description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3 my-2">
          {cfg.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className={`h-8 w-8 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                <b.icon className={`h-4 w-4 ${cfg.iconColor}`} />
              </div>
              <p className="text-slate-700 dark:text-slate-300 pt-1">{b.text}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:flex-col gap-2">
          <Button
            className={`w-full ${cfg.accentColor} text-white`}
            onClick={() => router.push('/dashboard/settings/integrations')}
          >
            Configurar ahora
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Hacerlo luego
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
