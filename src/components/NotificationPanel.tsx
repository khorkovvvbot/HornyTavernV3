import React from 'react'
import { useTranslation } from 'react-i18next'
import { X, Bell, MessageSquare, Star, Trash2, Check } from 'lucide-react'
import type { Notification } from '../hooks/useNotifications'

interface NotificationPanelProps {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClear: () => void
}

export const NotificationPanel = ({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear
}: NotificationPanelProps) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'review_submitted':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'reply_received':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('notifications.justNow')
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes })
    if (hours < 24) return t('notifications.hoursAgo', { count: hours })
    return t('notifications.daysAgo', { count: days })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors duration-200"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('notifications.markAllRead')}</span>
                </button>
              )}
              <button
                onClick={onClear}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('notifications.clearAll')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer ${
                    !notification.read ? 'bg-purple-50 dark:bg-purple-900/10' : ''
                  }`}
                  onClick={() => !notification.read && onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      {notification.gameTitle && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          {t('notifications.game', { gameTitle: notification.gameTitle })}
                        </p>
                      )}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Background overlay */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}