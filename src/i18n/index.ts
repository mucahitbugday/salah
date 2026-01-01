import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tr from './locales/tr.json';
import en from './locales/en.json';

const LANGUAGE_STORAGE_KEY = '@salah:language';

export const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const language = (savedLanguage === 'tr' || savedLanguage === 'en') 
    ? savedLanguage 
    : 'tr';

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        tr: { translation: tr },
        en: { translation: en },
      },
      lng: language,
      fallbackLng: 'tr',
      interpolation: {
        escapeValue: false,
      },
    });

  return language;
};

export const changeLanguage = async (language: 'tr' | 'en') => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
};

export default i18n;

