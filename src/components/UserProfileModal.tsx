import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, MessageSquare, Star, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']

interface UserStats {
  totalReviews: number
  totalReplies: number
  averageRating: number
}

interface UserProfileModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export const UserProfileModal = ({ user, isOpen, onClose }: UserProfileModalProps) => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<UserStats>({
    totalReviews: 0,
    totalReplies: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats()
    }
  }, [isOpen, user])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch user's reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('user_id', user.id)

      // Fetch user's replies
      const { count: repliesCount } = await supabase
        .from('review_replies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const totalReviews = reviews?.length || 0
      const totalReplies = repliesCount || 0
      const averageRating = totalReviews > 0 
        ? reviews!.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0

      setStats({
        totalReviews,
        totalReplies,
        averageRating
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('profile.overview')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}&background=8B5CF6&color=fff`}
              alt={user.first_name}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-purple-200 dark:border-purple-600"
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {user.first_name} {user.last_name}
            </h3>
            {user.username && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">@{user.username}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('profile.memberSince', { 
                date: new Date(user.created_at).toLocaleDateString() 
              }) || `Member since ${new Date(user.created_at).toLocaleDateString()}`}
            </p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('profile.avgRating') || 'Avg Rating'}
                </div>
              </div>

              <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="text-lg font-bold text-pink-700 dark:text-pink-300">
                  {stats.totalReviews}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('profile.reviews') || 'Reviews'}
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {stats.totalReplies}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('profile.replies') || 'Replies'}
                </div>
              </div>
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