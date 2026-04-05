'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CoachMarkProps {
  storageKey: string
  title: string
  description: string
  position?: 'top' | 'bottom'
}

export function CoachMark({ storageKey, title, description, position = 'top' }: CoachMarkProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = `coach_mark_${storageKey}_seen`
    if (!localStorage.getItem(key)) {
      // Small delay so the page content renders first
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(`coach_mark_${storageKey}_seen`, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={dismiss}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? -8 : 8 }}
            className={`absolute z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <button
              onClick={dismiss}
              className="absolute top-2 right-2 p-1 rounded hover:bg-slate-100 text-slate-400"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lightbulb className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={dismiss} className="h-7 text-xs">
                Entendido
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
