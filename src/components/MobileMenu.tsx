import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  X,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Phone,
  ShieldCheck,
  Bot,
  Globe,
  ChevronDown,
} from 'lucide-react';
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
  const { settings, services } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const currentPathRef = useRef(currentPath);
  const openedPathRef = useRef(currentPath);
  const [servicesExpanded, setServicesExpanded] = useState(false);

  currentPathRef.current = currentPath;

  const whatsappNumber = settings.whatsappRaw || '22778798900';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    settings.defaultWhatsAppMessage || '',
  )}`;
  const activeServices = services.filter((service) => service.status !== 'hidden');

  const navItems = [
    { label: t('nav.home', 'Accueil'), href: '/' },
    { label: t('nav.about', 'À propos'), href: '/a-propos' },
    { label: t('nav.services', 'Services'), href: '/services', expandable: true },
    { label: t('nav.sectors', "Secteurs d'activité"), href: '/secteurs' },
    { label: t('nav.portfolio', 'Réalisations'), href: '/realisations' },
    { label: t('nav.news', 'Actualités'), href: '/actualites' },
    { label: t('nav.contact', 'Contact'), href: '/contact' },
  ];

  const isItemActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);

  const getServiceTitle = (service: (typeof activeServices)[number]) =>
    isEnglish && t(`service.${service.number}.title`) !== `service.${service.number}.title`
      ? t(`service.${service.number}.title`)
      : service.title;

  const closeAndNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  useEffect(() => {
    if (isOpen) {
      setServicesExpanded(currentPath.startsWith('/services/'));
    }
  }, [isOpen, currentPath]);

  /**
   * Verrouillage robuste du fond (y compris iOS Safari) :
   * le body est figé à sa position actuelle pendant l'ouverture, puis la
   * position est restaurée à la fermeture — sauf si l'utilisateur a navigué.
   */
  useEffect(() => {
    if (!isOpen) return;

    const documentElement = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const scrollbarWidth = Math.max(window.innerWidth - documentElement.clientWidth, 0);

    const previousStyles = {
      documentOverflow: documentElement.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
    };

    openedPathRef.current = currentPathRef.current;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    documentElement.classList.add('mobile-menu-open');
    body.classList.add('mobile-menu-open');
    body.style.top = `-${scrollY}px`;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      documentElement.classList.remove('mobile-menu-open');
      body.classList.remove('mobile-menu-open');
      documentElement.style.overflow = previousStyles.documentOverflow;
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.position = previousStyles.bodyPosition;
      body.style.top = previousStyles.bodyTop;
      body.style.width = previousStyles.bodyWidth;
      body.style.paddingRight = previousStyles.bodyPaddingRight;

      if (openedPathRef.current === currentPathRef.current) {
        window.scrollTo(0, scrollY);
      }

      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  /* Fermeture par Échap + focus contenu dans le panneau (accessibilité). */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /* Un panneau mobile ne doit jamais rester ouvert après passage en desktop. */
  useEffect(() => {
    if (!isOpen) return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (mediaQuery.matches) onClose();
    };
    closeOnDesktop();
    mediaQuery.addEventListener('change', closeOnDesktop);
    return () => mediaQuery.removeEventListener('change', closeOnDesktop);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-[#01184C]/60 backdrop-blur-[2px]"
          />

          <motion.aside
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            initial={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }
            }
            className="absolute inset-y-0 right-0 flex h-dvh w-[min(92vw,24rem)] transform-gpu flex-col bg-white dark:bg-[#01184C] text-[#0E1D38] dark:text-white shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            <h2 id="mobile-menu-title" className="sr-only">
              {t('nav.menu', 'Menu')}
            </h2>

            {/* En-tête fixe du panneau */}
            <div className="flex h-[var(--site-header-height)] shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/10 px-4">
              <Logo
                size="sm"
                showSubtitle={false}
                onDoubleClick={() => closeAndNavigate('/admin')}
              />
              <button
                ref={closeButtonRef}
                id="close-mobile-menu"
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-white transition-colors hover:bg-[#D4AF37] hover:text-[#01184C]"
                aria-label={isEnglish ? 'Close the mobile menu' : 'Fermer le menu mobile'}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Zone défilante unique : aucun défilement du fond derrière */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
              <nav aria-label={t('nav.mobile_primary', 'Navigation mobile principale')}>
                <ul className="space-y-1.5">
                  {navItems.map((item) => {
                    const active = isItemActive(item.href);
                    const linkClasses = `flex min-h-12 flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      active
                        ? 'border border-slate-300 dark:border-[#D4AF37]/50 bg-slate-100 dark:bg-[#0A2254] font-bold text-[#01184C] dark:text-[#D4AF37] shadow-xs'
                        : 'border border-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0A2254]/50 hover:text-[#01184C] dark:hover:text-[#D4AF37]'
                    }`;

                    if (item.expandable) {
                      return (
                        <li key={item.href}>
                          <div
                            className={`rounded-xl ${
                              active
                                ? 'border border-slate-300 dark:border-[#D4AF37]/50 bg-slate-100 dark:bg-[#0A2254]'
                                : 'border border-transparent'
                            }`}
                          >
                            <div className="flex items-stretch">
                              <Link
                                href={item.href}
                                onClick={onClose}
                                ariaCurrent={active ? 'page' : undefined}
                                className={`${linkClasses} border-0 bg-transparent shadow-none dark:bg-transparent`}
                              >
                                <span>{item.label}</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => setServicesExpanded((value) => !value)}
                                aria-expanded={servicesExpanded}
                                aria-controls="mobile-services-submenu"
                                aria-label={
                                  isEnglish
                                    ? 'Show the list of services'
                                    : 'Afficher la liste des services'
                                }
                                className="flex w-12 shrink-0 cursor-pointer items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:text-[#01184C] dark:text-slate-300 dark:hover:text-[#D4AF37]"
                              >
                                <ChevronDown
                                  className={`h-5 w-5 transition-transform duration-200 ${
                                    servicesExpanded ? 'rotate-180' : ''
                                  }`}
                                  aria-hidden="true"
                                />
                              </button>
                            </div>

                            {servicesExpanded && (
                              <ul
                                id="mobile-services-submenu"
                                className="space-y-0.5 border-t border-slate-200/80 dark:border-white/10 px-2 py-2"
                              >
                                {activeServices.map((service) => {
                                  const serviceHref = `/services/${service.slug}`;
                                  const serviceActive = currentPath === serviceHref;
                                  return (
                                    <li key={service.id}>
                                      <Link
                                        href={serviceHref}
                                        onClick={onClose}
                                        ariaCurrent={serviceActive ? 'page' : undefined}
                                        className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                          serviceActive
                                            ? 'bg-white dark:bg-[#01184C] font-bold text-[#01184C] dark:text-[#D4AF37]'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-[#01184C]/70'
                                        }`}
                                      >
                                        <span className="font-mono text-[11px] font-bold text-[#B38F22] dark:text-[#D4AF37]">
                                          {service.number}
                                        </span>
                                        <span className="line-clamp-2 leading-snug">
                                          {getServiceTitle(service)}
                                        </span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          ariaCurrent={active ? 'page' : undefined}
                          className={linkClasses}
                        >
                          <span>{item.label}</span>
                          <ArrowRight
                            className={`h-4 w-4 shrink-0 ${
                              active ? 'text-[#01184C] dark:text-[#D4AF37]' : 'text-slate-400'
                            }`}
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <button
                id="mobile-menu-cta-ai"
                type="button"
                onClick={() => closeAndNavigate('/assistant-ia')}
                className="mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-[#D4AF37]/50 bg-slate-100 dark:bg-[#0A2254] px-5 py-3 text-sm font-bold tracking-wide text-[#01184C] dark:text-[#D4AF37] shadow-xs transition-colors hover:bg-slate-200 dark:hover:bg-[#0A2254]/80"
              >
                <Bot className="h-4 w-4" aria-hidden="true" />
                <span>{t('hero.cta_ai', "Consulter l'Assistant IA")}</span>
              </button>

              {/* Préférences : après la navigation, avec de grandes cibles tactiles */}
              <section
                aria-label={isEnglish ? 'Preferences' : 'Préférences'}
                className="mt-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0A2254]/50 p-3.5"
              >
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Globe className="h-3.5 w-3.5 text-[#01184C] dark:text-[#D4AF37]" aria-hidden="true" />
                    {isEnglish ? 'Choose Language' : 'Choisir la langue'}
                  </span>
                  <span className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#01184C] px-2 py-0.5 text-[11px] font-bold text-[#01184C] dark:text-[#D4AF37]">
                    {isEnglish ? '🇬🇧 English' : '🇫🇷 Français'}
                  </span>
                </div>
                <LanguageToggle id="mobile-menu-drawer-lang-toggle" variant="full" />

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 pt-3">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {isEnglish ? 'Site theme' : 'Thème du site'}
                  </span>
                  <ThemeToggle
                    id="mobile-menu-theme-toggle-drawer"
                    theme={theme}
                    onToggle={onToggleTheme}
                    showLabel
                    className="min-h-11 text-xs"
                  />
                </div>
              </section>

              <div className="mt-5">
                <SocialFollowButtons showTitle title="Suivez-nous" size="sm" />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-300">
                <span className="flex min-w-0 items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#01184C] dark:text-[#D4AF37]" aria-hidden="true" />
                  <span className="truncate">RCCM : {settings.rccm}</span>
                </span>
                <span className="shrink-0">Niamey, Niger</span>
              </div>
            </div>

            {/* Actions principales toujours visibles, sans chevaucher le contenu */}
            <div className="shrink-0 space-y-2.5 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#01184C]/95 p-4">
              <button
                id="mobile-menu-cta-devis"
                type="button"
                onClick={() => closeAndNavigate('/devis')}
                className="btn-sheen flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold tracking-wide text-[#01184C] shadow-lg transition-colors hover:bg-[#E5C358]"
              >
                <span>{t('nav.request_quote', 'Demander un devis')}</span>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  id="mobile-menu-call"
                  href={`tel:${settings.phones[0]?.raw || '+22778798900'}`}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#0A2254] px-3 py-2.5 text-xs font-semibold text-[#01184C] dark:text-white shadow-xs transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-[#01184C] dark:text-[#D4AF37]" aria-hidden="true" />
                  <span>{t('common.call_us', 'Appeler')}</span>
                </a>

                <a
                  id="mobile-menu-whatsapp"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-[#D4AF37]/40 bg-slate-100 dark:bg-[#0A2254] px-3 py-2.5 text-xs font-semibold text-[#01184C] dark:text-white shadow-xs transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-[#01184C] dark:text-[#D4AF37]" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
