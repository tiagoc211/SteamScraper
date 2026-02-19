// Helper hook for common i18n operations
import { useTranslation } from 'react-i18next';

export const useI18n = () => {
  const { t, i18n } = useTranslation();

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
    availableLanguages: ['en', 'es', 'pt', 'fr', 'de', 'zh-CN', 'ja', 'ru'],
    isLoading: i18n.isInitialized === false,
    
    // Helper methods
    formatLanguageName: (code) => {
      const names = {
        en: 'English',
        es: 'Español',
        pt: 'Português',
        fr: 'Français',
        de: 'Deutsch',
        'zh-CN': '中文',
        ja: '日本語',
        ru: 'Русский',
      };
      return names[code] || code;
    },

    // Get translated key with fallback
    getTranslation: (key, defaultValue = key) => {
      const translated = t(key);
      return translated === key ? defaultValue : translated;
    },

    // Check if translation key exists
    hasTranslation: (key) => {
      const translated = t(key);
      return translated !== key;
    },
  };
};

export default useI18n;
