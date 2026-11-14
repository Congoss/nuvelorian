import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { getAchievementLanguage } from './playerAchievements';
export const AchievementClaimContext = createContext(null);
export const ViewerLanguageContext = createContext(null);
export function useAchievementLanguage(requestedLanguage, preview = false) {
  const viewerLanguage = useContext(ViewerLanguageContext);
  const { i18n } = useTranslation();
  return getAchievementLanguage(preview ? requestedLanguage : viewerLanguage || i18n.resolvedLanguage || i18n.language || requestedLanguage);
}
