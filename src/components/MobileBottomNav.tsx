import React from 'react';
import { Home, LayoutGrid, FileText, PhoneCall, Menu } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}

/**
 * Navigation principale mobile, toujours visible en bas d'écran.
 * Hauteur constante + zone sûre iOS/Android : aucun élément ne saute
 * quand la barre d'adresse du navigateur apparaît ou disparaît.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu, isMenuOpen }) => {
  const { currentPath } = useRouter();
  const { t } = useLanguage();

  const items = [
    { label: t('nav.home', 'Accueil'), href: '/', icon: Home },
    { label: t('nav.services', 'Services'), href: '/services', icon: LayoutGrid },
    { label: t('nav.quote_short', 'Devis'), href: '/devis', icon: FileText, featured: true },
    { label: t('nav.contact', 'Contact'), href: '/contact', icon: PhoneCall },
  ];

  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);

  return (
    <nav
      aria-label={t('nav.mobile_primary', 'Navigation mobile principale')}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#01184C]/97 shadow-[0_-8px_30px_rgba(1,24,76,0.10)] backdrop-blur-xl [@media(max-height:30rem)]:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-1.5 [padding-bottom:max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              ariaCurrent={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold leading-none transition-colors ${
                active
                  ? 'bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37]'
                  : 'text-slate-600 dark:text-slate-200 hover:text-[#01184C] dark:hover:text-[#D4AF37]'
              }`}
            >
              <span
                className={`flex h-7 w-9 items-center justify-center rounded-full ${
                  item.featured
                    ? 'bg-[#D4AF37] text-[#01184C] shadow-sm'
                    : active
                      ? 'text-[#01184C] dark:text-[#D4AF37]'
                      : ''
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          aria-haspopup="dialog"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold leading-none transition-colors ${
            isMenuOpen
              ? 'bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37]'
              : 'text-slate-600 dark:text-slate-200 hover:text-[#01184C] dark:hover:text-[#D4AF37]'
          }`}
        >
          <span className="flex h-7 w-9 items-center justify-center rounded-full">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="max-w-full truncate">{t('nav.menu', 'Menu')}</span>
        </button>
      </div>
    </nav>
  );
};
