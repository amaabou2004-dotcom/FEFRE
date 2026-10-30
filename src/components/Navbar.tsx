import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, ChevronDown, Sparkles, ArrowRight, Bot, Mic } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../hooks/useLanguage';
import { MobileMenu } from './MobileMenu';
import { MobileBottomNav } from './MobileBottomNav';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useSiteData } from '../lib/DataContext';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const { currentPath, navigate } = useRouter();
  const { isScrolled } = useScrollPosition(25);
  const { services } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const activeServices = services.filter((s) => s.status !== 'hidden');
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTouchTapRef = useRef<number>(0);

  const navLinks = [
    { label: t('nav.home', 'Accueil'), href: '/' },
    { label: t('nav.about', 'À propos'), href: '/a-propos' },
    { label: t('nav.services', 'Services'), href: '/services', hasDropdown: true },
    { label: t('nav.sectors', "Secteurs d'activité"), href: '/secteurs' },
    { label: t('nav.portfolio', 'Réalisations'), href: '/realisations' },
    { label: t('nav.news', 'Actualités'), href: '/actualites' },
    { label: t('nav.contact', 'Contact'), href: '/contact' },
  ];

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  /* Toute navigation (lien, retour navigateur…) referme les menus ouverts. */
  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
  }, [currentPath]);

  const triggerAdminNavigation = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    navigate('/admin');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    // Set slight delay to distinguish single click (home) from double click (admin)
    clickTimeoutRef.current = setTimeout(() => {
      navigate('/');
      clickTimeoutRef.current = null;
    }, 280);
  };

  const handleLogoDoubleClick = (e?: React.MouseEvent | React.TouchEvent) => {
    triggerAdminNavigation(e);
  };

  // Dedicated touch double-tap listener on mobile navbar logo
  const handleLogoTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const diff = now - lastTouchTapRef.current;

    if (diff > 40 && diff < 380) {
      triggerAdminNavigation(e);
      lastTouchTapRef.current = 0;
    } else {
      lastTouchTapRef.current = now;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[calc(var(--site-header-height)+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top)] max-w-full transition-[background-color,border-color,box-shadow] duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-[#01184C]/98 backdrop-blur-xl border-b border-slate-200 dark:border-[#D4AF37]/35 shadow-md shadow-slate-200/50 dark:shadow-black/25'
            : 'bg-white/90 sm:bg-white/80 dark:bg-[#01184C] dark:sm:bg-[#01184C]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10'
        }`}
      >
        <div className="mx-auto flex h-full min-w-0 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <motion.div
            id="navbar-brand-logo"
            onClick={handleLogoClick}
            onDoubleClick={handleLogoDoubleClick}
            onTouchEnd={handleLogoTouchEnd}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex min-w-0 shrink items-center cursor-pointer select-none"
            title="Double-cliquez (ou double-tapez sur mobile) pour accéder à l'espace administrateur"
            role="button"
            tabIndex={0}
            aria-label={isEnglish ? 'Back to home page' : "Retour à l'accueil"}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            <Logo interactive={false} />
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? currentPath === '/'
                  : link.href.startsWith('/#')
                  ? currentPath === '/' && typeof window !== 'undefined' && window.location.hash === link.href.replace('/', '')
                  : currentPath.startsWith(link.href);

              if (link.hasDropdown) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setServicesDropdownOpen(true)}
                    onMouseLeave={() => setServicesDropdownOpen(false)}
                  >
                    <Link
                      href={link.href}
                      ariaCurrent={isActive ? 'page' : undefined}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors ${
                        isActive
                          ? 'text-[#01184C] dark:text-[#D4AF37] font-bold'
                          : 'text-slate-600 dark:text-gray-200 hover:text-[#01184C] dark:hover:text-[#D4AF37]'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="navbar-active-bg"
                          className="absolute inset-0 rounded-full bg-slate-100 dark:bg-[#0A2254]/80 border border-slate-300 dark:border-[#D4AF37]/35 -z-10 shadow-xs"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${
                          servicesDropdownOpen ? 'rotate-180 text-[#01184C] dark:text-[#D4AF37]' : ''
                        }`}
                      />
                    </Link>

                    <AnimatePresence>
                      {servicesDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute top-full left-0 w-80 mt-2 p-2 bg-white dark:bg-[#01184C]/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#D4AF37]/30 grid gap-1 z-50 origin-top-left"
                        >
                          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37]">
                              {t('nav.services_dropdown_title', "Nos 8 Domaines d'Expertise")}
                            </span>
                            <span className="text-[10px] text-[#01184C] dark:text-[#D4AF37] font-semibold bg-[#D4AF37]/20 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                              ★ 5 Étoiles
                            </span>
                          </div>
                          <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                            {activeServices.map((service) => (
                              <Link
                                key={service.id}
                                href={`/services/${service.slug}`}
                                onClick={() => setServicesDropdownOpen(false)}
                                className="flex items-start gap-2.5 p-2 rounded-xl text-xs text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#0A2254] hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-all duration-150 group"
                              >
                                <span className="font-mono text-[10px] text-[#01184C] dark:text-[#D4AF37] mt-0.5 font-bold group-hover:scale-110 transition-transform">
                                  {service.number}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium group-hover:translate-x-0.5 transition-transform leading-tight">
                                    {isEnglish && t(`service.${service.number}.title`) !== `service.${service.number}.title`
                                      ? t(`service.${service.number}.title`)
                                      : service.title}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-100 dark:border-white/10 px-2">
                            <Link
                              href="/services"
                              onClick={() => setServicesDropdownOpen(false)}
                              className="flex items-center justify-between text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] hover:underline py-1 transition-colors group"
                            >
                              <span>{t('nav.view_all_services', "Voir la vue d'ensemble")}</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ariaCurrent={isActive ? 'page' : undefined}
                  className={`relative px-3.5 py-2 rounded-full transition-colors ${
                    isActive
                      ? 'text-[#01184C] dark:text-[#D4AF37] font-bold'
                      : 'text-slate-600 dark:text-gray-200 hover:text-[#01184C] dark:hover:text-[#D4AF37]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-bg"
                      className="absolute inset-0 rounded-full bg-slate-100 dark:bg-[#0A2254]/80 border border-slate-300 dark:border-[#D4AF37]/35 -z-10 shadow-xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Utilities & CTA */}
          <div className="hidden lg:flex items-center">
            {/* Standalone Language Switcher - Distinct, un-crowded, separated */}
            <div className="flex items-center mr-1">
              <LanguageToggle id="navbar-language-toggle-desktop" variant="segmented" />
            </div>

            {/* Visual Divider - ensures the language button is not mixed with action buttons */}
            <div className="h-6 w-px bg-slate-200 dark:bg-white/20 mx-2.5" />

            {/* Quick Actions & CTAs */}
            <div className="flex items-center gap-2 xl:gap-2.5">
              {/* Theme Switcher */}
              <ThemeToggle id="navbar-theme-toggle-desktop" theme={theme} onToggle={onToggleTheme} />

              <motion.button
                type="button"
                id="navbar-open-ai-desktop"
                onClick={() => navigate('/assistant-ia')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#0A2254] dark:hover:bg-[#01184C] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-bold transition-all shadow-xs cursor-pointer"
                title={isEnglish ? "Chat with Excellence Services Virtual Advisor" : "Discuter avec le Conseiller Virtuel d'Excellence Services"}
              >
                <Bot className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                <span>{t('nav.consult_ai', 'Assistant IA')}</span>
              </motion.button>

              {/* ISA — assistant vocal (zarma / haoussa / français), façon Siri */}
              <motion.button
                type="button"
                id="navbar-open-voice-desktop"
                onClick={() => navigate('/assistant-vocal')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#01184C] hover:bg-[#0A2254] dark:bg-[#D4AF37] dark:hover:bg-[#E5C358] text-white dark:text-[#01184C] border border-[#01184C] dark:border-[#D4AF37] text-xs font-bold transition-all shadow-xs cursor-pointer"
                title={isEnglish ? 'ISA voice assistant — Zarma, Hausa, French' : 'Assistant vocal ISA — zarma, haoussa, français'}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isEnglish ? 'Voice ISA' : 'Assistant vocal'}</span>
              </motion.button>

              <motion.button
                id="navbar-cta-quote"
                onClick={() => navigate('/devis')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-sheen bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold gold-glow hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer shadow-md group shrink-0"
              >
                <span>{t('nav.request_quote', 'Demander un devis')}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#01184C] group-hover:rotate-12 transition-transform duration-300" />
              </motion.button>
            </div>
          </div>

          {/* Mobile buttons - Clean, spacious, not crammed */}
          <div className="flex shrink-0 items-center gap-2.5 lg:hidden">
            {/*
              Sur très petit écran, la langue reste accessible dans le panneau
              Menu : l'en-tête garde ainsi une mise en page stable, sans écrasement.
            */}
            <div className="hidden min-[430px]:block">
              <LanguageToggle id="navbar-language-toggle-mobile" variant="pill" />
            </div>

            {/* Mobile Menu Trigger — cible tactile de 44 × 44 px minimum */}
            <motion.button
              id="open-mobile-menu"
              type="button"
              onClick={openMobileMenu}
              whileTap={{ scale: 0.95 }}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#DDE4EE] dark:border-[#D4AF37]/30 bg-white dark:bg-[#0A2254] text-[#01184C] dark:text-white shadow-sm transition-colors hover:border-[#D4AF37]"
              aria-label={isEnglish ? 'Open the navigation menu' : 'Ouvrir le menu de navigation'}
              aria-haspopup="dialog"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="w-5 h-5 text-[#01184C] dark:text-[#D4AF37]" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <MobileBottomNav onOpenMenu={openMobileMenu} isMenuOpen={mobileMenuOpen} />
    </>
  );
};
