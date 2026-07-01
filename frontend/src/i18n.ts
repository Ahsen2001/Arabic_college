import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en.json';
import translationAR from './locales/ar.json';
import translationTA from './locales/ta.json';
import translationSI from './locales/si.json';

// Fix import name
const initReact = initReactI18next;

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR },
  ta: { translation: translationTA },
  si: { translation: translationSI }
};

i18n
  .use(LanguageDetector)
  .use(initReact)
  .init({
    resources,
    fallbackLng: 'ar',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Handle text direction on language changes
const handleLangChange = (lng: string) => {
  const isRtl = lng === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

// Initial run
handleLangChange(i18n.language || 'ar');

i18n.on('languageChanged', (lng) => {
  handleLangChange(lng);
});

export default i18n;
