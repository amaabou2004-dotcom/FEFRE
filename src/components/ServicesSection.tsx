import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { ServiceCard } from './ServiceCard';
import { HorizontalCarousel } from './HorizontalCarousel';
import { ServiceQuickModal } from './ServiceQuickModal';
import { ServiceItem } from '../types';

export const ServicesSection: React.FC = () => {
  const { navigate } = useRouter();
  const { services } = useSiteData();
  const { t } = useLanguage();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const activeServices = services.filter((s) => !s.status || s.status === 'active');

  // La fiche rapide ouverte suit les modifications temps réel et se ferme
  // si le service est supprimé, masqué ou repassé en brouillon.
  useEffect(() => {
    setSelectedService((prev) => {
      if (!prev) return prev;
      const current = services.find(
        (s) => s.id === prev.id && (!s.status || s.status === 'active')
      );
      if (!current) return null;
      return JSON.stringify(current) === JSON.stringify(prev) ? prev : current;
    });
  }, [services]);

  return (
    <section
      id="services"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#030F26] relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('services.badge', "Solutions & Pôles d'Expertise")}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('services.title', 'Une suite complète de solutions pour votre transformation opérationnelle.')}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              {t(
                'services.description',
                "Faites défiler pour explorer nos 8 pôles d'expertises intégrées : centre de contact multicanal, déploiement CRM, développement web et digitalisation à Niamey."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#01184C] dark:text-[#D4AF37] hover:underline self-start md:self-end cursor-pointer uppercase tracking-wider"
          >
            <span>{t('services.view_full_catalog', 'Voir le catalogue complet')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Carousel of Services */}
        <HorizontalCarousel
          ariaLabel="Carrousel des services Excellence Services"
          autoScroll
          autoScrollSpeed={38}
          autoScrollDirection="forward"
        >
          {activeServices.map((service, idx) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={idx}
              onQuickView={(s) => setSelectedService(s)}
            />
          ))}
        </HorizontalCarousel>

        {/* Simple Bottom Banner */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0E1D38] dark:text-white mb-1">
              {t('services.need_custom', "Besoin d'un accompagnement spécifique à Niamey ?")}
            </h3>
            <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300">
              {t(
                'services.need_custom_sub',
                'Nos consultants analysent vos besoins et vous proposent un devis rapide sans engagement.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/devis')}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#01184C] hover:bg-[#0A2254] text-white text-xs font-bold border border-[#D4AF37]/40 shadow-sm transition-colors cursor-pointer"
          >
            <span>{t('nav.request_quote', 'Demander un devis')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      <ServiceQuickModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </section>
  );
};
