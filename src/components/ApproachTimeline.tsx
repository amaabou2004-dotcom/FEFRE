import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { CURATED_IMAGES } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';

export const ApproachTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { media } = useSiteData();
  const { t, isEnglish } = useLanguage();

  const approachMedia = media.find(
    (m) => m.location === 'approach-methodology' || m.id === 'approach-methodology'
  );
  const imageUrl = approachMedia?.url || CURATED_IMAGES.approach.url;
  const imageAlt = approachMedia?.alt || CURATED_IMAGES.approach.alt;
  const imageSrcSet = approachMedia?.srcSet || CURATED_IMAGES.approach.srcSet;

  const steps = [
    {
      number: '01',
      title: t('approach.step1_title', 'Comprendre'),
      subtitle: t('approach.step1_sub', 'Analyse des besoins'),
      description: t(
        'approach.step1_desc',
        'Immersion complète dans votre écosystème pour identifier les défis relationnels, technologiques et organisationnels.'
      ),
      details: isEnglish
        ? [
            'Baseline audit & friction points analysis',
            'Customer & collaborator expectation mapping',
            'Target performance metrics & SLA definition',
          ]
        : [
            "Diagnostic de l'existant et des points de friction",
            'Cartographie des attentes clients et collaborateurs',
            'Définition des indicateurs de performance cibles',
          ],
    },
    {
      number: '02',
      title: t('approach.step2_title', 'Concevoir'),
      subtitle: t('approach.step2_sub', 'Création d’une solution adaptée'),
      description: t(
        'approach.step2_desc',
        'Élaboration d’architectures sur mesure associant technologies modernes et compétences humaines qualifiées.'
      ),
      details: isEnglish
        ? [
            'Coherent omnichannel journey design',
            'Technical specifications & tool selection',
            'Progressive rollout planning & budgetary estimation',
          ]
        : [
            'Design de parcours omnicanaux cohérents',
            'Spécifications techniques et choix des outils',
            'Planification progressive et estimation budgétaire',
          ],
    },
    {
      number: '03',
      title: t('approach.step3_title', 'Déployer'),
      subtitle: t('approach.step3_sub', 'Mise en œuvre'),
      description: t(
        'approach.step3_desc',
        'Exécution rigoureuse de la solution avec intégration technique, formation des équipes et tests de robustesse.'
      ),
      details: isEnglish
        ? [
            'Platform setup and CRM/telecom deployment',
            'Intensive coaching for advisors and managers',
            'Soft-launch phased rollout & switchover control',
          ]
        : [
            'Configuration et déploiement des plateformes',
            'Formation des conseillers et équipes métiers',
            'Lancement progressif et gestion de la bascule',
          ],
    },
    {
      number: '04',
      title: t('approach.step4_title', 'Optimiser'),
      subtitle: t('approach.step4_sub', 'Suivi et amélioration continue'),
      description: t(
        'approach.step4_desc',
        'Analyse continue des métriques, ajustement des processus et accompagnement pour pérenniser l’impact.'
      ),
      details: isEnglish
        ? [
            'Continuous quality assurance & dual call monitoring',
            'Weekly & monthly KPI dashboards and reports',
            'Workflow tuning and progressive technology upgrades',
          ]
        : [
            'Contrôle qualité permanent et double écoute',
            'Rapports d’activité hebdomadaires et mensuels',
            'Optimisation des flux et mise à niveau technologique',
          ],
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#01184C] text-[#0E1D38] dark:text-white border-y border-slate-200 dark:border-transparent relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-200/40 dark:bg-[#0A2254]/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-slate-200 dark:border-[#D4AF37]/40 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('approach.badge', "Méthodologie & Rigueur d'Exécution")}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#01184C] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('approach.title', 'Notre Approche : une trajectoire maîtrisée en 4 temps.')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-200/90 leading-relaxed text-pretty">
              {t(
                'approach.desc',
                "De l'analyse approfondie des besoins jusqu'à l'amélioration continue, nous structurons chaque étape pour garantir un impact tangible et durable sur vos indicateurs de performance."
              )}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-[#D4AF37]/30 shadow-2xl aspect-[16/10] bg-white dark:bg-[#0A2254] group">
              <img
                src={imageUrl}
                srcSet={imageSrcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                alt={imageAlt}
                width={560}
                height={350}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.approachStrategy;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01184C] via-[#01184C]/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-200 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/30">
                  {t('approach.sla_badge', 'Pilotage par Jalons Stratégiques')}
                </span>
                <span className="text-[10px] font-mono text-[#D4AF37] font-bold">SLA 100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                onClick={() => setActiveStep(idx)}
                className={`relative p-6 sm:p-7 rounded-3xl cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                  isActive
                    ? 'bg-white dark:bg-[#0A2254] border-[#B38F22] dark:border-[#D4AF37] shadow-xl ring-1 ring-[#D4AF37]/50'
                    : 'bg-white/80 dark:bg-[#0A2254]/30 backdrop-blur-sm border-slate-200 dark:border-white/10 hover:border-[#D4AF37]/60 hover:bg-white dark:hover:bg-[#0A2254]/50 shadow-sm'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="timeline-active-badge"
                    className="absolute -top-2.5 right-6 px-3 py-0.5 rounded-full bg-[#01184C] text-[#D4AF37] border border-[#D4AF37] text-[10px] uppercase font-mono font-bold shadow-sm"
                  >
                    {t('approach.active_badge', 'Étape Active')}
                  </motion.div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`font-display text-3xl sm:text-4xl font-extrabold tabular-nums tracking-[-0.03em] transition-colors ${
                        isActive ? 'text-[#B38F22] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-[#D4AF37]/50'
                      }`}
                    >
                      {step.number}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-[#D4AF37] text-[#01184C]' : 'bg-slate-100 dark:bg-[#01184C] text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#01184C] dark:text-white mb-1.5 tracking-tight">{step.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B38F22] dark:text-[#D4AF37] mb-3">{step.subtitle}</p>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-5">{step.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-2.5">
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200/90 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
