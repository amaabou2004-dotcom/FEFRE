import React from 'react';
import { motion } from 'motion/react';
import {
  Headphones,
  Cpu,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';

export const WhyChooseUs: React.FC = () => {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  const advantages = [
    {
      id: 'adv-1',
      title: t('why.adv1_title', 'Expertise Basée à Niamey'),
      description: t(
        'why.adv1_desc',
        'Une équipe locale bilingue et qualifiée, maîtrisant les réalités du marché nigérien et ouest-africain.'
      ),
      icon: Headphones,
      highlight: t('why.adv1_hi', 'Disponibilité 7j/7'),
    },
    {
      id: 'adv-2',
      title: t('why.adv2_title', 'Technologies & CRM Avancés'),
      description: t(
        'why.adv2_desc',
        'Routage omnicanal, intégration CRM et tableaux de bord KPI en temps réel pour piloter vos performances.'
      ),
      icon: Cpu,
      highlight: t('why.adv2_hi', 'Outils modernes'),
    },
    {
      id: 'adv-3',
      title: t('why.adv3_title', 'Conformité & Confidentialité'),
      description: t(
        'why.adv3_desc',
        'Entreprise enregistrée (NIF & RCCM), respect strict du secret des affaires et gouvernance transparente.'
      ),
      icon: ShieldCheck,
      highlight: t('why.adv3_hi', 'Garantie légale'),
    },
    {
      id: 'adv-4',
      title: t('why.adv4_title', 'Résultats & ROI Mesurables'),
      description: t(
        'why.adv4_desc',
        'Des processus d’assurance qualité rigoureux orientés vers la fidélisation client et la conversion commerciale.'
      ),
      icon: TrendingUp,
      highlight: t('why.adv4_hi', 'Impact immédiat'),
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#01184C] transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-[11px]">{t('why.badge', 'Pourquoi Nous Choisir')}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
            {t('why.title', '4 atouts majeurs pour votre réussite opérationnelle')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl mx-auto text-pretty">
            {t(
              'why.subtitle',
              "Nous allions encadrement humain d'élite, infrastructure technologique sécurisée à Niamey et engagement contractuel sans faille."
            )}
          </p>
        </div>

        {/* 4 Cards Grid - Simple, Clean, Scannable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((adv, idx) => {
            const Icon = adv.icon;
            return (
              <motion.div
                key={adv.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="p-6 sm:p-7 rounded-2xl bg-[#F8FAFD] dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center text-[#D4AF37] mb-5 shadow-sm group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="inline-block text-[11px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
                    0{idx + 1} • {adv.highlight}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0E1D38] dark:text-white mb-2 leading-snug">
                    {adv.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#475569] dark:text-slate-300 leading-relaxed">
                    {adv.description}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-[#EEF2F8] dark:border-white/10 flex items-center gap-2 text-xs font-bold text-[#01184C] dark:text-[#D4AF37]">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t('why.certified_badge', 'Standard de qualité certifié')}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Clean Center Action */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => navigate('/a-propos')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#01184C] dark:text-[#D4AF37] hover:underline cursor-pointer"
          >
            <span>{t('about_prev.cta', 'En savoir plus sur nos engagements qualité')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
