import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Hotel,
  Truck,
  Users2,
  Radio,
  Building2,
  Landmark,
  Globe2,
  Briefcase,
  Store,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useRouter } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';
import { SECTORS } from '../data/company';
import { SITE_MEDIA_CATALOG } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';
import { HorizontalCarousel } from './HorizontalCarousel';

const SECTOR_ICONS: Record<string, any> = {
  ShieldCheck,
  Hotel,
  Truck,
  Users2,
  Radio,
  Building2,
  Landmark,
  Globe2,
  Briefcase,
  Store,
};

const SECTOR_MEDIA_MAP: Record<string, string> = {
  assurances: 'sector-assurances',
  'hotellerie-tourisme': 'sector-hotellerie',
  'transports-logistique': 'sector-transports',
  'projets-developpement': 'sector-projets',
  telecommunications: 'sector-telecom',
};

export const SectorExplorer: React.FC = () => {
  const { navigate } = useRouter();
  const { sectors, media } = useSiteData();
  const { t, isEnglish } = useLanguage();

  const sectorList = sectors.length > 0 ? sectors : SECTORS;

  return (
    <section
      id="secteurs"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[#EEF2F8] dark:bg-[#030F26] border-y border-[#DDE4EE] dark:border-white/10 transition-colors duration-300 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('sectors.badge', 'Champs d’Intervention Stratégique')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('sectors.title', 'Une expertise éprouvée au service des secteurs clés du Niger.')}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              {t(
                'sectors.desc',
                'Banques, télécoms, microfinance, institutions publiques et distribution : nous modulons nos processus pour répondre aux exigences spécifiques de chaque écosystème.'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/secteurs')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#01184C] dark:text-[#D4AF37] hover:underline self-start md:self-end cursor-pointer uppercase tracking-wider"
          >
            <span>{t('sectors.view_all', 'Explorer tous les secteurs')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Carousel */}
        <HorizontalCarousel ariaLabel="Carrousel des secteurs d'activité">
          {sectorList.map((sector, idx) => {
            const IconComp = SECTOR_ICONS[sector.iconName] || ShieldCheck;
            const mediaKey = SECTOR_MEDIA_MAP[sector.id] || `sector-${sector.id}`;
            const mediaItem = media.find((m) => m.location === mediaKey || m.id.includes(sector.id));
            const catalogItem = SITE_MEDIA_CATALOG[mediaKey];
            const imageUrl = mediaItem?.url || catalogItem?.url || (sector as any).imageUrl;
            const imageSrcSet = mediaItem?.srcSet || catalogItem?.srcSet;

            return (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.25) }}
                className="w-[82vw] sm:w-[340px] md:w-[360px] shrink-0 snap-start flex flex-col justify-between rounded-2xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div>
                  {/* Card Visual Header */}
                  <div className="relative h-40 w-full overflow-hidden bg-[#01184C]">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        srcSet={imageSrcSet}
                        sizes="(max-width: 640px) 82vw, (max-width: 1024px) 340px, 360px"
                        alt={sector.name}
                        width={360}
                        height={160}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.africanClientAdvisory;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#01184C]">
                        <IconComp className="w-12 h-12 text-[#D4AF37]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#01184C] via-[#01184C]/30 to-transparent" />
                    
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-lg bg-[#0A2254] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-mono tracking-wider text-[#D4AF37]">
                        SECTEUR 0{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#0E1D38] dark:text-white mb-2 leading-snug group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors">
                      {sector.name}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#475569] dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                      {sector.description}
                    </p>

                    {/* Features checklist */}
                    {sector.features && sector.features.length > 0 && (
                      <div className="space-y-1.5 pt-3 border-t border-[#EEF2F8] dark:border-white/10">
                        {sector.features.slice(0, 3).map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2 text-xs text-[#0E1D38] dark:text-slate-200">
                            <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="line-clamp-1 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="px-5 sm:px-6 pb-5 pt-3.5 border-t border-[#EEF2F8] dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/secteurs')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#01184C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <span>Solutions dédiées</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/contact')}
                    className="text-xs text-slate-400 dark:text-slate-400 hover:text-[#D4AF37] font-medium transition-colors cursor-pointer"
                  >
                    Échanger →
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
