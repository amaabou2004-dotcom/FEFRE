import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Award,
  CalendarDays,
  Download,
  FileBadge2,
  PenLine,
  ShieldCheck,
  X,
  ZoomIn,
} from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { SITE_MEDIA_CATALOG } from '../data/media';

const CERTIFICATE_MEDIA_ID = 'recognition-vivaesim-certificate';
const CERTIFICATE_DOWNLOAD_URL = '/certificates/vivaesim-official-certificate-ves-2025-001.jpg';

interface RecognitionCertificateSectionProps {
  /** Évite les marges externes lorsque la section est intégrée à une page déjà cadrée. */
  embedded?: boolean;
}

export const RecognitionCertificateSection: React.FC<RecognitionCertificateSectionProps> = ({
  embedded = false,
}) => {
  const { media } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  const catalogCertificate = SITE_MEDIA_CATALOG[CERTIFICATE_MEDIA_ID];
  const certificate =
    media.find((item) => item.id === CERTIFICATE_MEDIA_ID || item.location === CERTIFICATE_MEDIA_ID) ??
    catalogCertificate;

  // L'image affichée peut être remplacée depuis la Médiathèque Supabase.
  // Tant qu'il s'agit de l'attestation intégrée, le téléchargement pointe
  // vers le JPG stable publié dans /public/certificates.
  const downloadUrl = certificate.url === catalogCertificate.url ? CERTIFICATE_DOWNLOAD_URL : certificate.url;
  const certificateAlt = isEnglish ? t('recognition.alt', certificate.alt) : certificate.alt;
  const issueDate = isEnglish ? '3 June 2026' : '3 juin 2026';

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const details = [
    {
      icon: ShieldCheck,
      label: t('recognition.issuer_label', 'Émetteur'),
      value: 'Viva Nation Limited — Vivape | VivaeSIM',
    },
    {
      icon: FileBadge2,
      label: t('recognition.certificate_label', 'Certificat n°'),
      value: 'VES-2025-001',
    },
    {
      icon: CalendarDays,
      label: t('recognition.date_label', 'Délivré le'),
      value: issueDate,
    },
    {
      icon: PenLine,
      label: t('recognition.signatory_label', 'Signataire'),
      value: 'Md Atikur Rahman — Founder & CEO',
    },
  ];

  return (
    <section
      id="attestation-vivaesim"
      aria-labelledby="recognition-certificate-title"
      className={
        embedded
          ? 'relative'
          : 'relative py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#01184C] border-y border-[#DDE4EE] dark:border-white/10 transition-colors duration-300 overflow-hidden'
      }
    >
      {!embedded && (
        <>
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#01184C]/8 dark:bg-[#D4AF37]/8 blur-3xl" />
        </>
      )}

      <div className={embedded ? 'relative' : 'relative max-w-7xl mx-auto'}>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/45 bg-gradient-to-br from-[#FFF9E8] via-white to-[#EEF2F8] dark:from-[#0A2254] dark:via-[#071A42] dark:to-[#01184C] shadow-[0_24px_70px_rgba(1,24,76,0.14)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#01184C] via-[#D4AF37] to-[#01184C]" />
          <Award className="pointer-events-none absolute -right-8 -top-8 w-48 h-48 text-[#D4AF37]/8 dark:text-[#D4AF37]/10 rotate-12" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-9 lg:gap-12 items-center p-6 sm:p-9 lg:p-11">
            {/* Texte de présentation */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#01184C] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#01184C] shadow-sm">
                <Award className="w-4 h-4" />
                <span className="uppercase tracking-wider text-[11px] font-extrabold">
                  {t('recognition.badge', 'Reconnaissance officielle')}
                </span>
              </div>

              <div className="space-y-3.5">
                <h2
                  id="recognition-certificate-title"
                  className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] leading-[1.12] text-[#01184C] dark:text-white text-balance"
                >
                  {t('recognition.title', 'VivaeSIM salue la qualité de notre collaboration')}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-[#475569] dark:text-slate-300 text-pretty">
                  {t(
                    'recognition.desc',
                    "Viva Nation Limited, opérant sous les marques Vivape et VivaeSIM, a décerné à Excellence Services SARL son « Official Certificate of Satisfaction and Recognition ». Le document salue notre contribution à la promotion, à la commercialisation et au développement du service VivaeSIM, ainsi que notre professionnalisme et la réussite de la collaboration.",
                  )}
                </p>
              </div>

              <blockquote className="border-l-4 border-[#D4AF37] bg-white/75 dark:bg-white/5 rounded-r-2xl px-5 py-4 text-sm sm:text-[15px] font-medium italic leading-relaxed text-[#1E293B] dark:text-slate-100 shadow-sm">
                {t(
                  'recognition.quote',
                  '« VivaeSIM confirme sa pleine satisfaction quant à la qualité du service, à la coopération et à la performance d’Excellence Services SARL. »',
                )}
              </blockquote>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {details.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div
                      key={detail.label}
                      className="rounded-2xl border border-[#DDE4EE] dark:border-white/10 bg-white/85 dark:bg-[#01184C]/70 px-4 py-3.5 shadow-sm"
                    >
                      <dt className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {detail.label}
                      </dt>
                      <dd className="mt-1.5 text-xs sm:text-[13px] font-bold leading-snug text-[#01184C] dark:text-white">
                        {detail.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="btn-sheen inline-flex items-center justify-center gap-2 rounded-xl bg-[#01184C] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#D4AF37] hover:text-[#01184C] dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-white cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>{t('recognition.view', 'Voir l’attestation')}</span>
                </button>

                <a
                  href={downloadUrl}
                  download="vivaesim-official-certificate-ves-2025-001.jpg"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#01184C]/20 dark:border-white/15 bg-white/80 dark:bg-white/5 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-[#01184C] dark:text-white transition-colors hover:border-[#D4AF37] hover:text-[#8A6D14] dark:hover:text-[#D4AF37]"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('recognition.download', 'Télécharger')}</span>
                </a>
              </div>
            </div>

            {/* Attestation */}
            <figure className="lg:col-span-7 relative">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label={`${t('recognition.view', 'Voir l’attestation')} — ${certificateAlt}`}
                className="group relative block w-full cursor-zoom-in rounded-[1.35rem] bg-gradient-to-br from-[#01184C] via-[#D4AF37] to-[#01184C] p-1.5 shadow-[0_22px_55px_rgba(1,24,76,0.28)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/60"
              >
                <span className="block overflow-hidden rounded-[1.05rem] bg-white">
                  <img
                    src={certificate.url}
                    srcSet={certificate.srcSet}
                    sizes="(max-width: 1024px) 100vw, 760px"
                    alt={certificateAlt}
                    width={1080}
                    height={810}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[4/3] w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.012]"
                  />
                </span>
                <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-[#01184C]/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm transition-colors group-hover:bg-[#D4AF37] group-hover:text-[#01184C]">
                  <ZoomIn className="w-3.5 h-3.5" />
                  {t('recognition.zoom_hint', 'Cliquer pour agrandir')}
                </span>
              </button>
              <figcaption className="mt-3.5 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t(
                  'recognition.caption',
                  'Attestation officielle publiée telle que reçue de Viva Nation Limited (Vivape | VivaeSIM).',
                )}
              </figcaption>
            </figure>
          </div>
        </motion.div>
      </div>

      {/* Visionneuse plein écran */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#010B26]/92 p-3 sm:p-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={certificateAlt}
            onClick={() => setIsOpen(false)}
          >
            <motion.figure
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-full w-full max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                autoFocus
                onClick={() => setIsOpen(false)}
                aria-label={t('recognition.close', 'Fermer l’attestation')}
                className="absolute -top-2 right-0 sm:-top-3 sm:-right-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#D4AF37] text-[#01184C] shadow-xl transition-colors hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={certificate.url}
                srcSet={certificate.srcSet}
                sizes="100vw"
                alt={certificateAlt}
                width={1080}
                height={810}
                decoding="async"
                className="block max-h-[84dvh] w-full rounded-2xl bg-white object-contain shadow-2xl"
              />

              <figcaption className="mt-3 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                <span className="text-xs font-semibold text-slate-200">
                  Official Certificate of Satisfaction and Recognition — VES-2025-001
                </span>
                <a
                  href={downloadUrl}
                  download="vivaesim-official-certificate-ves-2025-001.jpg"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#01184C] shadow transition-colors hover:bg-[#D4AF37]"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('recognition.download', 'Télécharger')}
                </a>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
