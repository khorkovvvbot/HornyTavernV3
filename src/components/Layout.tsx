import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, User, Menu, X, Gamepad2, Moon, Sun, Settings, Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'

interface LayoutProps {
  children: React.ReactNode
  onSearch?: (query: string) => void
  onProfileClick?: () => void
  onHomeClick?: () => void
  onAdminClick?: () => void
}

export const Layout = ({ children, onSearch, onProfileClick, onHomeClick, onAdminClick }: LayoutProps) => {
  const { t, i18n } = useTranslation()
  const { user, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotifications(user)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const handleHomeClick = () => {
    onHomeClick?.()
    setShowMobileMenu(false)
  }

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setShowSettings(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={handleHomeClick}
              className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold hidden sm:block">HornyTavern</span>
            </button>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </form>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors duration-200 relative"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      {t('nav.language')}
                    </div>
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                        i18n.language === 'en' ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage('ru')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                        i18n.language === 'ru' ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Русский
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Profile Button */}
              <button
                onClick={onProfileClick}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-purple-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.first_name}
                    className="w-8 h-8 rounded-full border-2 border-purple-200 dark:border-purple-600 group-hover:border-purple-300 dark:group-hover:border-purple-500 transition-colors duration-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                  {user?.first_name || 'User'}
                </span>
                {isAdmin && (
                  <span className="hidden sm:block px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                    {t('nav.admin')}
                  </span>
                )}
              </button>

              {/* Admin Button */}
              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="hidden sm:block px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full hover:shadow-lg transition-all duration-200"
                >
                  {t('nav.adminPanel')}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </form>
              
              {isAdmin && (
                <button
                  onClick={() => {
                    onAdminClick?.()
                    setShowMobileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200"
                >
                  {t('nav.adminPanel')}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Settings Overlay */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Notification Panel */}
      <NotificationPanel
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClear={clearNotifications}
      />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}