import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { CURATED_IMAGES } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';

export const AboutPreview: React.FC = () => {
  const { navigate } = useRouter();
  const { settings } = useSiteData();
  const { t, isEnglish } = useLanguage();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#030F26] transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image Card */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 order-2 lg:order-1 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#DDE4EE] dark:border-white/10 group">
              <img
                src={CURATED_IMAGES.aboutTeam.url}
                srcSet={CURATED_IMAGES.aboutTeam.srcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                alt={CURATED_IMAGES.aboutTeam.alt}
                width={600}
                height={450}
                className="w-full h-96 sm:h-[450px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.africanBoardroom;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#01184C]/90 backdrop-blur-md border border-slate-200 dark:border-[#D4AF37]/40 shadow-xl space-y-2.5 sm:space-y-3 text-[#01184C] dark:text-white transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shrink-0" />
                    <span className="text-[11px] sm:text-xs uppercase font-mono tracking-wider text-slate-700 dark:text-slate-200 truncate">
                      Gouvernance & Équipe Opérationnelle
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#01184C] bg-[#D4AF37] px-2 py-0.5 rounded shadow shrink-0">
                    ★ 5 ÉTOILES
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed italic line-clamp-2 sm:line-clamp-none">
                  « {settings.mission} »
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 text-[10px] sm:text-[11px] text-[#B38F22] dark:text-[#D4AF37] font-semibold border-t border-slate-200 dark:border-white/10">
                  <span>NIF : {settings.nif}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>RCCM : {settings.rccm}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Text & Content */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 order-1 lg:order-2 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('about_prev.badge', 'À Propos de Nous')}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-[1.18] text-balance">
              {t('about_prev.title', 'Un partenaire stratégique pour hisser votre expérience client au plus haut niveau.')}
            </h2>
            <p className="text-base sm:text-[17px] text-[#475569] dark:text-slate-300 leading-relaxed font-normal text-pretty">
              {isEnglish
                ? t('about_prev.desc1', settings.aboutText)
                : settings.aboutText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37]/50 transition-colors shadow-xs">
                <Users className="w-5 h-5 text-[#D4AF37] mb-2" />
                <h4 className="text-sm font-bold text-[#0E1D38] dark:text-white">
                  {isEnglish ? 'Human Expertise' : 'Expertise Humaine'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isEnglish
                    ? 'Qualified customer advisors, dedicated supervisors trained to international standards.'
                    : 'Téléconseillers qualifiés, superviseurs dédiés et formés aux standards internationaux.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37]/50 transition-colors shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37] mb-2" />
                <h4 className="text-sm font-bold text-[#0E1D38] dark:text-white">
                  {isEnglish ? 'Full Compliance' : 'Conformité Totale'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isEnglish
                    ? 'Strict confidentiality, data security, and full NIF/RCCM compliance in Niger.'
                    : 'Confidentialité rigoureuse, sécurité des données et conformité NIF/RCCM au Niger.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/a-propos')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sheen w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-xs tracking-wider uppercase bg-[#01184C] hover:bg-[#D4AF37] text-white hover:text-[#01184C] dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-white transition-all shadow-md cursor-pointer group"
              >
                <span>{t('about_prev.cta', "Découvrir notre histoire & nos engagements")}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
