import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import App from '@/App.jsx'
import '@/index.css'
import './i18n'
import { initializeTelegramMiniApp } from '@/lib/platform/telegram'

initializeTelegramMiniApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
