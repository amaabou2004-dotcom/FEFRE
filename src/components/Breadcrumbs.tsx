import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const { t } = useLanguage();

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center flex-wrap gap-1.5 text-xs text-[#536582] dark:text-slate-400 mb-6 ${className}`}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 hover:text-[#D4AF37] transition-colors py-0.5"
        title={t('common.back_to_site', "Retour à l'accueil")}
      >
        <Home className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>{t('nav.home', 'Accueil')}</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-[#D4AF37] transition-colors line-clamp-1 py-0.5"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#01184C] dark:text-[#D4AF37] line-clamp-1 py-0.5" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
