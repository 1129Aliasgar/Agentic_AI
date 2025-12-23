import React from 'react'
import { useNotification } from '../contexts/NotificationContext'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

export default function NotificationDrawer() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500 text-green-400'
      case 'error':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      default:
        return 'bg-purple-500/20 border-purple-500 text-purple-400'
    }
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm ${getNotificationColor(
            notification.type
          )}`}
        >
          <div className="flex justify-between items-start">
            <p className="text-sm">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-white/60 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

