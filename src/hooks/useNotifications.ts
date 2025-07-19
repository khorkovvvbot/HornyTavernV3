import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type NotificationRow = Database['public']['Tables']['notifications']['Row']

export interface Notification {
  id: string
  type: 'review_submitted' | 'reply_received'
  title: string
  message: string
  gameTitle?: string
  fromUser?: string
  read: boolean
  createdAt: Date
}

export const useNotifications = (user: User | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Convert database row to notification interface
  const convertNotification = (row: NotificationRow): Notification => ({
    id: row.id,
    type: row.type as 'review_submitted' | 'reply_received',
    title: row.title,
    message: row.message,
    gameTitle: row.game_title || undefined,
    fromUser: row.from_user || undefined,
    read: row.read,
    createdAt: new Date(row.created_at)
  })

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const convertedNotifications = (data || []).map(convertNotification)
      setNotifications(convertedNotifications)
      setUnreadCount(convertedNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchNotifications()

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newNotification = convertNotification(payload.new as NotificationRow)
            setNotifications(prev => [newNotification, ...prev].slice(0, 50))
            if (!newNotification.read) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = convertNotification(payload.new as NotificationRow)
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            // Recalculate unread count
            setUnreadCount(prev => {
              const oldNotification = notifications.find(n => n.id === updatedNotification.id)
              if (oldNotification && !oldNotification.read && updatedNotification.read) {
                return Math.max(0, prev - 1)
              }
              return prev
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setNotifications(prev => prev.filter(n => n.id !== deletedId))
            // Recalculate unread count
            const deletedNotification = notifications.find(n => n.id === deletedId)
            if (deletedNotification && !deletedNotification.read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          game_title: notification.gameTitle || null,
          from_user: notification.fromUser || null,
          read: false
        })

      if (error) throw error
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const clearNotifications = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refetch: fetchNotifications
  }
}