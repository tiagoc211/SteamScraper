import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import resources
import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';
import ptCommon from '../locales/pt/common.json';
import frCommon from '../locales/fr/common.json';
import deCommon from '../locales/de/common.json';
import zhCNCommon from '../locales/zh-CN/common.json';
import jaCommon from '../locales/ja/common.json';
import ruCommon from '../locales/ru/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  es: {
    common: esCommon,
  },
  pt: {
    common: ptCommon,
  },
  fr: {
    common: frCommon,
  },
  de: {
    common: deCommon,
  },
  'zh-CN': {
    common: zhCNCommon,
  },
  ja: {
    common: jaCommon,
  },
  ru: {
    common: ruCommon,
  },
};

i18n
  // Load plugin for browser language detection
  .use(LanguageDetector)
  // Initialize i18next-react-plugin
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
