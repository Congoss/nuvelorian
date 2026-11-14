import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const loaders = {
  en: () => import('./locales/en.json'),
  ru: () => import('./locales/ru.json'),
  uk: () => import('./locales/uk.json'),
};
const backend = {
  type: 'backend',
  read(language, namespace, callback) {
    const key = language === 'ua' ? 'uk' : language;
    (loaders[key] || loaders.en)().then(module => callback(null, module.default), callback);
  },
};
let language = 'en';
try { language = window.localStorage.getItem('game_language') || 'en'; } catch {}
export const i18nReady = i18n.use(backend).use(initReactI18next).init({
  lng: language,
  supportedLngs: ['en', 'ru', 'uk', 'ua'],
  load: 'languageOnly',
  fallbackLng: false,
  interpolation: { escapeValue: false },
});
export default i18n;
