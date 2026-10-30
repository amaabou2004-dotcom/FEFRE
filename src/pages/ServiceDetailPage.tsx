import React from 'react';
import { ArrowLeft, Sparkles, Check, ArrowRight, MessageSquare } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { SITE_MEDIA_CATALOG } from '../data/media';
import { LOCAL_IMAGES } from '../data/images';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface ServiceDetailPageProps {
  slug: string;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { services, sectors, media, settings } = useSiteData();

  const service = services.find(
    (s) => s.slug === slug && (!s.status || s.status === 'active')
  );
  const activeSectors = sectors.filter((s) => !s.status || s.status === 'active');

  if (!service) {
    return (
      <div className="pt-36 pb-20 px-4 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#0E1D38] dark:text-white">Service non trouvé</h2>
        <p className="text-slate-500 mb-6">Le domaine de prestation demandé n'existe pas.</p>
        <button
          onClick={() => navigate('/services')}
          className="px-6 py-2.5 rounded-full bg-[#01184C] hover:bg-[#D4AF37] text-white hover:text-[#01184C] text-xs font-bold transition-all cursor-pointer"
        >
          Retour aux services
        </button>
      </div>
    );
  }

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
  const imageAlt = mediaItem?.alt || catalogItem?.alt || service.title;
  const imageSrcSet = mediaItem?.srcSet || catalogItem?.srcSet;

  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    `Bonjour Excellence Services SARL, je souhaite des précisions concernant le service : ${service.title}.`
  )}`;

  return (
    <div className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: service.title },
          ]}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#01184C] dark:text-[#D4AF37] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tous les services</span>
          </button>
          <span className="font-mono text-2xl font-black text-[#D4AF37]">SERVICE {service.number}</span>
        </div>

        {imageUrl && (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#DDE4EE] dark:border-white/10 aspect-[21/9] sm:aspect-[21/8]">
            <img
              src={imageUrl}
              srcSet={imageSrcSet}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 960px"
              alt={imageAlt}
              width={960}
              height={365}
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = LOCAL_IMAGES.africanContactCenter;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#01184C] via-[#01184C]/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 px-3 py-1 rounded-full bg-[#01184C]/80 backdrop-blur-md border border-[#D4AF37]/30">
                Pôle d'Expertise Spécialisé • Excellence Services SARL
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{service.positioning}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {service.title}
          </h1>
          <p className="text-base sm:text-lg text-[#536582] dark:text-slate-300 leading-relaxed max-w-3xl">
            {service.summary}
          </p>
        </div>

        {/* Deliverables / Prestations */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 shadow-xl">
          <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2 text-[#0E1D38] dark:text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span>Prestations incluses & livrables :</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.prestations.map((pres, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10"
              >
                <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5 border border-[#D4AF37]/30">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#0E1D38] dark:text-slate-200">
                  {pres}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sectors concerned */}
        <div className="p-8 rounded-3xl bg-[#EEF2F8] dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37] mb-4">
            Secteurs cibles particulièrement concernés
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeSectors.map((sec) => (
              <span
                key={sec.id}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs font-semibold text-[#0E1D38] dark:text-slate-200"
              >
                {sec.name}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-100 dark:bg-[#01184C] text-[#0E1D38] dark:text-white border border-slate-200 dark:border-[#D4AF37]/40 shadow-xl dark:shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1 text-[#01184C] dark:text-white">
              Besoin de déployer ce service pour votre organisation ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Recevez une proposition chiffrée et un calendrier d'intervention sous 48h.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto relative z-10">
            <button
              onClick={() => navigate('/devis')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-extrabold text-xs tracking-wide transition-all cursor-pointer shadow"
            >
              <span>Demander un devis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white dark:bg-[#0A2254] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-[#D4AF37]/40 text-xs font-semibold text-[#01184C] dark:text-white transition-all cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37]" />
              <span>Échanger sur WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
