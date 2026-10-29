import React from 'react';
import { motion } from 'motion/react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export interface LanguageToggleProps {
  className?: string;
  id?: string;
  variant?: 'button' | 'pill' | 'segmented' | 'full';
  size?: 'sm' | 'md' | 'lg';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  id,
  variant = 'button',
  size = 'md',
}) => {
  const { language, setLanguage, toggleLanguage, isEnglish } = useLanguage();

  const handleSelectLanguage = (lang: 'fr' | 'en') => {
    setLanguage(lang);
  };

  // Variant: 'full' - Ideal for Mobile Menu Drawer (wide, clear, comfortable touch targets)
  if (variant === 'full') {
    return (
      <div
        id={id || 'language-selector-full'}
        className={`w-full grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#0A2254]/70 border border-slate-200 dark:border-white/10 ${className}`}
        role="group"
        aria-label="Sélectionner la langue du site"
      >
        <button
          type="button"
          onClick={() => handleSelectLanguage('fr')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
            !isEnglish
              ? 'bg-[#01184C] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#01184C] shadow-md font-extrabold scale-[1.01]'
              : 'bg-white dark:bg-[#01184C]/60 text-slate-700 dark:text-slate-200 hover:text-[#01184C] dark:hover:text-white border border-slate-200/80 dark:border-white/10'
          }`}
          aria-pressed={!isEnglish}
        >
          <span className="text-base" role="img" aria-label="Français">🇫🇷</span>
          <span>Français</span>
          {!isEnglish && <Check className="w-4 h-4 ml-1" />}
        </button>

        <button
          type="button"
          id="btn-drawer-translate-en"
          onClick={() => handleSelectLanguage('en')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
            isEnglish
              ? 'bg-[#01184C] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#01184C] shadow-md font-extrabold scale-[1.01]'
              : 'bg-white dark:bg-[#01184C]/60 text-slate-700 dark:text-slate-200 hover:text-[#01184C] dark:hover:text-white border border-slate-200/80 dark:border-white/10'
          }`}
          aria-pressed={isEnglish}
        >
          <span className="text-base" role="img" aria-label="English">🇬🇧</span>
          <span>English</span>
          {isEnglish && <Check className="w-4 h-4 ml-1" />}
        </button>
      </div>
    );
  }

  // Variant: 'segmented' - Dual pill [ 🇫🇷 FR | 🇬🇧 EN ] with guaranteed minimum width & zero cramped layout
  if (variant === 'segmented') {
    return (
      <div
        id={id || 'language-toggle-segmented'}
        className={`inline-flex items-center min-w-[110px] p-1 rounded-full bg-slate-100 dark:bg-[#0A2254] border border-slate-300 dark:border-white/20 shadow-xs select-none shrink-0 ${className}`}
        role="group"
        aria-label="Sélection de langue / Language selector"
      >
        <button
          type="button"
          id="lang-select-fr"
          onClick={() => handleSelectLanguage('fr')}
          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
            !isEnglish
              ? 'bg-[#01184C] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#01184C] shadow-sm font-black'
              : 'text-slate-600 hover:text-[#01184C] dark:text-slate-300 dark:hover:text-white'
          }`}
          aria-pressed={!isEnglish}
          title="Afficher le site en Français"
        >
          <span className="text-xs leading-none" role="img" aria-label="Français">🇫🇷</span>
          <span className="tracking-tight font-mono text-[11px]">FR</span>
        </button>

        <button
          type="button"
          id="lang-select-en"
          onClick={() => handleSelectLanguage('en')}
          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
            isEnglish
              ? 'bg-[#01184C] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#01184C] shadow-sm font-black'
              : 'text-slate-600 hover:text-[#01184C] dark:text-slate-300 dark:hover:text-white'
          }`}
          aria-pressed={isEnglish}
          title="Translate website to English (Mettre le site en anglais)"
        >
          <span className="text-xs leading-none" role="img" aria-label="English">🇬🇧</span>
          <span className="tracking-tight font-mono text-[11px]">EN</span>
        </button>
      </div>
    );
  }

  // Variant: 'pill' - Compact pill, perfect for mobile header or compact spaces
  if (variant === 'pill') {
    return (
      <motion.button
        id={id || 'language-toggle-pill'}
        type="button"
        onClick={toggleLanguage}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        className={`inline-flex items-center justify-center gap-1.5 min-w-[68px] h-9 px-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer select-none shadow-xs border ${
          isEnglish
            ? 'bg-[#01184C] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#01184C] border-[#01184C] dark:border-[#D4AF37]'
            : 'bg-white hover:bg-slate-50 dark:bg-[#0A2254] dark:hover:bg-[#01184C] text-[#01184C] dark:text-[#D4AF37] border-slate-300 dark:border-[#D4AF37]/40 hover:border-[#D4AF37]'
        } ${className}`}
        aria-label={isEnglish ? 'Passer en Français' : 'Translate to English'}
        title={isEnglish ? 'Passer en français (Switch to French)' : 'Translate to English (Mettre en anglais)'}
      >
        <span className="text-sm leading-none" role="img" aria-label={isEnglish ? 'French' : 'English'}>
          {isEnglish ? '🇫🇷' : '🇬🇧'}
        </span>
        <span className="font-mono text-[11px] tracking-tight font-black">
          {isEnglish ? 'FR' : 'EN'}
        </span>
      </motion.button>
    );
  }

  // Default Variant: 'button' - Prominent, explicit standalone translation button
  // When in French: clearly shows "🇬🇧 English" with Globe icon, inviting the user to translate to English
  // When in English: clearly shows "🇫🇷 Français", allowing easy return to French
  return (
    <motion.button
      id={id || 'navbar-translation-button'}
      type="button"
      onClick={toggleLanguage}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer select-none shadow-xs border ${
        isEnglish
          ? 'bg-[#01184C] text-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#01184C] border-[#01184C] dark:border-[#D4AF37] shadow-sm ring-2 ring-[#D4AF37]/30'
          : 'bg-white hover:bg-amber-50/50 dark:bg-[#0A2254] dark:hover:bg-[#01184C] text-[#01184C] dark:text-[#D4AF37] border-slate-300 dark:border-[#D4AF37]/50 hover:border-[#D4AF37]'
      } ${className}`}
      aria-label={isEnglish ? 'Passer en Français' : 'Mettre le site en Anglais'}
      title={
        isEnglish
          ? 'Afficher le site en Français (Switch to French)'
          : 'Mettre le site en Anglais (Translate website to English)'
      }
    >
      <Globe className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37] shrink-0" />
      <span className="text-sm leading-none" role="img" aria-label={isEnglish ? 'French' : 'English'}>
        {isEnglish ? '🇫🇷' : '🇬🇧'}
      </span>
      <span className="tracking-tight font-bold">
        {isEnglish ? 'Français' : 'English'}
      </span>
    </motion.button>
  );
};
