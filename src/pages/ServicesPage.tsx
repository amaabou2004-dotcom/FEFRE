import React, { useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { ServiceCard } from '../components/ServiceCard';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const ServicesPage: React.FC = () => {
  const { services } = useSiteData();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const activeServices = services.filter((s) => s.status !== 'hidden');
  const filteredServices = activeServices.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.positioning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prestations.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        <Breadcrumbs items={[{ label: t('nav.services', 'Services') }]} />

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-[11px]">{t('services_page.badge', "Catalogue d'Offres & Prestations")}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-tight text-balance">
            {t('services_page.title', 'Des expertises pointues pour propulser votre expérience client.')}
          </h1>
          <p className="mt-3 text-base text-[#475569] dark:text-slate-300 leading-relaxed font-normal text-pretty">
            {t(
              'services_page.desc',
              "De la gestion externalisée des centres de contact au conseil en CRM, en passant par le développement d'applications métiers et l'accélération e-commerce : explorez nos 8 domaines d'intervention stratégique."
            )}
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('services_page.search_placeholder', "Rechercher une prestation (ex: CRM, centre d'appel, e-commerce)...")}
            className="w-full pl-10 pr-4 py-3 rounded-full bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 text-xs sm:text-sm text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service, idx) => (
            <ServiceCard key={service.id} service={service} index={idx} />
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10">
            <p className="text-[#536582] dark:text-slate-400 text-sm">
              {t('services_page.no_result', 'Aucun service ne correspond à votre recherche')} « {searchTerm} ».
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
