'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ActivationSuccessPage() {
  const router = useRouter()

  function handleContinue() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2960ec] flex items-center justify-center shadow-lg shadow-blue-200">
            <Shield className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Pending icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="h-10 w-10 text-blue-600" />
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Solicitud enviada
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Nuestro equipo revisará tu solicitud en las próximas horas. Mientras tanto, puedes seguir explorando con los datos de ejemplo.
          </p>
        </div>

        <Button
          onClick={handleContinue}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          Volver al dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}
