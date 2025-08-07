interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isProgressVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    setParams: (params: any) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export const getTelegramWebApp = (): TelegramWebApp | null => {
  return window.Telegram?.WebApp || null
}

export const getTelegramUser = (): TelegramUser | null => {
  const webApp = getTelegramWebApp()
  
  if (!webApp) {
    console.log('Telegram WebApp not available')
    return null
  }
  
  console.log('Telegram WebApp data:', {
    initData: webApp.initData,
    initDataUnsafe: webApp.initDataUnsafe,
    user: webApp.initDataUnsafe?.user
  })
  
  return webApp.initDataUnsafe?.user || null
}

export const initTelegramWebApp = () => {
  const webApp = getTelegramWebApp()
  if (webApp) {
    console.log('Initializing Telegram WebApp...')
    webApp.ready()
    webApp.expand()
    
    // Set theme based on Telegram
    if (webApp.colorScheme) {
      document.documentElement.classList.toggle('dark', webApp.colorScheme === 'dark')
    }
  } else {
    console.log('Telegram WebApp not available, using mock data')
  }
}

export const isAdmin = (telegramId?: number): boolean => {
  return telegramId === 7727946466
}

export const mockTelegramUser = (): TelegramUser => {
  // For development purposes when not in Telegram
  console.log('Using mock Telegram user for development')
  return {
    id: 123456789,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    language_code: 'en'
  }
}

// Check if running in Telegram
export const isInTelegram = (): boolean => {
  return !!(window.Telegram?.WebApp)
}

// Wait for Telegram WebApp to be ready
export const waitForTelegram = (): Promise<TelegramWebApp | null> => {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp) {
      resolve(window.Telegram.WebApp)
      return
    }
    
    // Wait up to 3 seconds for Telegram to load
    let attempts = 0
    const maxAttempts = 30
    
    const checkTelegram = () => {
      attempts++
      if (window.Telegram?.WebApp) {
        resolve(window.Telegram.WebApp)
      } else if (attempts >= maxAttempts) {
        console.log('Telegram WebApp not loaded after 3 seconds')
        resolve(null)
      } else {
        setTimeout(checkTelegram, 100)
      }
    }
    
    checkTelegram()
  })
}