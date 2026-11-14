import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ua from './locales/uk.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem('game_language') : null;

const resources = {
  ua: { translation: ua },
  uk: { translation: ua },
  ru: { translation: ru },
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: storedLanguage || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
