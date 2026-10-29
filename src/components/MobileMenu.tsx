import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Sparkles, MessageSquare, Phone, ShieldCheck, Bot, Globe } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Logo } from './Logo';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { SocialFollowButtons } from './SocialFollowButtons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}) => {
  const { currentPath, navigate } = useRouter();
  const { settings } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(settings.defaultWhatsAppMessage)}`;

  const navItems = [
    { label: t('nav.home', 'Accueil'), href: '/' },
    { label: t('nav.about', 'À propos'), href: '/a-propos' },
    { label: t('nav.services', 'Services'), href: '/services' },
    { label: t('nav.sectors', "Secteurs d'activité"), href: '/secteurs' },
    { label: t('nav.portfolio', 'Réalisations'), href: '/realisations' },
    { label: t('nav.news', 'Actualités'), href: '/actualites' },
    { label: t('nav.contact', 'Contact'), href: '/contact' },
  ];

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-white/98 dark:bg-[#01184C]/98 backdrop-blur-2xl text-[#0E1D38] dark:text-white overflow-y-auto overscroll-contain transition-colors duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <div
              className="cursor-pointer select-none"
              title="Double-tapez sur le logo pour accéder à l'administration"
            >
              <Logo
                size="sm"
                showSubtitle={false}
                onDoubleClick={() => {
                  onClose();
                  navigate('/admin');
                }}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle id="mobile-menu-theme-toggle-header" theme={theme} onToggle={onToggleTheme} className="w-9 h-9" />
              <motion.button
                id="close-mobile-menu"
                onClick={onClose}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-white hover:bg-[#D4AF37] hover:text-[#01184C] transition-colors cursor-pointer"
                aria-label="Fermer le menu mobile"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Nav Links & Controls */}
          <div className="flex-1 px-5 py-6 flex flex-col justify-between">
            <div>
              {/* Dedicated Language Selector Card - Spacious, never cramped, clear tap targets */}
              <div className="mb-6 p-3.5 rounded-2xl bg-slate-100/90 dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                    {isEnglish ? 'Choose Language' : 'Choisir la langue'}
                  </span>
                  <span className="text-[11px] font-bold text-[#01184C] dark:text-[#D4AF37] bg-white dark:bg-[#01184C] px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
                    {isEnglish ? '🇬🇧 English' : '🇫🇷 Français'}
                  </span>
                </div>
                <LanguageToggle id="mobile-menu-drawer-lang-toggle" variant="full" />
              </div>

              <motion.nav
                initial="closed"
                animate="open"
                variants={{
                  open: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
                  closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
                }}
                className="space-y-2"
              >
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? currentPath === '/'
                    : item.href.startsWith('/#')
                    ? currentPath === '/' && typeof window !== 'undefined' && window.location.hash === item.href.replace('/', '')
                    : currentPath.startsWith(item.href);
                return (
                  <motion.div
                    key={item.href}
                    variants={{
                      open: { opacity: 1, x: 0 },
                      closed: { opacity: 0, x: -16 },
                    }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between py-3 px-4 rounded-xl text-base font-medium transition-all ${
                        isActive
                          ? 'bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/50 font-bold shadow-xs'
                          : 'text-slate-700 dark:text-slate-200 hover:text-[#01184C] dark:hover:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-[#0A2254]/50'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isActive ? 'text-[#01184C] dark:text-[#D4AF37] translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>
            </div>

            {/* Bottom actions */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
              <motion.button
                id="mobile-menu-cta-ai"
                onClick={() => {
                  onClose();
                  navigate('/assistant-ia');
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/50 font-bold text-sm tracking-wide shadow-xs hover:bg-slate-200 dark:hover:bg-[#0A2254]/80 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>{t('hero.cta_ai', "Consulter l'Assistant IA")}</span>
              </motion.button>

              <motion.button
                id="mobile-menu-cta-devis"
                onClick={() => {
                  onClose();
                  navigate('/devis');
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sheen w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#D4AF37] text-[#01184C] font-bold text-sm tracking-wide shadow-lg hover:bg-[#E5C358] transition-all cursor-pointer"
              >
                <span>{t('nav.request_quote', 'Demander un devis')}</span>
                <Sparkles className="w-4 h-4" />
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <motion.a
                  id="mobile-menu-call"
                  href={`tel:${settings.phones[0]?.raw || '+22778798900'}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-white border border-slate-300 dark:border-white/15 font-semibold text-xs transition-all shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                  <span>{t('common.call_us', 'Appeler')}</span>
                </motion.a>

                <motion.a
                  id="mobile-menu-whatsapp"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-white border border-slate-300 dark:border-[#D4AF37]/40 font-semibold text-xs transition-all shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                  <span>WhatsApp</span>
                </motion.a>
              </div>

              <div className="pt-2 pb-1 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Thème du site :</span>
                <ThemeToggle id="mobile-menu-theme-toggle-drawer" showLabel className="text-xs py-1.5 px-3" />
              </div>

              <div className="pt-1">
                <SocialFollowButtons showTitle={true} title="Suivez-nous" size="sm" />
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                  <span>RCCM: {settings.rccm}</span>
                </div>
                <span>Niamey, Niger</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
