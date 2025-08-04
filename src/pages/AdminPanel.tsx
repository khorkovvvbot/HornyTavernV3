import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Save, X, Upload, Link, Image, Tag, ArrowLeft, Lightbulb } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { GenreManager } from '../components/GenreManager'
import type { Database } from '../lib/database'

type Game = Database['public']['Tables']['games']['Row']
type Genre = Database['public']['Tables']['genres']['Row']
type GameSuggestion = Database['public']['Tables']['game_suggestions']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
}

interface AdminPanelProps {
  onBack: () => void
}

type AdminView = 'main' | 'genres' | 'suggestions'

export const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuth()
  const [currentView, setCurrentView] = useState<AdminView>('main')
  const [games, setGames] = useState<Game[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([])
  const [showGameForm, setShowGameForm] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description_en: '',
    description_ru: '',
    cover_url: '',
    download_link: '',
    platforms: [] as ('Android' | 'Windows')[],
    genres: [] as string[],
    screenshots: [] as string[]
  })

  const [newGenre, setNewGenre] = useState('')
  const [showGenreForm, setShowGenreForm] = useState(false)
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [showScreenshotUpload, setShowScreenshotUpload] = useState(false)
  const [coverUrlInput, setCoverUrlInput] = useState('')
  const [screenshotUrlInput, setScreenshotUrlInput] = useState('')

  useEffect(() => {
    fetchData()
    if (currentView === 'suggestions') {
      fetchSuggestions()
    }
  }, [currentView])

  const fetchData = async () => {
    try {
      const [gamesResponse, genresResponse] = await Promise.all([
        supabase.from('games').select('*').order('created_at', { ascending: false }),
        supabase.from('genres').select('*').order('name')
      ])

      if (gamesResponse.data) setGames(gamesResponse.data)
      if (genresResponse.data) setGenres(genresResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      setSuggestionsLoading(true)
      
      console.log('Fetching game suggestions...')
      const { data, error } = await supabase
        .from('game_suggestions')
        .select(`
          *,
          users!game_suggestions_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching suggestions:', error)
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('game_suggestions table does not exist yet')
          setSuggestions([])
          return
        }
        throw error
      }

      console.log('Raw suggestions data:', data)
      
      // Transform the data to match our interface
      const transformedSuggestions = (data || []).map(suggestion => ({
        ...suggestion,
        user: suggestion.users
      }))
      
      console.log('Transformed suggestions:', transformedSuggestions)
      setSuggestions(transformedSuggestions)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const updateSuggestionStatus = async (suggestionId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('game_suggestions')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser?.id || null
        })
        .eq('id', suggestionId)

      if (error) throw error

      // Refresh suggestions
      fetchSuggestions()
    } catch (error) {
      console.error('Error updating suggestion status:', error)
      alert(`Ошибка при обновлении статуса предложения: ${error?.message || 'Неизвестная ошибка'}`)
    }
  }
  const resetForm = () => {
    setFormData({
      title: '',
      description_en: '',
      description_ru: '',
      cover_url: '',
      download_link: '',
      platforms: [],
      genres: [],
      screenshots: []
    })
    setEditingGame(null)
    setShowGameForm(false)
    setCoverUrlInput('')
    setScreenshotUrlInput('')
    setShowCoverUpload(false)
    setShowScreenshotUpload(false)
  }

  const uploadFile = async (file: File, folder: string = 'games'): Promise<string | null> => {
    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('game-assets')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleCoverFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const url = await uploadFile(file, 'covers')
    if (url) {
      setFormData(prev => ({ ...prev, cover_url: url }))
      setShowCoverUpload(false)
    } else {
      alert('Failed to upload image. Please try again.')
    }
  }

  const handleScreenshotFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const uploadPromises = Array.from(files).map(async (file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.name)
        return null
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.name)
        return null
      }

      return await uploadFile(file, 'screenshots')
    })

    const urls = await Promise.all(uploadPromises)
    const validUrls = urls.filter(url => url !== null) as string[]

    if (validUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, ...validUrls]
      }))
      setShowScreenshotUpload(false)
    } else {
      alert('Failed to upload screenshots. Please try again.')
    }
  }

  const handleCoverUrlAdd = () => {
    if (coverUrlInput.trim()) {
      setFormData(prev => ({ ...prev, cover_url: coverUrlInput.trim() }))
      setCoverUrlInput('')
      setShowCoverUpload(false)
    }
  }

  const handleScreenshotUrlAdd = () => {
    if (screenshotUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, screenshotUrlInput.trim()]
      }))
      setScreenshotUrlInput('')
      setShowScreenshotUpload(false)
    }
  }

  const handleEditGame = (game: Game) => {
    setFormData({
      title: game.title,
      description_en: game.description_en,
      description_ru: game.description_ru,
      cover_url: game.cover_url,
      download_link: game.download_link,
      platforms: game.platforms?.length > 0 ? game.platforms as ('Android' | 'Windows')[] : [game.platform],
      genres: game.genres,
      screenshots: []
    })
    setEditingGame(game)
    setShowGameForm(true)
  }

  const handleSaveGame = async () => {
    if (formData.platforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    try {
      const gameData = {
        title: formData.title,
        description_en: formData.description_en,
        description_ru: formData.description_ru,
        cover_url: formData.cover_url,
        download_link: formData.download_link,
        platform: formData.platforms[0], // Primary platform for backward compatibility
        platforms: formData.platforms, // New multi-platform support
        genres: formData.genres,
        updated_at: new Date().toISOString()
      }

      if (editingGame) {
        // Update existing game
        await supabase
          .from('games')
          .update(gameData)
          .eq('id', editingGame.id)
      } else {
        // Create new game
        const { data: newGame } = await supabase
          .from('games')
          .insert(gameData)
          .select()
          .single()

        // Add screenshots if any
        if (newGame && formData.screenshots.length > 0) {
          const screenshotData = formData.screenshots.map((url, index) => ({
            game_id: newGame.id,
            image_url: url,
            order_index: index
          }))
          
          await supabase.from('screenshots').insert(screenshotData)
        }
      }

      // Handle screenshots for existing game
      if (editingGame && formData.screenshots.length > 0) {
        // Delete existing screenshots
        await supabase
          .from('screenshots')
          .delete()
          .eq('game_id', editingGame.id)

        // Add new screenshots
        const screenshotData = formData.screenshots.map((url, index) => ({
          game_id: editingGame.id,
          image_url: url,
          order_index: index
        }))
        
        await supabase.from('screenshots').insert(screenshotData)
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving game:', error)
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (confirm(t('admin.confirmDelete'))) {
      try {
        await supabase.from('games').delete().eq('id', gameId)
        fetchData()
      } catch (error) {
        console.error('Error deleting game:', error)
      }
    }
  }

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return

    try {
      await supabase.from('genres').insert({ name: newGenre.trim() })
      setNewGenre('')
      setShowGenreForm(false)
      fetchData()
    } catch (error) {
      console.error('Error adding genre:', error)
    }
  }

  const toggleGenre = (genreName: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genreName)
        ? prev.genres.filter(g => g !== genreName)
        : [...prev.genres, genreName]
    }))
  }

  const togglePlatform = (platform: 'Android' | 'Windows') => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }))
  }

  if (currentView === 'genres') {
    return <GenreManager onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'suggestions') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Предложения игр</h1>
            <p className="text-gray-600 dark:text-gray-400">Управление предложениями игр от пользователей</p>
          </div>
          <button
            onClick={() => setCurrentView('main')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Назад в админ-панель
          </button>
        </div>

        {/* Suggestions List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Предложения ({suggestions.length})
            </h2>
          </div>
          
          {suggestionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              Пока нет предложений игр
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {suggestion.game_title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.status === 'pending' 
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                            : suggestion.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        }`}>
                          {suggestion.status === 'pending' ? 'На рассмотрении' :
                           suggestion.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {suggestion.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <img
                            src={suggestion.user?.avatar_url || `https://ui-avatars.com/api/?name=${suggestion.user?.first_name || 'User'}&background=8B5CF6&color=fff`}
                            alt={suggestion.user?.first_name || 'User'}
                            className="w-6 h-6 rounded-full"
                          />
                          <span>
                            {suggestion.user?.first_name || 'Unknown'} {suggestion.user?.last_name || ''}
                          </span>
                        </div>
                        <span>•</span>
                        <span>
                          {new Date(suggestion.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        {suggestion.reviewed_at && (
                          <>
                            <span>•</span>
                            <span>
                              Рассмотрено: {new Date(suggestion.reviewed_at).toLocaleDateString('ru-RU')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {suggestion.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('admin.panel')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('admin.manageContent')}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentView('genres')}
            className="flex items-center space-x-2 bg-pink-500 text-white px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors duration-200"
          >
            <Tag className="w-4 h-4" />
            <span>{t('admin.manageGenres')}</span>
          </button>
          <button
            onClick={() => setCurrentView('suggestions')}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors duration-200"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Предложения игр</span>
          </button>
          <button
            onClick={() => setShowGameForm(true)}
            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.addGameButton')}</span>
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {t('admin.backToHome')}
          </button>
        </div>
      </div>

      {/* Game Form Modal */}
      {showGameForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingGame ? t('admin.editGame') : t('admin.addGame')}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.gameTitle')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('admin.enterTitle')}
                  />
                </div>

                {/* Descriptions */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.descriptionEn')}
                    </label>
                    <textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('admin.enterDescriptionEn')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.descriptionRu')}
                    </label>
                    <textarea
                      value={formData.description_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('admin.enterDescriptionRu')}
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.coverImage')}
                  </label>
                  <div className="space-y-3">
                    {formData.cover_url && (
                      <div className="relative inline-block">
                        <img
                          src={formData.cover_url}
                          alt={t('admin.coverPreview')}
                          className="w-32 h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, cover_url: '' }))}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    {!formData.cover_url && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowCoverUpload(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{t('admin.uploadImage')}</span>
                        </button>
                        <button
                          onClick={() => setShowCoverUpload(true)}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <Link className="w-4 h-4" />
                          <span>{t('admin.addUrl')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.downloadLinkLabel')}
                  </label>
                  <input
                    type="url"
                    value={formData.download_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, download_link: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://t.me/hentgamefile/"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('admin.defaultDownload')}
                  </p>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.platforms')}
                  </label>
                  <div className="flex space-x-4">
                    {['Android', 'Windows'].map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform as 'Android' | 'Windows')}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors duration-200 ${
                          formData.platforms.includes(platform as 'Android' | 'Windows')
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('admin.selectedPlatforms')}: {formData.platforms.join(', ') || t('admin.none')}
                  </p>
                </div>

                {/* Genres */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('admin.genresLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGenreForm(true)}
                      className="text-sm text-purple-500 hover:text-purple-600"
                    >
                      {t('admin.addNewGenre')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(genre => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleGenre(genre.name)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                          formData.genres.includes(genre.name)
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screenshots */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('admin.screenshotsLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowScreenshotUpload(true)}
                      className="flex items-center space-x-1 text-sm text-purple-500 hover:text-purple-600"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('admin.addScreenshots')}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.screenshots.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`${t('admin.screenshot')} ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGame}
                    disabled={uploading}
                    className="flex items-center space-x-2 bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{uploading ? t('admin.uploading') : editingGame ? t('admin.updateGame') : t('admin.createGame')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Upload Modal */}
      {showCoverUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.coverImage')}</h3>
              <button
                onClick={() => setShowCoverUpload(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.uploadFromDevice')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.maxFileSize')}</p>
              </div>
              
              <div className="text-center text-gray-500 dark:text-gray-400">{t('admin.or')}</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.imageUrl')}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={coverUrlInput}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    onClick={handleCoverUrlAdd}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
                  >
                    {t('admin.add')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Upload Modal */}
      {showScreenshotUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.addScreenshots')}</h3>
              <button
                onClick={() => setShowScreenshotUpload(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.uploadFromDevice')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.maxFileSize')} {t('admin.selectMultiple')}</p>
              </div>
              
              <div className="text-center text-gray-500 dark:text-gray-400">{t('admin.or')}</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.imageUrl')}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={screenshotUrlInput}
                    onChange={(e) => setScreenshotUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/screenshot.jpg"
                  />
                  <button
                    onClick={handleScreenshotUrlAdd}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
                  >
                    {t('admin.add')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genre Form Modal */}
      {showGenreForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.addNewGenre')}</h3>
            <input
              type="text"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              placeholder={t('admin.genreName')}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowGenreForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddGenre}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
              >
                {t('admin.addGenre')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="text-gray-900 dark:text-white">{t('admin.uploading')}</span>
          </div>
        </div>
      )}

      {/* Games List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('admin.gamesCount')} ({games.length})</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {games.map(game => (
            <div key={game.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={game.cover_url || 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
                  alt={game.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{game.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {game.platforms?.length > 0 ? game.platforms.join(', ') : game.platform}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {game.genres.slice(0, 3).map((genre, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditGame(game)}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGame(game.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {games.length === 0 && (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {t('admin.noGames')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}