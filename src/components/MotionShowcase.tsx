import React, { useMemo, useState } from 'react';
import {
  Building2,
  Code2,
  Compass,
  Cpu,
  Database,
  Headphones,
  Pause,
  Play,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones,
  Database,
  Compass,
  Code2,
  TrendingUp,
  Cpu,
  Sparkles,
  ShoppingBag,
};

function buildSequence<T>(items: T[], minimumCount: number): T[] {
  if (items.length === 0) return [];
  const sequence: T[] = [];
  while (sequence.length < minimumCount) {
    sequence.push(...items);
  }
  return sequence.slice(0, Math.max(items.length, minimumCount));
}

export const MotionShowcase: React.FC = () => {
  const { services, sectors } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);

  const activeServices = useMemo(
    () => services.filter((service) => service.status !== 'hidden'),
    [services],
  );

  const serviceSequence = useMemo(() => buildSequence(activeServices, 12), [activeServices]);
  const sectorSequence = useMemo(() => buildSequence(sectors, 16), [sectors]);

  if (activeServices.length === 0) return null;

  const getServiceTitle = (service: (typeof activeServices)[number]) => {
    const paddedNumber = String(service.number).padStart(2, '0');
    const translatedTitle = t(`service.${paddedNumber}.title`);
    return isEnglish && translatedTitle !== `service.${paddedNumber}.title`
      ? translatedTitle
      : service.title;
  };

  const renderServiceSequence = (copyIndex: number) => (
    <div key={`services-copy-${copyIndex}`} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
      {serviceSequence.map((service, index) => {
        const Icon = SERVICE_ICONS[service.iconName] || Sparkles;
        return (
          <article
            key={`${copyIndex}-${service.id}-${index}`}
            className="flex min-h-24 w-[17rem] shrink-0 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:w-[20rem]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#0A2254] text-[#D4AF37]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                {t('nav.services', 'Service')} {String(service.number).padStart(2, '0')}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white">
                {getServiceTitle(service)}
              </h3>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderSectorSequence = (copyIndex: number) => (
    <div key={`sectors-copy-${copyIndex}`} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
      {sectorSequence.map((sector, index) => (
        <span
          key={`${copyIndex}-${sector.id}-${index}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white/[0.06] px-4 py-2.5 text-xs font-bold tracking-wide text-slate-100"
        >
          <Building2 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
          {sector.name}
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-label={t('motion.title', 'Nos prestations en mouvement')}
      className="relative mt-14 overflow-hidden border-y border-[#D4AF37]/25 bg-[#01184C] py-10 text-white sm:py-12"
    >
      {/* Halos décoratifs, sans impact sur la mise en page */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl" />
        <div className="absolute -bottom-28 right-1/5 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('motion.badge', 'Motion Design • En direct')}
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.02em] sm:text-3xl">
              {t('motion.title', 'Nos prestations en mouvement')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
              {t(
                'motion.description',
                'Un aperçu animé de nos pôles d’expertise et de nos secteurs d’intervention à Niamey.',
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            aria-pressed={isPaused}
            aria-label={
              isPaused
                ? t('motion.play_animation', 'Reprendre l’animation')
                : t('motion.pause_animation', 'Mettre l’animation en pause')
            }
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-white/[0.07] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-[#01184C]"
          >
            {isPaused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
            {isPaused ? t('motion.play', 'Lecture') : t('motion.pause', 'Pause')}
          </button>
        </div>
      </div>

      <p className="sr-only">
        {t('motion.services_label', 'Prestations')} :{' '}
        {activeServices.map((service) => getServiceTitle(service)).join(', ')}.{' '}
        {t('motion.sectors_label', 'Secteurs accompagnés')} :{' '}
        {sectors.map((sector) => sector.name).join(', ')}.
      </p>

      <div className="relative mt-8 space-y-5" aria-hidden="true">
        <div>
          <p className="mx-auto mb-3 max-w-7xl px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]/80 sm:px-6 lg:px-8">
            {t('motion.services_label', 'Prestations')}
          </p>
          <div
            className="motion-marquee motion-marquee-viewport overflow-hidden py-1"
            data-paused={isPaused ? 'true' : 'false'}
          >
            <div
              className="motion-marquee-track flex w-max"
              style={{ '--marquee-duration': '46s' } as React.CSSProperties}
            >
              {[0, 1].map(renderServiceSequence)}
            </div>
          </div>
        </div>

        {sectors.length > 0 && (
          <div>
            <p className="mx-auto mb-3 max-w-7xl px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]/80 sm:px-6 lg:px-8">
              {t('motion.sectors_label', 'Secteurs accompagnés')}
            </p>
            <div
              className="motion-marquee motion-marquee-viewport overflow-hidden py-1"
              data-paused={isPaused ? 'true' : 'false'}
            >
              <div
                className="motion-marquee-track motion-marquee-track-reverse flex w-max"
                style={{ '--marquee-duration': '54s' } as React.CSSProperties}
              >
                {[0, 1].map(renderSectorSequence)}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
