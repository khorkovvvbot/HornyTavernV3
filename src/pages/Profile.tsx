import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Heart, MessageSquare, Star, Lightbulb, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { GameCard } from '../components/GameCard'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Game = Database['public']['Tables']['games']['Row'] & {
  averageRating?: number
  reviewCount?: number
  isFavorite?: boolean
}
type GameSuggestion = Database['public']['Tables']['game_suggestions']['Row']

interface UserStats {
  averageRating: number
  totalReviews: number
  totalFavorites: number
}

interface ProfileProps {
  user: User | null
  stats: UserStats
  statsLoading: boolean
  onBack: () => void
  onGameClick: (game: Game) => void
}

type ProfileTab = 'overview' | 'favorites' | 'suggestions'

export const Profile = ({ user, stats, statsLoading, onBack, onGameClick }: ProfileProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([])
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [suggestionForm, setSuggestionForm] = useState({
    gameTitle: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [cooldownTime, setCooldownTime] = useState<Date | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) {
      if (activeTab === 'favorites') {
        fetchFavoriteGames()
      } else if (activeTab === 'suggestions') {
        fetchSuggestions()
        checkCooldown()
      }
    }
  }, [activeTab, user])

  const checkCooldown = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('game_suggestions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        const lastSuggestionTime = new Date(data.created_at)
        const cooldownEnd = new Date(lastSuggestionTime.getTime() + 3 * 60 * 60 * 1000) // 3 hours
        const now = new Date()

        if (now < cooldownEnd) {
          setCooldownTime(cooldownEnd)
        } else {
          setCooldownTime(null)
        }
      }
    } catch (error) {
      // If table doesn't exist, silently handle it
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        console.warn('game_suggestions table does not exist yet')
        setCooldownTime(null)
        return
      }
      console.error('Error checking cooldown:', error)
    }
  }

  const fetchSuggestions = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      console.log('Fetching user suggestions for user:', user.id)
      
      const { data, error } = await supabase
        .from('game_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user suggestions:', error)
        throw error
      }
      
      console.log('User suggestions data:', data)
      setSuggestions(data || [])
    } catch (error) {
      // If table doesn't exist, show empty state
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        console.warn('game_suggestions table does not exist yet')
        setSuggestions([])
        return
      }
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavoriteGames = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch user's favorite games with game details
      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select(`
          game_id,
          games (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (favoritesData) {
        // Get games with stats
        const gamesWithStats = await Promise.all(
          favoritesData.map(async (favorite: any) => {
            const game = favorite.games
            
            // Get average rating and review count
            const { data: reviews } = await supabase
              .from('reviews')
              .select('rating')
              .eq('game_id', game.id)

            const reviewCount = reviews?.length || 0
            const averageRating = reviewCount > 0 
              ? reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
              : 0

            return {
              ...game,
              averageRating,
              reviewCount,
              isFavorite: true
            }
          })
        )

        setFavoriteGames(gamesWithStats)
      }
    } catch (error) {
      console.error('Error fetching favorite games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async (gameId: string) => {
    if (!user) return

    try {
      // Remove from favorites
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId)

      // Update local state
      setFavoriteGames(prev => prev.filter(game => game.id !== gameId))
    } catch (error) {
      console.error('Error removing from favorites:', error)
    }
  }

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !suggestionForm.gameTitle.trim() || !suggestionForm.description.trim()) return

    // Check cooldown
    if (cooldownTime && new Date() < cooldownTime) {
      setErrorMessage(t('suggestions.cooldownMessage', { 
        time: formatCooldownTime(cooldownTime) 
      }))
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')
      setSuccessMessage('')

      console.log('Submitting suggestion:', {
        user_id: user.id,
        game_title: suggestionForm.gameTitle.trim(),
        description: suggestionForm.description.trim()
      })

      const { error } = await supabase
        .from('game_suggestions')
        .insert({
          user_id: user.id,
          game_title: suggestionForm.gameTitle.trim(),
          description: suggestionForm.description.trim()
        })

      if (error) {
        console.error('Error inserting suggestion:', error)
        throw error
      }

      console.log('Suggestion submitted successfully')
      setSuccessMessage(t('suggestions.successMessage'))
      setSuggestionForm({ gameTitle: '', description: '' })
      setShowSuggestionForm(false)
      fetchSuggestions()
      checkCooldown()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      // If table doesn't exist, show specific error
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        setErrorMessage('Game suggestions feature is not available yet. Please contact administrator.')
        return
      }
      console.error('Error submitting suggestion:', error)
      setErrorMessage(t('suggestions.errorMessage'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatCooldownTime = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`
    }
    return `${minutes}м`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
      case 'rejected':
        return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-8 mb-8">
        <div className="text-center">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}&background=8B5CF6&color=fff`}
            alt={user.first_name}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-200 dark:border-purple-600"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">@{user.username}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-purple-100 dark:border-gray-700 p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>{t('profile.overview')}</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'favorites'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{t('profile.favorites')}</span>
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'suggestions'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>{t('suggestions.title')}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {statsLoading ? '...' : stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.averageRating')}</div>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                {statsLoading ? '...' : stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.reviews')}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {statsLoading ? '...' : stats.totalFavorites}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.totalFavorites')}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : favoriteGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => onGameClick(game)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('profile.noFavorites')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('profile.noFavoritesDesc')}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div>
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Suggest Game Button */}
          <div className="mb-6">
            {cooldownTime && new Date() < cooldownTime ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-yellow-800 dark:text-yellow-200">
                    {t('suggestions.cooldownMessage', { 
                      time: formatCooldownTime(cooldownTime) 
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSuggestionForm(true)}
                className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-colors duration-200"
              >
                <Lightbulb className="w-5 h-5" />
                <span>{t('suggestions.title')}</span>
              </button>
            )}
          </div>

          {/* Suggestion Form */}
          {showSuggestionForm && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('suggestions.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('suggestions.description')}
              </p>
              
              <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('suggestions.gameTitle')}
                  </label>
                  <input
                    type="text"
                    value={suggestionForm.gameTitle}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, gameTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder={t('suggestions.gameTitlePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('suggestions.yourSuggestion')}
                  </label>
                  <textarea
                    value={suggestionForm.description}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder={t('suggestions.suggestionPlaceholder')}
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting || !suggestionForm.gameTitle.trim() || !suggestionForm.description.trim()}
                    className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('common.loading') : t('suggestions.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestionForm(false)
                      setSuggestionForm({ gameTitle: '', description: '' })
                      setErrorMessage('')
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Suggestions */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('suggestions.mySuggestions')}
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {suggestion.game_title}
                      </h4>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                        {getStatusIcon(suggestion.status)}
                        <span>{t(`suggestions.status.${suggestion.status}`)}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {t('suggestions.submittedOn', { 
                          date: new Date(suggestion.created_at).toLocaleDateString() 
                        })}
                      </span>
                      {suggestion.reviewed_at && (
                        <span>
                          {t('suggestions.reviewedOn', { 
                            date: new Date(suggestion.reviewed_at).toLocaleDateString() 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('suggestions.noSuggestions')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}