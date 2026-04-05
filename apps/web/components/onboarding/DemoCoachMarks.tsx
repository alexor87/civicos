'use client'

import { usePathname } from 'next/navigation'
import { useOnboardingState } from '@/lib/hooks/useOnboardingState'
import { CoachMark } from './CoachMark'

interface DemoCoachMarksProps {
  tenantId: string
}

const COACH_MARKS: Record<string, { storageKey: string; title: string; description: string }> = {
  '/dashboard/canvassing': {
    storageKey: 'canvassing_map',
    title: 'Mapa de Territorios',
    description: 'Aquí puedes ver tus zonas de canvassing, asignar voluntarios y hacer seguimiento de visitas puerta a puerta. Los datos que ves son de ejemplo en Rionegro.',
  },
  '/dashboard/ai': {
    storageKey: 'ai_suggestions',
    title: 'Centro de Inteligencia',
    description: 'Los agentes IA analizan tu campaña y generan sugerencias accionables. Estas son sugerencias de ejemplo para que veas cómo funciona.',
  },
  '/dashboard/calendar': {
    storageKey: 'calendar_events',
    title: 'Calendario Electoral',
    description: 'Planifica eventos, reuniones y jornadas de canvassing. Los eventos que ves son de ejemplo para que explores la funcionalidad.',
  },
}

export function DemoCoachMarks({ tenantId }: DemoCoachMarksProps) {
  const pathname = usePathname()
  const { isDemo, isLoading } = useOnboardingState(tenantId)

  if (isLoading || !isDemo) return null

  const config = COACH_MARKS[pathname]
  if (!config) return null

  return (
    <div className="relative">
      <CoachMark
        storageKey={config.storageKey}
        title={config.title}
        description={config.description}
        position="bottom"
      />
    </div>
  )
}
