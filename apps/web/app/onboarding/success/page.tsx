'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ActivationSuccessPage() {
  const router = useRouter()

  // Auto-redirect to branding wizard after 5s
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/onboarding')
      router.refresh()
    }, 5000)
    return () => clearTimeout(timeout)
  }, [router])

  function handleContinue() {
    router.push('/onboarding')
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

        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <PartyPopper className="h-10 w-10 text-emerald-600" />
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Tu campaña está activada
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Ahora vamos a personalizar tu campaña con tus colores, logo y slogan.
          </p>
        </div>

        <Button
          onClick={handleContinue}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          Personalizar mi campaña
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-slate-400">
          Serás redirigido automáticamente en unos segundos
        </p>
      </motion.div>
    </div>
  )
}
