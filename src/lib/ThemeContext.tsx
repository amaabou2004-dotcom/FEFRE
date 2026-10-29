import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'excellence-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode;
        if (saved === 'light' || saved === 'dark') return saved;
      } catch (e) {
        console.warn('Unable to access localStorage for theme:', e);
      }
    }
    return 'dark'; // Dark luxury corporate default
  });

  const applyTheme = (currentTheme: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    
    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      body.classList.add('dark');
      body.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      body.classList.remove('dark');
      body.setAttribute('data-theme', 'light');
    }

    try {
      localStorage.setItem(STORAGE_KEY, currentTheme);
    } catch (e) {
      console.warn('Unable to save theme in localStorage:', e);
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Synchronize across open tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue as ThemeMode);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside Provider
    if (typeof window !== 'undefined') {
      const isDarkClass = document.documentElement.classList.contains('dark');
      return {
        theme: isDarkClass ? 'dark' : 'light',
        isDark: isDarkClass,
        isLight: !isDarkClass,
        toggleTheme: () => {
          const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          }
          try {
            localStorage.setItem(STORAGE_KEY, next);
          } catch (e) {}
        },
        setTheme: (t) => {
          if (t === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          }
          try {
            localStorage.setItem(STORAGE_KEY, t);
          } catch (e) {}
        },
      };
    }
    return {
      theme: 'dark',
      isDark: true,
      isLight: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
