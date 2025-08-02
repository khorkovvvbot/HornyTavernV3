import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, testConnection } from '../lib/database'
import { GameSlider } from '../components/GameSlider'
import { GameCard } from '../components/GameCard'
import { Filter, X, AlertCircle, RefreshCw, WifiOff, Globe, Grid3X3, Star } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import type { Database } from '../lib/database'

type Game = Database['public']['Tables']['games']['Row'] & {
  averageRating?: number
  reviewCount?: number
  isFavorite?: boolean
}

interface HomeProps {
  onGameClick?: (game: Game) => void
  searchQuery?: string
}

interface ConnectionError {
  message: string
  suggestions: string[]
}

const GAMES_PER_PAGE = 12

export const Home = ({ onGameClick, searchQuery = '' }: HomeProps) => {
  const { t } = useTranslation()
  const { user, isRestricted } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [allGamesForInfiniteScroll, setAllGamesForInfiniteScroll] = useState<Game[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllGames, setShowAllGames] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreGames, setHasMoreGames] = useState(true)
  const [filters, setFilters] = useState({
    platform: '',
    genres: [] as string[],
    rating: 0 // 0 means no rating filter, 1-5 for specific ratings
  })

  const { isFetching, setTargetRef, setIsFetchingComplete } = useInfiniteScroll(
    () => {
      if (showAllGames && hasMoreGames) {
        loadMoreGames()
      }
    }
  )

  useEffect(() => {
    initializeData()
  }, [])

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(1)
    setHasMoreGames(true)
    if (showAllGames) {
      loadFilteredGames(1)
    }
  }, [filters, searchQuery])

  const initializeData = async () => {
    setLoading(true)
    
    try {
      await Promise.all([fetchGames(), fetchGenres()])
    } catch (error) {
      console.error('Initialization error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGames = async () => {
    try {
      console.log('Fetching games...')
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        // Если таблица не существует, показываем пустой список вместо ошибки
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Games table does not exist yet')
          setGames([])
          return
        }
        throw new Error(`Ошибка загрузки игр: ${error.message}`)
      }

      if (!data) {
        console.warn('No games data received')
        setGames([])
        return
      }

      console.log(`Loaded ${data.length} games`)

      // Fetch real stats for each game
      const gamesWithStats = await Promise.all(
        data.map(async (game) => {
          try {
            // Get average rating and review count
            const { data: reviews, error: reviewsError } = await supabase
              .from('reviews')
              .select('rating')
              .eq('game_id', game.id)

            if (reviewsError) {
              console.warn(`Error fetching reviews for game ${game.id}:`, reviewsError)
            }

            const reviewCount = reviews?.length || 0
            const averageRating = reviewCount > 0 
              ? reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
              : 0

            // Check if user has favorited this game
            let isFavorite = false
            if (user) {
              const { data: favorite, error: favoriteError } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('game_id', game.id)
                .maybeSingle()
              
              if (favoriteError) {
                console.warn(`Error checking favorite for game ${game.id}:`, favoriteError)
              }
              
              isFavorite = !!favorite
            }

            return {
              ...game,
              averageRating,
              reviewCount,
              isFavorite
            }
          } catch (error) {
            console.warn(`Error processing game ${game.id}:`, error)
            return {
              ...game,
              averageRating: 0,
              reviewCount: 0,
              isFavorite: false
            }
          }
        })
      )

      setGames(gamesWithStats)
    } catch (error) {
      console.error('Error in fetchGames:', error)
      throw error
    }
  }

  const fetchGenres = async () => {
    try {
      console.log('Fetching genres...')
      const { data, error } = await supabase
        .from('genres')
        .select('name')
        .order('name')

      if (error) {
        console.error('Supabase genres error:', error)
        // Если таблица не существует, просто не показываем жанры
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Genres table does not exist yet')
          setGenres([])
          return
        }
        throw new Error(`Ошибка загрузки жанров: ${error.message}`)
      }

      console.log(`Loaded ${data?.length || 0} genres`)
      setGenres(data?.map(g => g.name) || [])
    } catch (error) {
      console.error('Error in fetchGenres:', error)
      // Не прерываем работу приложения из-за ошибки жанров
      setGenres([])
    }
  }

  const loadFilteredGames = async (page: number) => {
    const filtered = getFilteredGames()
    const startIndex = (page - 1) * GAMES_PER_PAGE
    const endIndex = startIndex + GAMES_PER_PAGE
    const pageGames = filtered.slice(startIndex, endIndex)

    if (page === 1) {
      setAllGamesForInfiniteScroll(pageGames)
    } else {
      setAllGamesForInfiniteScroll(prev => [...prev, ...pageGames])
    }

    setHasMoreGames(endIndex < filtered.length)
    setIsFetchingComplete()
  }

  const loadMoreGames = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    loadFilteredGames(nextPage)
  }

  const getFilteredGames = () => {
    return games.filter(game => {
      // Search filter
      if (searchQuery && !game.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Platform filter
      if (filters.platform) {
        const gamePlatforms = game.platforms?.length > 0 ? game.platforms : [game.platform]
        if (!gamePlatforms.includes(filters.platform)) {
          return false
        }
      }

      // Genre filter
      if (filters.genres.length > 0) {
        const hasMatchingGenre = filters.genres.some(genre => game.genres.includes(genre))
        if (!hasMatchingGenre) return false
      }

      // Rating filter
      if (filters.rating > 0) {
        const gameRating = Math.round(game.averageRating || 0)
        if (gameRating !== filters.rating) return false
      }

      return true
    })
  }

  const handleFavoriteToggle = async (gameId: string) => {
    if (!user || isRestricted) return

    const game = games.find(g => g.id === gameId)
    if (!game) return

    try {
      if (game.isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', gameId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            game_id: gameId
          })
        
        if (error) throw error
      }

      setGames(prev => prev.map(g => 
        g.id === gameId 
          ? { ...g, isFavorite: !g.isFavorite }
          : g
      ))

      // Update infinite scroll games as well
      setAllGamesForInfiniteScroll(prev => prev.map(g => 
        g.id === gameId 
          ? { ...g, isFavorite: !g.isFavorite }
          : g
      ))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const filteredGames = getFilteredGames()

  // Топ 10 игр по рейтингу (только игры с рейтингом > 0)
  const topRatedGames = [...filteredGames]
    .filter(game => game.averageRating > 0)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 10)

  // Последние 15 добавленных игр
  const latestGames = [...filteredGames]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15)

  // Случайные игры (Featured)
  const featuredGames = [...filteredGames]
    .sort(() => Math.random() - 0.5)
    .slice(0, 12)

  // Игры с наибольшим количеством отзывов
  const mostReviewedGames = [...filteredGames]
    .filter(game => game.reviewCount > 0)
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 10)

  const toggleGenreFilter = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const clearFilters = () => {
    setFilters({ platform: '', genres: [], rating: 0 })
  }

  const handleShowAllGames = () => {
    setShowAllGames(true)
    setCurrentPage(1)
    loadFilteredGames(1)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <p className="text-gray-600 dark:text-gray-400">Загрузка игр...</p>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
        <div className="text-center max-w-3xl">
          <WifiOff className="w-20 h-20 text-red-500 mx-auto mb-6" />
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Проблема с подключением к интернету
          </h3>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200 font-medium">
                {connectionError.message}
              </p>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Это может быть связано с настройками вашего интернет-подключения
            </p>
          </div>

          {connectionError.suggestions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Попробуйте следующие решения:</span>
              </h4>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                {connectionError.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1 font-bold">•</span>
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={initializeData}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Попробовать подключиться снова</span>
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <p className="font-medium mb-2 text-gray-800 dark:text-gray-200">Для разработчиков:</p>
                <p className="text-gray-700 dark:text-gray-300">Проверьте настройки в файле .env:</p>
                <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs mt-1 text-gray-800 dark:text-gray-200">
                  VITE_SUPABASE_URL=ваш_url<br/>
                  VITE_SUPABASE_ANON_KEY=ваш_ключ
                </code>
                <p className="mt-2 text-gray-700 dark:text-gray-300">После изменения .env перезапустите сервер: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">npm run dev</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
          {t('home.hero.title').split(' ').slice(0, -1).join(' ')}{' '}
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('home.hero.title').split(' ').slice(-1)[0]}
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('search.filters')}</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-purple-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200 text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? t('search.hideFilters') : t('search.showFilters')}</span>
          </button>
        </div>

        {showFilters && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-6 space-y-6">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('search.platform')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, platform: '' }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    !filters.platform
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('search.allPlatforms')}
                </button>
                {['Android', 'Windows'].map(platform => (
                  <button
                    key={platform}
                    onClick={() => setFilters(prev => ({ ...prev, platform }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.platform === platform
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('search.filterByRating')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, rating: 0 }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filters.rating === 0
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('search.allRatings')}
                </button>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilters(prev => ({ ...prev, rating }))}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filters.rating === rating
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    <span>{rating}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Filter */}
            {genres.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('search.genres')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenreFilter(genre)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        filters.genres.includes(genre)
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(filters.platform || filters.genres.length > 0 || filters.rating > 0) && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  <span>{t('search.clear')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Sections */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 dark:text-gray-400">{t('games.noResults')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {games.length === 0 ? 'База данных пуста. Добавьте игры через админ-панель.' : 'Попробуйте изменить фильтры поиска.'}
          </p>
        </div>
      ) : (
        <>
          {/* Топ игры по рейтингу */}
          {topRatedGames.length > 0 && !showAllGames && (
            <GameSlider
              title={`🏆 ${t('games.topRated')}`}
              games={topRatedGames}
              onGameClick={onGameClick}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {/* Новые игры */}
          {latestGames.length > 0 && !showAllGames && (
            <GameSlider
              title={`🆕 ${t('games.newest')}`}
              games={latestGames}
              onGameClick={onGameClick}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {/* Рекомендуемые игры */}
          {featuredGames.length > 0 && !showAllGames && (
            <GameSlider
              title={`⭐ ${t('games.featured')}`}
              games={featuredGames}
              onGameClick={onGameClick}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {/* Популярные по отзывам */}
          {mostReviewedGames.length > 0 && !showAllGames && (
            <GameSlider
              title={`💬 ${t('games.mostReviewed')}`}
              games={mostReviewedGames}
              onGameClick={onGameClick}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {/* Все игры */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Grid3X3 className="w-6 h-6" />
                <span>{t('games.allGames')} ({filteredGames.length})</span>
              </h2>
              <button
                onClick={() => {
                  if (showAllGames) {
                    setShowAllGames(false)
                    setAllGamesForInfiniteScroll([])
                  } else {
                    handleShowAllGames()
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
              >
                {showAllGames ? t('games.hideAll') : t('games.showAll')}
              </button>
            </div>

            {showAllGames && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allGamesForInfiniteScroll.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onClick={() => onGameClick?.(game)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMoreGames && (
                  <div
                    ref={setTargetRef}
                    className="flex items-center justify-center py-8"
                  >
                    {isFetching ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400">{t('common.scrollToLoadMore')}</div>
                    )}
                  </div>
                )}

                {!hasMoreGames && allGamesForInfiniteScroll.length > 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('common.endOfList')}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}