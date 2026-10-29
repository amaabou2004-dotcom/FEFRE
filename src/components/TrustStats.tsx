import React from 'react';
import { motion } from 'motion/react';
import { Award, Users, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export const TrustStats: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    {
      id: 'stat-1',
      value: t('stats.stat1_value', '98,5%'),
      label: t('stats.stat1_label', 'Taux de satisfaction client'),
      sub: t('stats.stat1_sub', 'Sur nos opérations de centre de contact'),
      icon: Award,
    },
    {
      id: 'stat-2',
      value: t('stats.stat2_value', '8 Pôles'),
      label: t('stats.stat2_label', 'D’expertises intégrées'),
      sub: t('stats.stat2_sub', 'Du centre d’appel au CRM et web'),
      icon: CheckCircle,
    },
    {
      id: 'stat-3',
      value: t('stats.stat3_value', '100% Dédié'),
      label: t('stats.stat3_label', 'Ancrage & équipes à Niamey'),
      sub: t('stats.stat3_sub', 'Experts bilingues et conformité NIF/RCCM'),
      icon: Users,
    },
    {
      id: 'stat-4',
      value: t('stats.stat4_value', '24h/48h'),
      label: t('stats.stat4_label', 'Délai d’étude de devis'),
      sub: t('stats.stat4_sub', 'Chiffrage express sur mesure'),
      icon: Clock,
    },
  ];

  return (
    <section className="relative z-20 -mt-10 sm:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37]/60 dark:hover:border-[#D4AF37]/60 shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#01184C] dark:text-[#D4AF37] tabular-nums tracking-[-0.03em] leading-none">
                  {stat.value}
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#EEF2F8] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0E1D38] dark:text-white leading-snug">
                  {stat.label}
                </p>
                <p className="text-[11px] sm:text-xs text-[#536582] dark:text-slate-300 mt-1 leading-normal line-clamp-1">
                  {stat.sub}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
