import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Phone, Mail, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';

export const OfficialLocationMap: React.FC = () => {
  const { settings } = useSiteData();

  // Coordonnées approximatives de Niamey (Plateau / Centre des Affaires)
  const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124233.15555437894!2d2.0360775838032747!3d13.518625906806497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x11d07525381f96e9%3A0x6fb8cbdb0d4ea916!2sNiamey%2C%20Niger!5e0!3m2!1sfr!2sne!4v1710000000000!5m2!1sfr!2sne";
  const directMapsUrl = "https://maps.google.com/?q=Niamey,+Niger";

  return (
    <div id="official-location-map" className="w-full bg-white dark:bg-[#07193F] rounded-3xl border border-[#DDE4EE] dark:border-white/10 shadow-xl overflow-hidden transition-all">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Colonne Coordonnées et Informations Réglementaires */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-gradient-to-b from-transparent to-[#F8FAFD]/50 dark:to-[#01184C]/30">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-3">
              <MapPin className="w-3.5 h-3.5" />
              Siège Opérationnel
            </div>
            <h3 className="text-2xl font-bold text-[#0E1D38] dark:text-white tracking-tight">
              Nos Bureaux à Niamey
            </h3>
            <p className="mt-2 text-sm text-[#536582] dark:text-slate-300 leading-relaxed">
              Retrouvez nos équipes de direction, consultants seniors et superviseurs au cœur de la capitale pour échanger sur vos projets stratégiques.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#01184C]/5 dark:bg-white/5 text-[#D4AF37] shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#536582] dark:text-slate-400 font-semibold">
                  Adresse Officielle
                </p>
                <p className="text-sm font-medium text-[#0E1D38] dark:text-white mt-0.5">
                  {settings.location}
                </p>
                <p className="text-xs text-[#536582] dark:text-slate-400">
                  République du Niger
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#01184C]/5 dark:bg-white/5 text-[#D4AF37] shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#536582] dark:text-slate-400 font-semibold">
                  Horaires d'Ouverture
                </p>
                <p className="text-sm font-medium text-[#0E1D38] dark:text-white mt-0.5">
                  {settings.workingHours}
                </p>
                <p className="text-xs text-[#536582] dark:text-slate-400">
                  Accueil sur rendez-vous ou sans interruption
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#01184C]/5 dark:bg-white/5 text-[#D4AF37] shrink-0 mt-0.5">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#536582] dark:text-slate-400 font-semibold">
                  Ligne Directe
                </p>
                <a
                  href={`tel:${settings.phones[0]?.raw || '+22778798900'}`}
                  className="text-sm font-medium text-[#0E1D38] dark:text-white hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors inline-block mt-0.5"
                >
                  {settings.phones[0]?.number || '+227 78 79 89 00'}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#01184C]/5 dark:bg-white/5 text-[#D4AF37] shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#536582] dark:text-slate-400 font-semibold">
                  Courrier Électronique
                </p>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm font-medium text-[#0E1D38] dark:text-white hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors inline-block mt-0.5"
                >
                  {settings.email}
                </a>
              </div>
            </div>
          </div>

          {/* Mentions légales d'identification */}
          <div className="pt-4 border-t border-[#DDE4EE] dark:border-white/10 flex flex-col gap-1.5 text-xs text-[#536582] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Immatriculation RCCM : <strong>{settings.rccm}</strong></span>
            </div>
            <div className="pl-5.5">
              <span>Numéro NIF : <strong>{settings.nif}</strong></span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={directMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#01184C] hover:bg-[#0A2254] dark:bg-[#D4AF37] dark:hover:bg-[#E5C358] text-white dark:text-[#01184C] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg group"
            >
              <Navigation className="w-4 h-4 text-[#D4AF37] dark:text-[#01184C] group-hover:scale-110 transition-transform" />
              <span>Ouvrir dans Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-auto" />
            </a>
          </div>
        </div>

        {/* Colonne Carte Interactive */}
        <div className="lg:col-span-7 relative min-h-[350px] lg:min-h-[480px] bg-slate-100 dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-[#DDE4EE] dark:border-white/10 overflow-hidden">
          <iframe
            title="Localisation Excellence Services SARL à Niamey"
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '380px' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full absolute inset-0 filter saturate-105 contrast-100 dark:contrast-105 dark:opacity-90"
          />

          {/* Badge Overlay */}
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#01184C]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#DDE4EE] dark:border-white/10 shadow-lg pointer-events-none flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-[#0E1D38] dark:text-white">
              Siège Niamey Actif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
