'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Shield, MapPin, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Stage = 'pending' | 'seeding' | 'demo' | 'activating' | 'active'

export default function WelcomePage() {
  const [stage, setStage] = useState<Stage>('pending')
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const checkStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) return

    const { data } = await supabase
      .from('onboarding_state')
      .select('stage')
      .eq('tenant_id', tenantId)
      .single()

    if (data?.stage) {
      setStage(data.stage as Stage)
      if (data.stage === 'demo' || data.stage === 'active') {
        setReady(true)
      }
    }
  }, [supabase])

  // Poll onboarding_state every 1.5s until demo is ready
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 1500)
    return () => clearInterval(interval)
  }, [checkStatus])

  // Auto-redirect 3s after ready
  useEffect(() => {
    if (!ready) return
    const timeout = setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 3000)
    return () => clearTimeout(timeout)
  }, [ready, router])

  function handleExplore() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2960ec] flex items-center justify-center shadow-lg shadow-blue-200">
            <Shield className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Status */}
        {!ready ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-900">
              Preparando tu plataforma
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              {stage === 'seeding'
                ? 'Creando contactos, territorios y eventos de ejemplo...'
                : 'Configurando tu espacio de trabajo...'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Tu plataforma está lista
            </h1>

            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <MapPin className="h-4 w-4" />
              <span>Campaña demo en Rionegro, Antioquia</span>
            </div>

            <p className="text-slate-400 text-xs">
              500 contactos, 4 territorios, eventos y sugerencias IA
            </p>

            <Button
              onClick={handleExplore}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-4"
              size="lg"
            >
              Explorar Scrutix
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
