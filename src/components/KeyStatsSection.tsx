import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Building2, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';

export const KeyStatsSection: React.FC = () => {
  const { services, sectors, settings } = useSiteData();
  const { t, isEnglish } = useLanguage();

  const servicesCount = services.filter((s) => s.status !== 'hidden').length || 8;
  const sectorsCount = sectors.filter((s) => s.status !== 'hidden').length || 5;

  const stats = [
    {
      id: 'stat-1',
      icon: <Sparkles className="w-6 h-6 text-[#D4AF37]" />,
      value: `${servicesCount}`,
      label: isEnglish ? 'Practice Areas' : "Domaines d'Expertise",
      detail: isEnglish
        ? 'Contact centers, CRM, Web, Digital, Telesales...'
        : 'Centres de contact, CRM, Web, Digital, Commercial...',
    },
    {
      id: 'stat-2',
      icon: <Building2 className="w-6 h-6 text-[#D4AF37]" />,
      value: `${sectorsCount}`,
      label: isEnglish ? 'Sectors of Activity' : 'Secteurs d’Intervention',
      detail: isEnglish
        ? 'Insurance, Hospitality, Logistics, Telecoms, MEAL'
        : 'Assurances, Hôtellerie, Logistique, Télécoms, MEAL',
    },
    {
      id: 'stat-3',
      icon: <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />,
      value: '100%',
      label: isEnglish ? '5-Star Quality Commitment' : 'Engagement Qualité 5 Étoiles',
      detail: isEnglish
        ? 'Rigorous legal compliance NIF & RCCM in Niger'
        : 'Conformité légale rigoureuse NIF & RCCM au Niger',
    },
    {
      id: 'stat-4',
      icon: <Clock className="w-6 h-6 text-[#D4AF37]" />,
      value: '09h30 - 17h30',
      label: isEnglish ? 'Operational Availability' : 'Disponibilité Opérationnelle',
      detail: isEnglish
        ? 'Open Monday to Friday in Niamey'
        : 'Permanence du Lundi au Vendredi à Niamey',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white border-y border-slate-200 dark:border-[#D4AF37]/20 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-blue-200/40 dark:bg-[#0A2254]/60 rounded-full blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-slate-200 dark:border-[#D4AF37]/40 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-[11px]">{t('keystats.badge', 'Repères Institutionnels')}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-0.03em] text-[#01184C] dark:text-white leading-tight">
            {t('keystats.title', 'Nos indicateurs et repères clés')}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto text-pretty">
            {t(
              'keystats.desc',
              "Des fondations solides, une gouvernance certifiée et une organisation d'élite pour garantir l’excellence opérationnelle de vos projets au Niger."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0A2254]/90 border border-slate-200 dark:border-[#D4AF37]/30 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all group flex flex-col justify-between shadow-lg dark:shadow-xl cursor-default"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#01184C] border border-slate-200 dark:border-[#D4AF37]/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {stat.icon}
                </div>
                <div className="font-display text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#B38F22] dark:text-[#D4AF37] tabular-nums tracking-[-0.03em] leading-none">
                  {stat.value}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#01184C] dark:text-white mt-3 leading-snug">
                  {stat.label}
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-200/90 mt-4 pt-3 border-t border-slate-100 dark:border-white/10 leading-relaxed">
                {stat.detail}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A2254]/60 border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span>
              {t('keystats.hq', 'Siège Opérationnel :')} <strong className="text-[#01184C] dark:text-white font-semibold">{settings.location}</strong>
            </span>
          </div>
          <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">NIF :</span>
            <strong className="font-mono text-[#01184C] dark:text-white tabular-nums">{settings.nif}</strong>
          </div>
          <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">RCCM :</span>
            <strong className="font-mono text-[#B38F22] dark:text-[#D4AF37] tabular-nums">{settings.rccm}</strong>
          </div>
        </div>
      </div>
    </section>
  );
};
