import React from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Heart, Star, Smartphone, Monitor } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

type Game = Database['public']['Tables']['games']['Row'] & {
  averageRating?: number
  reviewCount?: number
  isFavorite?: boolean
}

interface GameCardProps {
  game: Game
  onClick?: () => void
  onFavoriteToggle?: (gameId: string) => void
  compact?: boolean
}

export const GameCard = ({ game, onClick, onFavoriteToggle, compact = false }: GameCardProps) => {
  const { t, i18n } = useTranslation()
  const { isRestricted } = useAuth()

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isRestricted) {
      onFavoriteToggle?.(game.id)
    }
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Use the specific download link for this game, or fallback to default
    const downloadUrl = game.download_link || 'https://t.me/hentgamefile/'
    // Open the URL directly without any domain prefix
    window.open(downloadUrl, '_blank')
  }

  const getDescription = () => {
    return i18n.language === 'ru' ? game.description_ru : game.description_en
  }

  const getPlatforms = () => {
    return game.platforms?.length > 0 ? game.platforms : [game.platform]
  }

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] group"
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img
              src={game.cover_url || 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop'}
              alt={game.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
              {game.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1">
                {getPlatforms().map((platform, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    {platform === 'Android' ? (
                      <Smartphone className="w-4 h-4 text-green-500" />
                    ) : (
                      <Monitor className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">{platform}</span>
                  </div>
                ))}
              </div>
              {game.averageRating && (
                <>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{game.averageRating.toFixed(1)}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleFavoriteClick}
            disabled={isRestricted}
            className={`p-2 rounded-full transition-all duration-200 ${
              isRestricted
                ? 'text-gray-400 cursor-not-allowed opacity-50'
                : game.isFavorite
                ? 'text-pink-500 hover:text-pink-600 bg-pink-50 dark:bg-pink-900/20'
                : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'
            }`}
            title={isRestricted ? 'Action restricted for this user' : undefined}
          >
            <Heart className={`w-5 h-5 ${game.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.02] group"
    >
      <div className="relative">
        <img
          src={game.cover_url || 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'}
          alt={game.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {getPlatforms().map((platform, index) => (
            <div
              key={index}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                platform === 'Android' 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              }`}
            >
              {platform === 'Android' ? (
                <Smartphone className="w-3 h-3" />
              ) : (
                <Monitor className="w-3 h-3" />
              )}
              <span>{platform}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleFavoriteClick}
          disabled={isRestricted}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            isRestricted
              ? 'text-gray-400 cursor-not-allowed opacity-50 bg-black/20'
              : game.isFavorite
              ? 'text-pink-500 hover:text-pink-600 bg-white/80 dark:bg-gray-800/80'
              : 'text-white hover:text-pink-300 bg-black/20 hover:bg-white/80 dark:hover:bg-gray-800/80'
          }`}
          title={isRestricted ? 'Action restricted for this user' : undefined}
        >
          <Heart className={`w-5 h-5 ${game.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
          {game.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {getDescription() || 'No description available'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {game.averageRating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {game.averageRating.toFixed(1)}
                </span>
                {game.reviewCount && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">({game.reviewCount})</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {game.genres.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleDownloadClick}
          className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group-hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">{t('games.download')}</span>
        </button>
      </div>
    </div>
  )
}