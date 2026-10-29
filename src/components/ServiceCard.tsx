import React from 'react';
import { motion } from 'motion/react';
import {
  Headphones,
  Database,
  Compass,
  Code2,
  TrendingUp,
  Cpu,
  Sparkles,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { ServiceItem } from '../types';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { SITE_MEDIA_CATALOG } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';

interface ServiceCardProps {
  service: ServiceItem;
  index: number;
  onQuickView?: (service: ServiceItem) => void;
}

const ICON_MAP: Record<string, any> = {
  Headphones,
  Database,
  Compass,
  Code2,
  TrendingUp,
  Cpu,
  Sparkles,
  ShoppingBag,
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, onQuickView }) => {
  const { navigate } = useRouter();
  const { media } = useSiteData();
  const { t, isEnglish } = useLanguage();

  const IconComponent = ICON_MAP[service.iconName] || Sparkles;
  const numPadded = service.number.padStart(2, '0');

  const title = isEnglish && t(`service.${numPadded}.title`) !== `service.${numPadded}.title`
    ? t(`service.${numPadded}.title`)
    : service.title;
  const positioning = isEnglish && t(`service.${numPadded}.pos`) !== `service.${numPadded}.pos`
    ? t(`service.${numPadded}.pos`)
    : service.positioning;
  const summary = isEnglish && t(`service.${numPadded}.sum`) !== `service.${numPadded}.sum`
    ? t(`service.${numPadded}.sum`)
    : service.summary;

  const mediaItem = media.find(
    (m) =>
      m.location === `service-${numPadded}` ||
      m.location === `service-${service.number}` ||
      m.id.includes(numPadded)
  );
  const catalogItem = Object.values(SITE_MEDIA_CATALOG).find(
    (m) => m.location === `service-${numPadded}` || m.id.includes(numPadded)
  );

  const imageUrl = mediaItem?.url || catalogItem?.url || (service as any).image;
  const imageAlt = mediaItem?.alt || catalogItem?.alt || service.title;
  const imageSrcSet = mediaItem?.srcSet || catalogItem?.srcSet;

  const handleAction = () => {
    if (onQuickView) {
      onQuickView(service);
    } else {
      navigate(`/services/${service.slug}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className="w-[82vw] sm:w-[340px] md:w-[360px] shrink-0 snap-start flex flex-col justify-between rounded-2xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={handleAction}
    >
      <div>
        {/* Card Image */}
        <div className="relative h-44 w-full overflow-hidden bg-[#01184C]">
          {imageUrl ? (
            <img
              src={imageUrl}
              srcSet={imageSrcSet}
              sizes="(max-width: 640px) 82vw, (max-width: 1024px) 340px, 360px"
              alt={imageAlt}
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
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#01184C]">
              <IconComponent className="w-12 h-12 text-[#D4AF37]/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#01184C]/90 via-transparent to-transparent" />
          
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/50 font-mono font-bold text-[11px] text-[#D4AF37] tracking-wider shadow-sm">
            SERVICE {service.number}
          </div>

          <div className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow group-hover:bg-[#D4AF37] group-hover:text-[#01184C] transition-colors">
            <IconComponent className="w-4 h-4" />
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] mb-1.5">
            {positioning}
          </p>
          <h3 className="font-display text-base sm:text-lg font-bold text-[#0E1D38] dark:text-white mb-2 leading-snug line-clamp-2 group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors">
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#475569] dark:text-slate-300 leading-relaxed line-clamp-3">
            {summary}
          </p>
        </div>
      </div>

      {/* Card Action */}
      <div className="px-5 sm:px-6 pb-5 pt-3.5 border-t border-[#EEF2F8] dark:border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#01184C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] transition-colors cursor-pointer uppercase tracking-wider"
        >
          <span>{t('services.learn_more', 'En savoir plus')}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => navigate(`/services/${service.slug}`)}
          className="text-xs text-slate-400 dark:text-slate-400 hover:text-[#D4AF37] font-medium transition-colors cursor-pointer"
          title={isEnglish ? "View detailed service sheet" : "Consulter la page détaillée"}
        >
          {isEnglish ? 'Full Details →' : 'Fiche détaillée →'}
        </button>
      </div>
    </motion.div>
  );
};
