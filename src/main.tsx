import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add Telegram WebApp script
const script = document.createElement('script')
script.src = 'https://telegram.org/js/telegram-web-app.js'
document.head.appendChild(script)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)