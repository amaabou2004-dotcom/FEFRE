import React from 'react';
import { motion } from 'motion/react';
import { Building2, Target, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { ApproachTimeline } from '../components/ApproachTimeline';
import { RecognitionCertificateSection } from '../components/RecognitionCertificateSection';
import { OfficialLocationMap } from '../components/OfficialLocationMap';
import { LOCAL_IMAGES } from '../data/images';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const AboutPage: React.FC = () => {
  const { navigate } = useRouter();
  const { settings } = useSiteData();
  const { t, isEnglish } = useLanguage();

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20">
        <Breadcrumbs items={[{ label: t('nav.about', 'À propos') }]} />

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('about_page.badge', "À Propos d'Excellence Services SARL")}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15] text-balance">
              {t('about_page.title', "L'alliance de l'expertise relationnelle et de la maîtrise technologique à Niamey.")}
            </h1>
            <p className="text-base sm:text-lg text-[#475569] dark:text-slate-300 leading-relaxed font-normal text-pretty">
              {isEnglish
                ? "We partner with large corporations, institutions, and SMEs to manage omnichannel contact centers, CRM integration, web engineering, and digital transformation in Niger and West Africa."
                : settings.aboutText}
            </p>
          </div>

          <div className="lg:col-span-5 rounded-3xl overflow-hidden shadow-2xl border border-[#DDE4EE] dark:border-white/10 group">
            <img
              src={LOCAL_IMAGES.aboutLeadership}
              srcSet={`${LOCAL_IMAGES.aboutLeadershipMobile} 480w, ${LOCAL_IMAGES.aboutLeadership} 960w`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              alt="Équipe dirigeante et consultants experts d'Excellence Services SARL au siège de Niamey"
              width={600}
              height={320}
              className="w-full h-72 sm:h-80 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.africanBoardroom;
              }}
            />
          </div>
        </motion.div>

        {/* Mission & Values */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 shadow-xl space-y-6 premium-card"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37]">
              <Target className="w-4 h-4 text-[#D4AF37]" />
              <span>{t('about_page.mission_badge', 'Notre Mission Fondatrice')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0E1D38] dark:text-white leading-snug">
              {isEnglish
                ? "Elevating customer relationships and digital efficiency for African institutions and businesses."
                : settings.mission}
            </h2>
            <p className="text-sm text-[#536582] dark:text-slate-300 leading-relaxed">
              {t('about_page.mission_desc', "Basée à Niamey, au Niger, EXCELLENCE SERVICES SARL structure ses interventions autour d'une conviction fondamentale : la relation client n'est pas un simple centre de coûts, mais le moteur déterminant de la compétitivité et de la pérennité des entreprises.")}
            </p>
            <div className="pt-4 border-t border-[#EEF2F8] dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10">
                <p className="text-slate-400 font-semibold mb-0.5">{isEnglish ? 'Tax Identification (NIF)' : 'Identifiant Fiscal (NIF)'}</p>
                <p className="text-sm font-mono font-bold text-[#0E1D38] dark:text-white">{settings.nif}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10">
                <p className="text-slate-400 font-semibold mb-0.5">{isEnglish ? 'Trade Registration (RCCM)' : 'Immatriculation (RCCM)'}</p>
                <p className="text-xs font-mono font-bold text-[#D4AF37]">{settings.rccm}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 p-8 rounded-3xl bg-white dark:bg-[#01184C] text-[#0E1D38] dark:text-white border border-slate-200 dark:border-[#D4AF37]/30 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#01184C] dark:text-white">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>{t('about_page.pillars_title', 'Nos 6 Piliers Fondamentaux')}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t('about_page.pillars_desc', 'Les valeurs qui guident chaque diagnostic, chaque déploiement et chaque échange avec vos usagers :')}
            </p>
            <div className="space-y-2.5">
              {settings.values.map((v) => (
                <div
                  key={v}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A2254]/70 border border-slate-200 dark:border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#01184C] dark:text-white">{v}</span>
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Attestation officielle de satisfaction remise par VivaeSIM */}
        <RecognitionCertificateSection embedded />

        {/* Why Choose Us & Methodology & Map */}
        <WhyChooseUs />
        <ApproachTimeline />
        <OfficialLocationMap />

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-[#01184C] dark:via-[#0A2254] dark:to-[#01184C] text-[#0E1D38] dark:text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-200 dark:border-[#D4AF37]/40 relative overflow-hidden transition-colors"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <h3 className="text-2xl font-bold mb-1 text-[#01184C] dark:text-white">{t('about_page.cta_title', 'Prêt à transformer votre relation client ?')}</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {t('about_page.cta_desc', 'Nos consultants à Niamey sont à votre écoute pour évaluer vos opportunités.')}
            </p>
          </div>
          <motion.button
            onClick={() => navigate('/devis')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-sheen shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-extrabold text-xs tracking-wide transition-all shadow cursor-pointer relative z-10 group"
          >
            <span>{t('about_page.cta_btn', 'Demander une étude personnalisée')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
