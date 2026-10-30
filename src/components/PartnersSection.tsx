import React from 'react';
import { motion } from 'motion/react';
import { Handshake, Building2, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useRouter } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';
import { HorizontalCarousel } from './HorizontalCarousel';

export const PartnersSection: React.FC = () => {
  const { partners } = useSiteData();
  const { navigate } = useRouter();
  const { t } = useLanguage();

  const activePartners = partners.filter((p) => p.status === 'active');

  // Si l'admin a supprimé/masqué tous les partenaires, la section entière
  // disparaît immédiatement au lieu de laisser un titre et un carrousel vide.
  if (activePartners.length === 0) return null;

  return (
    <section
      id="partenaires"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#01184C] transition-colors duration-300 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
              <Handshake className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('partners.badge', 'Alliances Stratégiques & Écosystème')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('partners.title', 'Des synergies pérennes avec les acteurs de référence.')}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              {t(
                'partners.desc',
                "Opérateurs télécoms, éditeurs CRM, intégrateurs et institutions : découvrez les organisations qui enrichissent notre dynamique d'excellence."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#01184C] dark:text-[#D4AF37] hover:underline self-start md:self-end cursor-pointer uppercase tracking-wider"
          >
            <span>{t('partners.cta', 'Devenir partenaire')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Carousel */}
        <HorizontalCarousel
          ariaLabel="Carrousel des partenaires"
          autoScroll
          autoScrollSpeed={26}
          autoScrollDirection="reverse"
        >
          {activePartners.map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.25) }}
              className="w-[75vw] sm:w-[280px] md:w-[320px] shrink-0 snap-start flex flex-col justify-between p-6 rounded-2xl bg-[#F8FAFD] dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all shadow-sm group"
            >
              <div>
                {/* Logo Box */}
                <div className="w-full h-24 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center p-4 mb-4 overflow-hidden shadow-inner">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={160}
                      height={64}
                      className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 text-[#0E1D38] dark:text-white font-bold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] dark:bg-[#0A2254] flex items-center justify-center text-[#D4AF37]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="truncate">{partner.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  {partner.category && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] block">
                      {partner.category}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-[#0E1D38] dark:text-white">
                    {partner.name}
                  </h3>
                  {partner.description && (
                    <p className="text-xs text-[#536582] dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {partner.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-[#EEF2F8] dark:border-white/10 flex items-center justify-between">
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] hover:underline"
                  >
                    <span>Site officiel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Partenaire stratégique</span>
                )}
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              </div>
            </motion.div>
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  );
};
