import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Quote, Building2, User, Star } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { HorizontalCarousel } from './HorizontalCarousel';

export const TestimonialsSection: React.FC = () => {
  const { testimonials } = useSiteData();
  const { t } = useLanguage();
  const activeTestimonials = testimonials.filter((t) => t.status === 'published');

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#EEF2F8] dark:bg-[#030F26] border-t border-[#DDE4EE] dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('testimonials.badge', 'Témoignages & Retours d’Expérience')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('testimonials.title', 'La confiance de nos partenaires et donneurs d’ordre.')}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              {t(
                'testimonials.desc',
                "Découvrez les retours de dirigeants d'entreprises et d'institutions qui ont confié leurs opérations à nos équipes à Niamey."
              )}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[#D4AF37] bg-white dark:bg-[#0A2254] px-4 py-2 rounded-full border border-[#DDE4EE] dark:border-white/10 shadow-sm text-xs font-bold">
            <div className="flex text-[#D4AF37] gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
              ))}
            </div>
            <span className="ml-1 text-[#01184C] dark:text-white tabular-nums font-semibold">{t('testimonials.rating', 'Note 5.0 / 5')}</span>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <HorizontalCarousel
          ariaLabel="Carrousel des témoignages clients"
          autoScroll
          autoScrollSpeed={20}
          autoScrollDirection="forward"
          autoScrollResumeDelay={4500}
        >
          {activeTestimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.25) }}
              className="w-[82vw] sm:w-[340px] md:w-[380px] shrink-0 snap-start flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF2F8] dark:bg-[#01184C] text-[#D4AF37] flex items-center justify-center">
                    <Quote className="w-4 h-4" />
                  </div>
                  <div className="flex text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#D4AF37]" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#1E293B] dark:text-slate-200 font-normal leading-relaxed italic mb-6">
                  « {t.quote} »
                </p>
              </div>

              <div className="pt-4 border-t border-[#EEF2F8] dark:border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#01184C] dark:bg-[#D4AF37] text-white dark:text-[#01184C] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-sm font-bold text-[#0E1D38] dark:text-white leading-tight truncate">
                    {t.author}
                  </h4>
                  {t.company && (
                    <p className="text-xs text-[#D4AF37] font-medium flex items-center gap-1.5 mt-0.5 truncate">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {t.role ? `${t.role} • ` : ''}
                        {t.company}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  );
};
