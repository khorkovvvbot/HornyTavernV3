import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { GameDetail } from './pages/GameDetail'
import { AdminPanel } from './pages/AdminPanel'
import { Profile } from './pages/Profile'
import { useAuth } from './hooks/useAuth'
import { useStats } from './hooks/useStats'
import { initTelegramWebApp } from './lib/telegram'
import './lib/i18n'
import type { Database } from './lib/database'

type Game = Database['public']['Tables']['games']['Row']

type Page = 'home' | 'game' | 'profile' | 'admin'

function AppContent() {
  const { i18n } = useTranslation()
  const { user, loading, isAdmin, connectionError } = useAuth()
  const { stats, loading: statsLoading } = useStats(user?.id)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Initialize Telegram WebApp after component mounts
    const initTelegram = async () => {
      console.log('App mounted, initializing Telegram WebApp...')
      initTelegramWebApp()
    }
    
    initTelegram()
  }, [])

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language)
    }
  }, [user?.language, i18n])

  const handleGameClick = (game: Game) => {
    setSelectedGame(game)
    setCurrentPage('game')
  }

  const handleBackToHome = () => {
    setSelectedGame(null)
    setCurrentPage('home')
  }

  const handleProfileClick = () => {
    setCurrentPage('profile')
  }

  const handleHomeClick = () => {
    setCurrentPage('home')
    setSelectedGame(null)
  }

  const handleAdminClick = () => {
    setCurrentPage('admin')
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage('home')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-3xl">
          <div className="w-20 h-20 text-red-500 mx-auto mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connection Error
          </h3>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 font-medium mb-2">
              {connectionError}
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Unable to connect to the database. Please check your internet connection.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Layout
        onSearch={handleSearch}
        onProfileClick={handleProfileClick}
        onHomeClick={handleHomeClick}
        onAdminClick={isAdmin ? handleAdminClick : undefined}
      >
        {currentPage === 'home' && (
          <Home
            onGameClick={handleGameClick}
            searchQuery={searchQuery}
          />
        )}
        
        {currentPage === 'game' && selectedGame && (
          <GameDetail
            game={selectedGame}
            onBack={handleBackToHome}
          />
        )}

        {currentPage === 'admin' && isAdmin && (
          <AdminPanel onBack={handleHomeClick} />
        )}
        
        {currentPage === 'profile' && (
          <Profile 
            user={user}
            stats={stats}
            statsLoading={statsLoading}
            onBack={handleHomeClick}
            onGameClick={handleGameClick}
          />
        )}
      </Layout>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App