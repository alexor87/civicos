'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  campaignId: string
  initialCount: number
}

export function RealtimeSuggestionsBadge({ campaignId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    if (!campaignId) return
    const supabase = createClient()

    const channel = supabase
      .channel('suggestions_badge')
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'ai_suggestions',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          // Refresh count on any change
          supabase
            .from('ai_suggestions')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .in('status', ['active', 'pending_approval'])
            .then(({ count: c }) => setCount(c ?? 0))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  if (count === 0) return null

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}
