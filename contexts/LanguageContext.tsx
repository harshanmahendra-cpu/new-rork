import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { translations, Language } from '@/constants/translations';

const LANGUAGE_KEY = 'velan_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored === 'ta' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (e) {
        console.log('Failed to load language preference:', e);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
      console.log('Failed to save language preference:', e);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  return {
    language,
    setLanguage,
    t,
  };
});
