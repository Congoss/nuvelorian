import MedalPaletteFilters from '@/components/game/MedalPaletteFilters';
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import App from '@/App.jsx'
import '@/index.css'
import { i18nReady } from './i18n'
import { initializeTelegramMiniApp } from '@/lib/platform/telegram'

initializeTelegramMiniApp();

i18nReady.then(() => ReactDOM.createRoot(document.getElementById('root')).render(
  <><MedalPaletteFilters/><App /></>
))
