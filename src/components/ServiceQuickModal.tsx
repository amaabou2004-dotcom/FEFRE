import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { ServiceItem } from '../types';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { SITE_MEDIA_CATALOG } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';

interface ServiceQuickModalProps {
  service: ServiceItem | null;
  onClose: () => void;
}

export const ServiceQuickModal: React.FC<ServiceQuickModalProps> = ({ service, onClose }) => {
  const { navigate } = useRouter();
  const { media, settings } = useSiteData();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (service) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [service, onClose]);

  if (!service) return null;

  const numPadded = service.number.padStart(2, '0');
  const mediaItem = media.find(
    (m) =>
      m.location === `service-${numPadded}` ||
      m.location === `service-${service.number}` ||
      m.id.includes(numPadded)
  );
  const catalogItem = Object.values(SITE_MEDIA_CATALOG).find(
    (m) => m.location === `service-${numPadded}` || m.id.includes(numPadded)
  );

  const imageUrl = mediaItem?.url || catalogItem?.url || (service as any).image;
  const imageSrcSet = mediaItem?.srcSet || catalogItem?.srcSet;
  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    `Bonjour Excellence Services SARL, je souhaite des précisions concernant le service : ${service.title}.`
  )}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#01184C]/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0A2254] rounded-3xl shadow-2xl border border-[#DDE4EE] dark:border-white/10 overflow-hidden z-10 my-8"
        >
          {/* Header with image */}
          {imageUrl && (
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#01184C]">
              <img
                src={imageUrl}
                srcSet={imageSrcSet}
                sizes="(max-width: 640px) 100vw, 672px"
                alt={service.title}
                width={672}
                height={224}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.africanContactCenter;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01184C] via-[#01184C]/40 to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/40 font-mono font-bold text-xs text-[#D4AF37]">
                SERVICE {service.number}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fenêtre"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#01184C]/80 text-white hover:bg-[#D4AF37] hover:text-[#01184C] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!imageUrl && (
            <div className="flex items-center justify-between p-6 border-b border-[#DDE4EE] dark:border-white/10">
              <span className="font-mono font-bold text-xs text-[#D4AF37]">
                SERVICE {service.number}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fenêtre"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Modal Content */}
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                {service.positioning}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0E1D38] dark:text-white">
                {service.title}
              </h3>
              <p className="text-sm text-[#536582] dark:text-slate-300 mt-2 leading-relaxed">
                {service.summary}
              </p>
            </div>

            {/* Prestations list */}
            {service.prestations && service.prestations.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[#EEF2F8] dark:border-white/10">
                <h4 className="text-xs font-bold text-[#0E1D38] dark:text-white uppercase tracking-wider">
                  Ce que comprend cette solution :
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {service.prestations.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#0E1D38] dark:text-slate-200">
                      <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#EEF2F8] dark:border-white/10 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/devis');
                }}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-bold text-xs tracking-wide shadow transition-colors cursor-pointer"
              >
                <span>Demander un devis pour ce service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#01184C] border border-slate-300 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10 text-xs font-semibold transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/services/${service.slug}`);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#D4AF37] transition-colors cursor-pointer"
              >
                <span>Page complète</span>
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
