import React, { useState } from 'react';
import { Sparkles, MapPin, Mail, Phone, Clock, MessageSquare, Check, Send } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SocialFollowButtons } from '../components/SocialFollowButtons';
import { LOCAL_IMAGES } from '../data/images';

export const ContactPage: React.FC = () => {
  const { settings, submitContactMessage, media } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const contactMedia = media.find(
    (m) => m.location === 'contact-multichannel' || m.id === 'contact-multichannel'
  );
  const imageUrl = contactMedia?.url || LOCAL_IMAGES.contactDesk;
  const imageAlt = contactMedia?.alt || 'Centre de contact Excellence Services SARL';
  const imageSrcSet = contactMedia?.srcSet || `${LOCAL_IMAGES.contactDeskMobile} 480w, ${LOCAL_IMAGES.contactDesk} 960w`;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);
    try {
      await submitContactMessage({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject || (isEnglish ? 'Web form inquiry' : 'Message via formulaire web'),
        message: formData.message,
      });
    } catch (err) {
      console.warn('Error saving message into Firestore', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    settings.defaultWhatsAppMessage
  )}`;

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        <Breadcrumbs items={[{ label: t('nav.contact', 'Contact') }]} />

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-[11px]">{t('contact_page.badge', 'Contact & Disponibilité')}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-tight text-balance">
            {t('contact_page.title', 'Prenez contact avec notre direction commerciale à Niamey.')}
          </h1>
          <p className="mt-3 text-base text-[#475569] dark:text-slate-300 leading-relaxed font-normal text-pretty">
            {t(
              'contact_page.desc',
              "Nous sommes à votre disposition pour analyser vos besoins, planifier une démonstration de nos solutions ou établir une offre commerciale sur mesure."
            )}
          </p>
        </div>

        {/* 2-Column Contact Info + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Contact Info */}
          <div className="lg:col-span-5 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#01184C] text-[#0E1D38] dark:text-white border border-slate-200 dark:border-[#D4AF37]/30 shadow-xl dark:shadow-2xl space-y-6 relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37]">
                {isEnglish ? 'Official Coordinates' : 'Coordonnées Officielles'}
              </span>
              <h3 className="text-2xl font-extrabold mt-1 text-[#01184C] dark:text-white">
                {isEnglish ? "Let's discuss your priorities" : 'Échangeons sur vos enjeux'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {isEnglish
                  ? 'Our permanent team in Niamey is available to review your goals and schedule a strategic consultation.'
                  : "Notre équipe permanente basée à Niamey est à votre disposition pour analyser vos besoins et convenir d'un rendez-vous stratégique."}
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-slate-200 dark:border-[#D4AF37]/30 shadow-lg bg-slate-100 dark:bg-[#0A2254]">
              <img
                src={imageUrl}
                srcSet={imageSrcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                alt={imageAlt}
                width={600}
                height={340}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-[#01184C] via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  {isEnglish ? 'Continuous Dialogue & Active Listening' : 'Dialogue & Écoute Permanente'}
                </span>
                <span className="text-[#D4AF37] font-bold">Niamey</span>
              </div>
            </div>

            <div className="space-y-4 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#01184C] dark:text-white">{isEnglish ? 'Location' : 'Localisation'}</p>
                  <p className="text-slate-600 dark:text-slate-300">{settings.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#01184C] dark:text-white">{isEnglish ? 'Email Address' : 'Courrier électronique'}</p>
                  <a href={`mailto:${settings.email}`} className="text-[#01184C] dark:text-[#D4AF37] hover:underline font-semibold">
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#01184C] dark:text-white">{isEnglish ? 'Telephone Lines' : 'Lignes téléphoniques'}</p>
                  <p>
                    <a href={`tel:${settings.phones[0]?.raw || '+22778798900'}`} className="hover:text-[#01184C] dark:hover:text-[#D4AF37] font-medium">
                      {settings.phones[0]?.number || '+227 78 79 89 00'}
                    </a>
                  </p>
                  {settings.phones[1] && (
                    <p>
                      <a href={`tel:${settings.phones[1]?.raw}`} className="hover:text-[#01184C] dark:hover:text-[#D4AF37] font-medium">
                        {settings.phones[1]?.number}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border border-slate-300 dark:border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#01184C] dark:text-white">{t('contact_page.hours_label', "Horaires d'ouverture")}</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {isEnglish ? 'Monday to Friday: 8:00 AM - 6:00 PM | Saturday: 9:00 AM - 1:00 PM' : settings.workingHours}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A2254]/60 border border-slate-200 dark:border-white/10 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>{isEnglish ? 'Tax ID (NIF):' : 'NIF :'}</span>
                <span className="font-mono text-[#01184C] dark:text-white font-bold">{settings.nif}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{isEnglish ? 'Trade ID (RCCM):' : 'RCCM :'}</span>
                <span className="font-mono text-[#B38F22] dark:text-[#D4AF37] font-bold">{settings.rccm}</span>
              </div>
            </div>

            {/* Direct WhatsApp */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
                {isEnglish ? 'Directly on WhatsApp' : 'Directement sur WhatsApp'}
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-2xl bg-[#F7B900] hover:bg-[#E5A700] text-[#01184C] text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{t('common.whatsapp_chat', 'Discuter sur WhatsApp')}</span>
              </a>
            </div>

            {/* Suivez-nous */}
            <SocialFollowButtons showTitle={true} title={isEnglish ? 'Follow Us' : 'Suivez-nous'} size="md" />
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 shadow-xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mx-auto border-2 border-[#D4AF37]">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[#0E1D38] dark:text-white">
                  {t('contact.success_title', 'Message transmis avec succès')}
                </h3>
                <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300 max-w-md mx-auto">
                  {t('contact.success_desc', "Merci pour votre message. Notre direction commerciale prendra contact avec vous dans les plus brefs délais.")}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                  className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#01184C] hover:bg-[#D4AF37] text-white hover:text-[#01184C] dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-white transition-all cursor-pointer"
                >
                  {t('contact.new_message', 'Envoyer un autre message')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-[#0E1D38] dark:text-white mb-2">
                  {t('contact_page.form_title', 'Envoyez-nous un message')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      {isEnglish ? 'Full Name' : 'Votre nom complet'} <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isEnglish ? 'Mr. / Ms. John Doe' : 'M. / Mme'}
                      className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      {isEnglish ? 'Business Email' : 'Email professionnel'} <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@organisation.com"
                      className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      {isEnglish ? 'Phone Number' : 'Téléphone'}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+227 00 00 00 00"
                      className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      {t('contact_page.subject', 'Objet du message')}
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={t('contact_page.subject_placeholder', "Ex: Demande d'information générale")}
                      className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                    {isEnglish ? 'Message' : 'Message'} <span className="text-[#D4AF37]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={isEnglish ? 'Please provide brief details on your inquiry...' : 'Précisez votre demande...'}
                    className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#01184C] hover:bg-[#D4AF37] text-white hover:text-[#01184C] dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-white font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>{t('contact.submitting', 'Transmission en cours...')}</span>
                  ) : (
                    <>
                      <span>{t('contact.submit_btn', 'Transmettre le message')}</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A2254] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0E1D38] dark:text-white">{isEnglish ? 'Headquarters & Offices in Niamey' : 'Siège social & Bureaux à Niamey'}</h3>
              <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300">
                {settings.location} — {isEnglish ? 'Open Mon-Fri 08:00 - 18:00' : `Ouvert du ${settings.workingHours}`}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#01184C] text-[#01184C] dark:text-[#D4AF37] border border-[#DDE4EE] dark:border-[#D4AF37]/30">
            {isEnglish ? 'Republic of Niger' : 'République du Niger'}
          </span>
        </div>
      </div>
    </div>
  );
};
