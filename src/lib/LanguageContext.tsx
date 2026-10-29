import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, TRANSLATIONS } from './translations';

interface LanguageContextType {
  language: Language;
  isEnglish: boolean;
  isFrench: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'excellence-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Language;
        if (saved === 'fr' || saved === 'en') return saved;

        // Auto-detect browser language if English
        const browserLang = navigator.language?.toLowerCase() || '';
        if (browserLang.startsWith('en')) {
          return 'en';
        }
      } catch (e) {
        console.warn('Unable to access localStorage for language:', e);
      }
    }
    return 'fr'; // French is official language of Niger & default
  });

  const applyLanguage = useCallback((lang: Language) => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Unable to save language in localStorage:', e);
    }
  }, []);

  useEffect(() => {
    applyLanguage(language);
  }, [language, applyLanguage]);

  // Synchronize across open browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'fr' || e.newValue === 'en')) {
        setLanguageState(e.newValue as Language);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
  }, []);

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      const entry = TRANSLATIONS[key];
      if (entry) {
        return entry[language] || entry.fr || defaultText || key;
      }
      return defaultText !== undefined ? defaultText : key;
    },
    [language]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      isEnglish: language === 'en',
      isFrench: language === 'fr',
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const isDocEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const lang: Language = isDocEn ? 'en' : 'fr';
    return {
      language: lang,
      isEnglish: isDocEn,
      isFrench: !isDocEn,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, defaultText?: string) => {
        const entry = TRANSLATIONS[key];
        return entry ? entry[lang] || defaultText || key : defaultText || key;
      },
    };
  }
  return context;
}
