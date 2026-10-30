import React, { useState } from 'react';
import { ShieldCheck, MapPin, Mail, Phone, Clock, MessageSquare, Bot } from 'lucide-react';
import { Link } from '../lib/router';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { SocialFollowButtons } from './SocialFollowButtons';

export const Footer: React.FC = () => {
  const { settings, services } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const [legalModal, setLegalModal] = useState<'mentions' | 'privacy' | null>(null);

  const activeServices = services.filter((s) => !s.status || s.status === 'active');
  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(settings.defaultWhatsAppMessage)}`;

  return (
    <footer className="bg-slate-100 dark:bg-[#01184C] text-[#0E1D38] dark:text-white border-t border-slate-200 dark:border-white/10 pt-16 pb-[calc(3rem+var(--mobile-bottom-nav-height))] lg:pb-12 overflow-hidden relative transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-blue-200/40 dark:bg-[#0A2254]/50 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-200 dark:border-white/10">
          {/* Col 1: Brand & NIF/RCCM */}
          <div className="lg:col-span-2 space-y-4">
            <Logo showSubtitle />
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md pt-2">
              {settings.mission}
            </p>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0A2254]/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-2 max-w-md shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">NIF :</span>
                <span className="font-mono text-[#01184C] dark:text-white font-semibold tabular-nums">{settings.nif}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">RCCM :</span>
                <span className="font-mono text-[#B38F22] dark:text-[#D4AF37] font-bold tabular-nums">{settings.rccm}</span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#D4AF37] hover:text-[#01184C] dark:bg-[#0A2254] dark:hover:bg-[#D4AF37] dark:hover:text-[#01184C] text-[#01184C] dark:text-white text-xs font-bold border border-slate-300 dark:border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all shadow-xs group"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37] group-hover:text-[#01184C] transition-colors" />
                <span>Discuter sur WhatsApp ({settings.whatsapp})</span>
              </a>
            </div>

            <div className="pt-2 max-w-xs">
              <SocialFollowButtons showTitle={true} title="Suivez-nous" size="sm" />
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37] mb-4">
              {t('footer.col_nav', 'Navigation')}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <Link href="/" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.home', 'Accueil')}
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.about', 'À propos')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.services', 'Nos Services')}
                </Link>
              </li>
              <li>
                <Link href="/secteurs" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.sectors', "Secteurs d'intervention")}
                </Link>
              </li>
              <li>
                <Link href="/realisations" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.portfolio', 'Réalisations')}
                </Link>
              </li>
              <li>
                <Link
                  href="/espace-partenaire"
                  className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
                >
                  <span>{t('nav.partner_space', 'Espace Partenaire')}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-200 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/40">
                    PRO
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/actualites" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.news', 'Actualités')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors">
                  {t('nav.contact', 'Contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/assistant-ia"
                  className="hover:text-[#01184C] dark:hover:text-[#D4AF37] text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Bot className="w-3.5 h-3.5 text-[#01184C] dark:text-[#D4AF37]" />
                  <span>{t('nav.consult_ai', 'Assistant IA')}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#D4AF37]/20 text-[#01184C] dark:text-[#D4AF37] border border-[#D4AF37]/30">
                    24/7
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/telechargement" className="text-[#01184C] dark:text-[#D4AF37] font-semibold hover:underline flex items-center gap-1.5">
                  <span>Export cPanel LWS</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#D4AF37]/20 text-[#01184C] dark:text-[#D4AF37] border border-[#D4AF37]/30">
                    ZIP
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/devis" className="text-[#01184C] dark:text-[#D4AF37] font-semibold hover:underline">
                  {t('nav.request_quote', 'Demander un devis')} →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37] mb-4">
              {t('footer.col_expertise', 'Pôles d’Expertise')}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {activeServices.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-[10px] text-[#01184C] dark:text-[#D4AF37] font-mono">{service.number}</span>
                    <span className="line-clamp-1">
                      {isEnglish && t(`service.${service.number}.title`) !== `service.${service.number}.title`
                        ? t(`service.${service.number}.title`)
                        : service.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Coordonnées */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37] mb-4">
              {t('footer.col_contact', 'Siège & Contact')}
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{settings.location}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors break-all"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>
                    <a href={`tel:${settings.phones[0]?.raw || '+22778798900'}`} className="hover:text-[#01184C] dark:hover:text-[#D4AF37]">
                      {settings.phones[0]?.number || '+227 78 79 89 00'}
                    </a>
                  </p>
                  {settings.phones[1] && (
                    <p>
                      <a href={`tel:${settings.phones[1]?.raw}`} className="hover:text-[#01184C] dark:hover:text-[#D4AF37]">
                        {settings.phones[1]?.number}
                      </a>
                    </p>
                  )}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#01184C] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{settings.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} EXCELLENCE SERVICES SARL. {t('footer.rights', 'Tous droits réservés.')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            <LanguageToggle id="footer-language-toggle" variant="segmented" />
            <ThemeToggle id="footer-theme-toggle" showLabel className="text-[11px] py-1 px-3" />
            <button
              onClick={() => setLegalModal('mentions')}
              className="hover:text-[#D4AF37] transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              {t('footer.mentions', 'Mentions Légales')}
            </button>
            <button
              onClick={() => setLegalModal('privacy')}
              className="hover:text-[#D4AF37] transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              {t('footer.privacy', 'Politique de Confidentialité')}
            </button>
            <Link
              href="/admin"
              className="text-slate-500 hover:text-[#D4AF37] transition-colors"
              title="Portail Sécurisé"
            >
              Portail
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Mentions & Confidentialité */}
      {legalModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-[#01184C] border border-slate-200 dark:border-[#D4AF37]/30 text-slate-700 dark:text-slate-200 w-full max-w-2xl rounded-3xl p-6 md:p-8 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
              <h3 className="text-lg font-bold text-[#01184C] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#01184C] dark:text-[#D4AF37]" />
                {legalModal === 'mentions' ? 'Mentions Légales' : 'Politique de Confidentialité'}
              </h3>
              <button
                onClick={() => setLegalModal(null)}
                className="text-slate-600 dark:text-slate-300 hover:text-[#01184C] dark:hover:text-white px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#D4AF37] hover:text-[#01184C] dark:bg-[#0A2254] dark:hover:bg-[#D4AF37] dark:hover:text-[#01184C] transition-colors text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {legalModal === 'mentions' ? (
              <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#01184C] dark:text-white mb-1">1. Éditeur de la plateforme</h4>
                  <p>
                    Raison sociale : <strong>EXCELLENCE SERVICES SARL</strong>
                    <br />
                    Siège social : Niamey, Niger
                    <br />
                    NIF : {settings.nif}
                    <br />
                    RCCM : {settings.rccm}
                    <br />
                    Email : {settings.email}
                    <br />
                    Téléphones : +227 90 39 31 32 / +227 88 08 00 00 / WhatsApp : {settings.whatsapp}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#01184C] dark:text-white mb-1">2. Activités déclarées</h4>
                  <p>
                    Gestion de la relation client, centres de contact, solutions CRM, marketing digital, développement web & mobile, transformation numérique des organisations, développement commercial et solutions e-commerce.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#01184C] dark:text-white mb-1">3. Propriété intellectuelle</h4>
                  <p>
                    L'ensemble des contenus, marques, logos, visuels et architectures techniques présents sur ce site sont la propriété exclusive d'EXCELLENCE SERVICES SARL. Toute reproduction totale ou partielle sans autorisation expresse est strictement prohibée.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#01184C] dark:text-white mb-1">1. Collecte des données personnelles</h4>
                  <p>
                    Les informations recueillies via nos formulaires de contact et de demande de devis (nom, email, téléphone, entreprise) font l’objet d’un traitement informatique destiné exclusivement à la gestion de la relation client et aux échanges précontractuels.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[#01184C] dark:text-white mb-1">2. Confidentialité & Sécurité</h4>
                  <p>
                    Aucune donnée personnelle n'est cédée, louée ou vendue à des tiers. Vous disposez d'un droit permanent d'accès, de rectification et de suppression en nous écrivant à : <strong>{settings.email}</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
