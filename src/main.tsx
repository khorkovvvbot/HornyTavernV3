import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Telegram WebApp script and wait for it to load
const loadTelegramScript = () => {
  return new Promise<void>((resolve) => {
    // Check if script is already loaded
    if (window.Telegram?.WebApp) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.onload = () => {
      console.log('Telegram WebApp script loaded')
      // Give it a moment to initialize
      setTimeout(resolve, 100)
    }
    script.onerror = () => {
      console.log('Failed to load Telegram WebApp script')
      resolve() // Continue anyway for development
    }
    document.head.appendChild(script)
  })
}

// Initialize app after Telegram script loads
loadTelegramScript().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})