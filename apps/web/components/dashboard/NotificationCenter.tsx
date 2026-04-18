'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Check, CheckCheck, UserPlus, ClipboardCheck, Zap, Users, Info } from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/useNotifications'

interface Props {
  userId: string
  notificationsEnabled?: boolean
}

const TYPE_CONFIG: Record<Notification['type'], { icon: React.ReactNode; color: string }> = {
  new_contact:      { icon: <UserPlus className="h-4 w-4" />,       color: 'bg-blue-100 text-blue-600' },
  new_registration: { icon: <ClipboardCheck className="h-4 w-4" />, color: 'bg-green-100 text-green-600' },
  task_completed:   { icon: <CheckCheck className="h-4 w-4" />,     color: 'bg-purple-100 text-purple-600' },
  flow_triggered:   { icon: <Zap className="h-4 w-4" />,            color: 'bg-amber-100 text-amber-600' },
  team_mention:     { icon: <Users className="h-4 w-4" />,          color: 'bg-pink-100 text-pink-600' },
  system:           { icon: <Info className="h-4 w-4" />,            color: 'bg-slate-100 text-slate-600' },
}

function formatTime(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(date).toLocaleDateString('es')
}

export function NotificationCenter({ userId, notificationsEnabled = true }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(userId)

  // Close on click outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleClick(n: Notification) {
    if (!n.read) markAsRead(n.id)
    if (n.link) {
      setOpen(false)
      router.push(n.link)
    }
  }

  const badgeCount = notificationsEnabled ? unreadCount : 0
  const badgeLabel = badgeCount > 99 ? '99+' : String(badgeCount)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <Bell className="h-5 w-5" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Check className="h-3 w-3" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {!notificationsEnabled && (
              <div className="flex flex-col items-center gap-2 py-8 px-4">
                <BellOff className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500 text-center">
                  Las notificaciones están desactivadas
                </p>
                <button
                  onClick={() => { setOpen(false); router.push('/dashboard/perfil/notificaciones') }}
                  className="text-xs text-primary hover:underline"
                >
                  Activar notificaciones
                </button>
              </div>
            )}

            {notificationsEnabled && loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {notificationsEnabled && !loading && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 px-4">
                <Bell className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No tienes notificaciones</p>
              </div>
            )}

            {notificationsEnabled && !loading && notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
