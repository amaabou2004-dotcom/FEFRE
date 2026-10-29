import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ExternalLink, Briefcase } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useRouter } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';
import { HorizontalCarousel } from './HorizontalCarousel';
import { LOCAL_IMAGES } from '../data/images';

interface RealisationsSectionProps {
  isStandalonePage?: boolean;
}

export const RealisationsSection: React.FC<RealisationsSectionProps> = ({
  isStandalonePage = false,
}) => {
  const { projects } = useSiteData();
  const { navigate } = useRouter();
  const { t, isEnglish } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const activeProjects = projects.filter((p: any) => p.status !== 'hidden');
  const categories = isEnglish
    ? ['All', 'Contact Centers', 'CRM & Digital', 'E-commerce', 'Consulting & Studies', 'Web & Mobile']
    : ['Tous', 'Centres de Contact', 'CRM & Digital', 'E-commerce', 'Conseil & Études', 'Web & Mobile'];

  const filteredProjects =
    selectedCategory === 'Tous'
      ? activeProjects
      : activeProjects.filter(
          (p: any) =>
            p.category === selectedCategory ||
            p.sector === selectedCategory ||
            p.service === selectedCategory
        );

  return (
    <section
      id="realisations"
      className={`${
        isStandalonePage ? 'py-16' : 'py-20'
      } px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#030F26] transition-colors duration-300 relative`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('portfolio.badge', 'Études de Cas & Déploiements')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('portfolio.title', 'Des réalisations concrètes qui attestent de notre niveau d\'exigence.')}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              {t(
                'portfolio.desc',
                "Faites défiler pour explorer les projets menés avec succès : déploiements de centres d'appels, intégrations CRM et solutions digitales à Niamey."
              )}
            </p>
          </div>

          {!isStandalonePage && (
            <button
              type="button"
              onClick={() => navigate('/realisations')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#01184C] dark:text-[#D4AF37] hover:underline self-start md:self-end cursor-pointer uppercase tracking-wider"
            >
              <span>{t('portfolio.all', 'Voir toutes les réalisations')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filter on standalone page */}
        {isStandalonePage && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#01184C] text-[#D4AF37] border border-[#D4AF37] shadow-sm'
                    : 'bg-white dark:bg-[#0A2254] text-[#536582] dark:text-slate-300 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Horizontal Carousel of Projects */}
        <HorizontalCarousel ariaLabel="Carrousel des réalisations">
          {filteredProjects.map((p: any, idx: number) => {
            const imageUrl =
              p.imageUrl ||
              LOCAL_IMAGES.africanContactCenter;
            const mobileUrl = imageUrl === LOCAL_IMAGES.africanContactCenter ? LOCAL_IMAGES.africanContactCenterMobile : undefined;
            const srcSet = mobileUrl ? `${mobileUrl} 480w, ${imageUrl} 960w` : undefined;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.25) }}
                className="w-[82vw] sm:w-[340px] md:w-[360px] shrink-0 snap-start flex flex-col justify-between rounded-2xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#01184C]">
                    <img
                      src={imageUrl}
                      srcSet={srcSet}
                      sizes="(max-width: 640px) 82vw, (max-width: 1024px) 340px, 360px"
                      alt={p.title || p.project}
                      width={360}
                      height={176}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.africanContactCenter;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#01184C]/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/40 font-mono font-bold text-[11px] text-[#D4AF37]">
                      {p.category || p.sector || 'Projet'}
                    </div>

                    {p.client && (
                      <div className="absolute bottom-3 left-3 text-[11px] text-slate-200 font-medium bg-[#01184C]/80 px-2 py-0.5 rounded backdrop-blur-sm">
                        Client : {p.client}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#0E1D38] dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors">
                      {p.title || p.project}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#475569] dark:text-slate-300 leading-relaxed line-clamp-3">
                      {p.summary || p.description}
                    </p>

                    {/* Deliverables tags */}
                    {p.deliverables && p.deliverables.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3 border-t border-[#EEF2F8] dark:border-white/10">
                        {p.deliverables.slice(0, 2).map((d: string, dIdx: number) => (
                          <span
                            key={dIdx}
                            className="px-2.5 py-0.5 rounded-md bg-[#F8FAFD] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 sm:px-6 pb-5 pt-3.5 border-t border-[#EEF2F8] dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/contact')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#01184C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <span>Lancer un projet similaire</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/devis')}
                    className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-[#D4AF37] transition-colors"
                  >
                    Devis →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </HorizontalCarousel>
      </div>
    </section>
  );
};
