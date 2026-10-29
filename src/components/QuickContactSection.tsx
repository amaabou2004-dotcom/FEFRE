import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { SocialFollowButtons } from './SocialFollowButtons';

export const QuickContactSection: React.FC = () => {
  const { settings, submitContactMessage } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const phonePrimary = settings.phones[0]?.number || '+227 78 79 89 00';
  const phoneRaw = settings.phones[0]?.raw || '+22778798900';
  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    settings.defaultWhatsAppMessage
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.message) return;

    setLoading(true);
    try {
      await submitContactMessage({
        fullName: formData.name,
        email: formData.contact.includes('@') ? formData.contact : 'non-fourni@client.com',
        phone: !formData.contact.includes('@') ? formData.contact : '',
        subject: 'Demande rapide via la page d’accueil',
        message: formData.message,
      });
    } catch (err) {
      console.warn('Erreur envoi message:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <section id="contact" className="pt-20 pb-28 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#01184C] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-3.5 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-[11px]">{t('contact.badge', 'Échanges Directs & Localisation')}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
            {t('contact.title', 'Parlons de vos objectifs et de vos besoins opérationnels.')}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl mx-auto text-pretty">
            {t(
              'contact.desc',
              "Nos directeurs de mission et consultants à Niamey sont à votre écoute pour évaluer vos projets et vous transmettre une proposition d'accompagnement sur mesure."
            )}
          </p>
        </div>

        {/* 2-Columns Grid: Left = Info & Map, Right = Simple Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct channels & Map */}
          <div className="lg:col-span-6 space-y-6">
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <a
                href={`tel:${phoneRaw}`}
                className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all flex items-center gap-3.5 group shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('contact.phone_direct', 'Téléphone direct')}
                  </span>
                  <span className="text-sm font-bold text-[#0E1D38] dark:text-white truncate block group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors">
                    {phonePrimary}
                  </span>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all flex items-center gap-3.5 group shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('contact.whatsapp_direct', 'WhatsApp Direct')}
                  </span>
                  <span className="text-sm font-bold text-[#0E1D38] dark:text-white truncate block group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors">
                    {settings.whatsapp}
                  </span>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${settings.email}`}
                className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all flex items-center gap-3.5 group shadow-xs hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('contact.email_direct', 'Courrier électronique')}
                  </span>
                  <span className="text-xs font-bold text-[#0E1D38] dark:text-white truncate block group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors">
                    {settings.email}
                  </span>
                </div>
              </a>

              {/* Location / Hours */}
              <div className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 flex items-center gap-3.5 shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('contact.hq_label', 'Siège à Niamey')}
                  </span>
                  <span className="text-xs font-bold text-[#0E1D38] dark:text-white truncate block">
                    {settings.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="w-full h-56 rounded-2xl overflow-hidden border border-[#DDE4EE] dark:border-white/10 shadow-xs relative">
              <iframe
                title="Localisation Excellence Services SARL Niamey"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124233.15555437894!2d2.0360775838032747!3d13.518625906806497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x11d07525381f96e9%3A0x6fb8cbdb0d4ea916!2sNiamey%2C%20Niger!5e0!3m2!1sfr!2sne!4v1710000000000!5m2!1sfr!2sne"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Right Column: Direct WhatsApp + Socials + Quick Message Form */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#F8FAFD] dark:bg-[#07193F] border border-[#DDE4EE] dark:border-[#1B3E82]/70 shadow-sm space-y-6">
            {/* Direct WhatsApp CTA */}
            <div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-2.5">
                {isEnglish ? 'Directly on WhatsApp' : 'Directement sur WhatsApp'}
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl bg-[#F7B900] hover:bg-[#E5A700] text-[#01184C] font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>{t('contact.whatsapp_direct', 'Discuter sur WhatsApp')}</span>
              </a>
            </div>

            {/* Suivez-nous (Facebook & TikTok) */}
            <SocialFollowButtons showTitle={true} title={isEnglish ? 'Follow Us' : 'Suivez-nous'} size="md" />

            {/* Divider */}
            <div className="border-t border-[#DDE4EE] dark:border-[#1B3E82]/60 pt-6">
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-[#0E1D38] dark:text-white mb-1">
                {t('contact.form_title', 'Message rapide')}
              </h3>
              <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300 mb-6 leading-relaxed">
                {t('contact.form_subtitle', 'Remplissez ce formulaire simplifié. Nos conseillers vous recontactent sous 24h ouvrées.')}
              </p>

              {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-white dark:bg-[#01184C] border border-[#D4AF37]/50 text-center space-y-3 shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#0E1D38] dark:text-white">
                  {t('contact.success_title', 'Message envoyé avec succès !')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                  {isEnglish
                    ? `Thank you ${formData.name}. An Excellence Services SARL consultant will contact you shortly.`
                    : `Merci ${formData.name}. Un conseiller d'Excellence Services SARL prendra contact avec vous très rapidement.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', contact: '', message: '' });
                  }}
                  className="text-xs font-bold text-[#D4AF37] hover:underline pt-2 inline-block cursor-pointer"
                >
                  {t('contact.new_message', 'Envoyer un autre message')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="quick-name" className="block text-xs font-bold text-[#0E1D38] dark:text-slate-200 mb-1.5">
                    {t('contact.name_placeholder', 'Votre nom complet *')}
                  </label>
                  <input
                    id="quick-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isEnglish ? "e.g. John Doe or Company Ltd" : "Ex: Amadou Oumarou"}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs sm:text-sm text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="quick-contact" className="block text-xs font-bold text-[#0E1D38] dark:text-slate-200 mb-1.5">
                    {t('contact.contact_placeholder', 'Téléphone ou Email *')}
                  </label>
                  <input
                    id="quick-contact"
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder={isEnglish ? "e.g. +227 90 00 00 00 or contact@company.com" : "Ex: +227 90 00 00 00 ou contact@entreprise.ne"}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs sm:text-sm text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="quick-message" className="block text-xs font-bold text-[#0E1D38] dark:text-slate-200 mb-1.5">
                    {isEnglish ? 'Your message or inquiry *' : 'Votre message ou besoin *'}
                  </label>
                  <textarea
                    id="quick-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t(
                      'contact.message_placeholder',
                      'Ex: Je souhaite externaliser la gestion des appels de mon entreprise...'
                    )}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs sm:text-sm text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#01184C] dark:bg-[#D4AF37] text-white dark:text-[#01184C] font-bold text-xs sm:text-sm hover:bg-[#0A2254] dark:hover:bg-[#E5C358] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span>{t('contact.submitting', 'Envoi en cours...')}</span>
                  ) : (
                    <>
                      <span>{t('contact.submit_btn', 'Envoyer mon message')}</span>
                      <Send className="w-4 h-4 text-[#D4AF37] dark:text-[#01184C]" />
                    </>
                  )}
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
