import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database'

type Genre = Database['public']['Tables']['genres']['Row']

interface GenreManagerProps {
  onBack: () => void
}

export const GenreManager = ({ onBack }: GenreManagerProps) => {
  const { t } = useTranslation()
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
  const [newGenreName, setNewGenreName] = useState('')
  const [editGenreName, setEditGenreName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('*')
        .order('name')

      if (error) throw error
      setGenres(data || [])
    } catch (error) {
      console.error('Error fetching genres:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGenre = async () => {
    if (!newGenreName.trim()) return

    try {
      const { error } = await supabase
        .from('genres')
        .insert({ name: newGenreName.trim() })

      if (error) throw error

      setNewGenreName('')
      setShowAddForm(false)
      fetchGenres()
    } catch (error) {
      console.error('Error adding genre:', error)
      alert(t('admin.genreAddError'))
    }
  }

  const handleEditGenre = async () => {
    if (!editingGenre || !editGenreName.trim()) return

    try {
      const { error } = await supabase
        .from('genres')
        .update({ name: editGenreName.trim() })
        .eq('id', editingGenre.id)

      if (error) throw error

      setEditingGenre(null)
      setEditGenreName('')
      fetchGenres()
    } catch (error) {
      console.error('Error updating genre:', error)
      alert(t('admin.genreUpdateError'))
    }
  }

  const handleDeleteGenre = async (genre: Genre) => {
    if (!confirm(t('admin.confirmDeleteGenre', { name: genre.name }))) {
      return
    }

    try {
      const { error } = await supabase
        .from('genres')
        .delete()
        .eq('id', genre.id)

      if (error) throw error
      fetchGenres()
    } catch (error) {
      console.error('Error deleting genre:', error)
      alert(t('admin.genreDeleteError'))
    }
  }

  const startEdit = (genre: Genre) => {
    setEditingGenre(genre)
    setEditGenreName(genre.name)
  }

  const cancelEdit = () => {
    setEditingGenre(null)
    setEditGenreName('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('admin.genreManagement')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('admin.genreManagementDesc')}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.addGenre')}</span>
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {t('admin.backToAdmin')}
          </button>
        </div>
      </div>

      {/* Add Genre Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('admin.addNewGenre')}</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              placeholder={t('admin.genreName')}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleAddGenre()}
            />
            <button
              onClick={handleAddGenre}
              disabled={!newGenreName.trim()}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('admin.add')}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewGenreName('')
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Genres List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Tag className="w-5 h-5" />
            <span>{t('admin.genres')} ({genres.length})</span>
          </h2>
        </div>
        
        {genres.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.noGenres')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {genres.map((genre) => (
              <div key={genre.id} className="p-6 flex items-center justify-between">
                {editingGenre?.id === genre.id ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <input
                      type="text"
                      value={editGenreName}
                      onChange={(e) => setEditGenreName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleEditGenre()}
                    />
                    <button
                      onClick={handleEditGenre}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{genre.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('admin.genreCreated', { 
                            date: new Date(genre.created_at).toLocaleDateString() 
                          }) || `Created ${new Date(genre.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(genre)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGenre(genre)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}