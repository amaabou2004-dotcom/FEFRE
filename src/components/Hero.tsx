import React from 'react';
import { motion } from 'motion/react';
import { Star, ArrowRight, ShieldCheck, FileCheck, PhoneCall, Bot, Sparkles } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { CURATED_IMAGES } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';

export const Hero: React.FC = () => {
  const { navigate } = useRouter();
  const { media, settings } = useSiteData();
  const { t, isEnglish } = useLanguage();

  const heroMedia = media.find((m) => m.location === 'hero-main' || m.id === 'hero-main');
  const imageUrl = heroMedia?.url || CURATED_IMAGES.hero.url;
  const imageAlt = heroMedia?.alt || CURATED_IMAGES.hero.alt;

  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/services');
    }
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/contact');
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-32 sm:pt-36 lg:pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F2F6FC] via-white to-[#F8FAFD] dark:bg-[#01184C] dark:from-[#01184C] dark:via-[#01184C] dark:to-[#01184C] text-[#0E1D38] dark:text-white overflow-hidden transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-blue-200/40 dark:bg-[#0A2254]/50 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Direct and Clear Text */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254]/90 border border-slate-200 dark:border-[#D4AF37]/50 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-0.5 text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#D4AF37]" />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-[#01184C] dark:text-[#D4AF37] tracking-wider uppercase">
                  {t('hero.badge', 'Pôle d’Excellence Relation Client & Digital')}
                </span>
              </div>
              <span className="text-[11px] uppercase font-mono tracking-wider px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0A2254]/80 text-[#01184C] dark:text-slate-200 font-semibold border border-slate-200 dark:border-white/15 shadow-sm">
                {t('hero.location', 'Niamey • Niger')}
              </span>
            </motion.div>

            {/* Titre Principal : Typographie Haute Précision */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-extrabold tracking-[-0.03em] leading-[1.14] text-[#01184C] dark:text-white"
            >
              {t('hero.title_pre', 'Excellence Services SARL : Votre partenaire en ')}
              <span className="text-[#B38F22] dark:text-[#D4AF37]">{t('hero.title_highlight1', 'Relation Client')}</span>
              {t('hero.title_mid', ' & ')}
              <span className="text-[#B38F22] dark:text-[#D4AF37]">{t('hero.title_highlight2', 'Digitalisation')}</span>
              {t('hero.title_post', ' à Niamey.')}
            </motion.h1>

            {/* Phrase d'accroche et proposition de valeur */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-200/90 leading-relaxed max-w-2xl font-normal text-pretty"
            >
              {t(
                'hero.description',
                "Nous accompagnons les grandes entreprises, institutions et PME dans la gestion de centres de contact omnicanaux, l'intégration CRM, l'ingénierie web et la transformation numérique au Niger et en Afrique de l'Ouest."
              )}
            </motion.p>

            {/* Boutons d'action harmonisés */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2"
            >
              <button
                type="button"
                id="hero-cta-services"
                onClick={scrollToServices}
                className="btn-sheen w-full sm:w-auto bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] px-6 py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{t('hero.cta_services', 'Découvrir nos services')}</span>
                <ArrowRight className="w-4 h-4 text-[#01184C]" />
              </button>

              <button
                type="button"
                id="hero-cta-ai"
                onClick={() => navigate('/assistant-ia')}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 backdrop-blur-sm border border-slate-300 dark:border-white/20 hover:border-[#D4AF37] text-[#01184C] dark:text-white px-5 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                <Bot className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37]" />
                <span>{t('hero.cta_ai', "Consulter l'Assistant IA")}</span>
              </button>

              <button
                type="button"
                id="hero-cta-contact"
                onClick={scrollToContact}
                className="w-full sm:w-auto border border-slate-300 dark:border-white/20 hover:border-[#D4AF37] bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-[#D4AF37]/10 px-6 py-3.5 rounded-xl text-sm font-bold text-[#01184C] dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-xs"
              >
                <PhoneCall className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37]" />
                <span>{t('hero.cta_contact', 'Nous contacter')}</span>
              </button>
            </motion.div>

            {/* Identifiants légaux */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-300/90 border-t border-slate-200 dark:border-white/15"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37]" />
                <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                  <strong className="text-[#01184C] dark:text-white font-semibold">NIF :</strong> {settings.nif}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
                <FileCheck className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37]" />
                <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                  <strong className="text-[#01184C] dark:text-white font-semibold">RCCM :</strong> {settings.rccm}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative w-full rounded-2xl overflow-hidden bg-white dark:bg-[#0A2254] border border-slate-200 dark:border-[#D4AF37]/30 shadow-xl dark:shadow-2xl group"
            >
              <div className="relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden">
                <img
                  src={imageUrl}
                  srcSet={`${LOCAL_IMAGES.heroImageMobile} 480w, ${LOCAL_IMAGES.heroImage} 960w`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                  alt={imageAlt}
                  width={560}
                  height={420}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.heroWestAfrica;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#01184C] via-[#01184C]/30 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 dark:bg-[#01184C]/90 backdrop-blur-md border border-slate-200 dark:border-[#D4AF37]/30 shadow-lg text-[#01184C] dark:text-white">
                  <p className="text-[10px] uppercase font-bold text-[#B38F22] dark:text-[#D4AF37] tracking-wider">
                    {t('hero.visual_subtitle', 'Siège Opérationnel • Niamey')}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-[#01184C] dark:text-white mt-0.5">
                    {t('hero.visual_title', 'Téléconseillers, Superviseurs & Consultants')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
