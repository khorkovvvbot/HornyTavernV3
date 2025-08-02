import { useState, useEffect } from 'react'
import { supabase } from '../lib/database'

interface UserStats {
  averageRating: number
  totalReviews: number
  totalFavorites: number
}

export const useStats = (userId?: string) => {
  const [stats, setStats] = useState<UserStats>({
    averageRating: 0,
    totalReviews: 0,
    totalFavorites: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId])

  const fetchStats = async () => {
    if (!userId) return

    try {
      // Fetch reviews stats
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('user_id', userId)

      // Fetch favorites count
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const totalReviews = reviews?.length || 0
      const averageRating = totalReviews > 0 
        ? reviews!.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0

      setStats({
        averageRating,
        totalReviews,
        totalFavorites: favoritesCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, refetch: fetchStats }
}