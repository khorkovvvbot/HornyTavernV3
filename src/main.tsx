import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Polyfill for process global object (required for pg library in browser)
if (typeof global === 'undefined') {
  (window as any).global = window;
}
if (typeof process === 'undefined') {
  (window as any).process = {
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    version: '',
    platform: 'browser'
  };
}

// Add Telegram WebApp script
const script = document.createElement('script')
script.src = 'https://telegram.org/js/telegram-web-app.js'
document.head.appendChild(script)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)