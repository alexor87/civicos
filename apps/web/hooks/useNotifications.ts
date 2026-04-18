'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  tenant_id: string
  campaign_id: string
  user_id: string
  type: 'new_contact' | 'new_registration' | 'task_completed' | 'flow_triggered' | 'team_mention' | 'system'
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch {
      // Network error — keep showing last known data
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced refresh for realtime events
  const debouncedRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchNotifications()
    }, 2000)
  }, [fetchNotifications])

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!userId) return

    fetchNotifications()

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        debouncedRefresh
      )
      .subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications, debouncedRefresh])

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch {
      // Revert on error
      fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } catch {
      fetchNotifications()
    }
  }, [fetchNotifications])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications }
}
