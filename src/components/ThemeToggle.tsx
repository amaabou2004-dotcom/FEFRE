import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export interface ThemeToggleProps {
  theme?: 'light' | 'dark';
  onToggle?: () => void;
  className?: string;
  showLabel?: boolean;
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme: propTheme,
  onToggle: propOnToggle,
  className = '',
  showLabel = false,
  id,
}) => {
  const themeContext = useTheme();

  // Use props if explicitly passed, otherwise use ThemeContext
  const currentTheme = propTheme || themeContext.theme;
  const handleToggle = propOnToggle || themeContext.toggleTheme;
  const isDark = currentTheme === 'dark';

  const label = isDark ? 'Mode clair' : 'Mode sombre';
  const tooltip = isDark
    ? 'Passer au mode clair (Actuellement : Mode Sombre)'
    : 'Passer au mode sombre (Actuellement : Mode Clair)';

  if (showLabel) {
    return (
      <button
        id={id || (isDark ? 'theme-toggle-btn-with-label-dark' : 'theme-toggle-btn-with-label-light')}
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 border cursor-pointer select-none text-xs font-semibold ${
          isDark
            ? 'bg-[#0A2254] hover:bg-[#113174] text-[#D4AF37] border-[#D4AF37]/40 shadow-sm'
            : 'bg-white hover:bg-[#F0F4FA] text-[#01184C] border-[#DDE4EE] shadow-sm'
        } ${className}`}
        aria-label={label}
        title={tooltip}
      >
        <span className="relative flex items-center justify-center w-5 h-5">
          {isDark ? (
            <Sun className="w-4 h-4 text-[#D4AF37] transition-transform duration-300 rotate-0" />
          ) : (
            <Moon className="w-4 h-4 text-[#01184C] transition-transform duration-300 rotate-0" />
          )}
        </span>
        <span className="tracking-wide">{label}</span>
      </button>
    );
  }

  return (
    <motion.button
      id={id || (isDark ? 'theme-toggle-button-dark' : 'theme-toggle-button-light')}
      type="button"
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 border cursor-pointer ${
        isDark
          ? 'bg-[#0A2254] text-[#D4AF37] border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
          : 'bg-white text-[#01184C] border-[#DDE4EE] hover:border-[#D4AF37] hover:shadow-md'
      } shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${className}`}
      aria-label={label}
      aria-pressed={isDark}
      title={tooltip}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-300 text-[#D4AF37] hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 text-[#01184C] hover:-rotate-12" />
      )}
    </motion.button>
  );
};
