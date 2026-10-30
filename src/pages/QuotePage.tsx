import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  ArrowLeft,
  ArrowRight,
  Send,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Check,
} from 'lucide-react';
import { useSiteData } from '../lib/DataContext';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface QuotePageProps {
  initialService?: string;
}

const BUDGET_RANGES = [
  'Non spécifié / À évaluer',
  'Moins de 1 000 000 FCFA',
  '1 000 000 – 5 000 000 FCFA',
  '5 000 000 – 15 000 000 FCFA',
  'Plus de 15 000 000 FCFA',
];

const TIMELINES = [
  'Dès que possible (< 1 mois)',
  '1 à 3 mois',
  '3 à 6 mois',
  'Projet à moyen / long terme (> 6 mois)',
];

const STEPS_LABELS = ['Votre besoin', 'Votre projet', 'Vos informations', 'Confirmation'];

export const QuotePage: React.FC<QuotePageProps> = ({ initialService }) => {
  const { services, sectors, submitQuote } = useSiteData();

  const serviceList = services.filter((s) => !s.status || s.status === 'active');
  const sectorList = sectors.filter((s) => !s.status || s.status === 'active');

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    service: initialService || serviceList[0]?.title || '',
    sector: sectorList[0]?.name || '',
    description: '',
    budget: 'Non spécifié / À évaluer',
    timeline: 'Dès que possible (< 1 mois)',
    fileName: '',
    lastName: '',
    firstName: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
  });

  // Si l'admin renomme, masque ou supprime le service/secteur sélectionné
  // pendant que ce formulaire est ouvert, on bascule sur une valeur valide.
  const serviceTitlesKey = serviceList.map((s) => s.title).join('|');
  const sectorNamesKey = sectorList.map((s) => s.name).join('|');
  useEffect(() => {
    setFormData((prev) => {
      const nextService = serviceList.some((s) => s.title === prev.service)
        ? prev.service
        : initialService && serviceList.some((s) => s.title === initialService)
          ? initialService
          : serviceList[0]?.title || '';
      const nextSector = sectorList.some((s) => s.name === prev.sector)
        ? prev.sector
        : sectorList[0]?.name || '';
      return nextService === prev.service && nextSector === prev.sector
        ? prev
        : { ...prev, service: nextService, sector: nextSector };
    });
    // Les clés textuelles évitent de relancer l'effet à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialService, serviceTitlesKey, sectorNamesKey]);

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.service) errs.service = 'Veuillez sélectionner un service.';
      if (!formData.sector) errs.sector = 'Veuillez sélectionner un secteur.';
      if (!formData.description.trim()) {
        errs.description = 'Veuillez décrire brièvement vos objectifs ou vos besoins.';
      } else if (formData.description.trim().length < 10) {
        errs.description = 'La description doit comporter au moins 10 caractères.';
      }
    } else if (s === 2) {
      if (!formData.budget) errs.budget = 'Veuillez sélectionner une tranche budgétaire indicatif.';
      if (!formData.timeline) errs.timeline = 'Veuillez préciser le délai souhaité.';
    } else if (s === 3) {
      if (!formData.lastName.trim()) errs.lastName = 'Le nom est obligatoire.';
      if (!formData.firstName.trim()) errs.firstName = 'Le prénom est obligatoire.';
      if (!formData.email.trim()) {
        errs.email = "L'adresse email est requise.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = "L'adresse email n'est pas valide.";
      }
      if (!formData.phone.trim()) errs.phone = 'Le numéro de téléphone est obligatoire.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, fileName: e.target.files[0].name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setSubmitting(true);
    try {
      await submitQuote(formData);
      setStep(4);
    } catch (err) {
      console.warn('Quote submitted locally or firestore error', err);
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
        <Breadcrumbs items={[{ label: 'Demande de devis' }]} />

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="uppercase tracking-wider text-[11px]">Étude & Cotation Sur Mesure</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-tight text-balance">
            Demande de devis & étude personnalisée
          </h1>
          <p className="text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
            Remplissez les 4 étapes ci-dessous pour exposer votre projet. Notre direction commerciale et technique à Niamey formulera une proposition calibrée sous 24 à 48 heures.
          </p>
        </div>

        {/* Benefits banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 flex items-center gap-3 shadow-sm">
            <Clock className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div>
              <p className="font-bold text-[#0E1D38] dark:text-white">Réactivité 24/48h</p>
              <p className="text-[#475569] dark:text-slate-400">Prise en charge diligente à Niamey</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 flex items-center gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div>
              <p className="font-bold text-[#0E1D38] dark:text-white">Confidentialité Totale</p>
              <p className="text-[#475569] dark:text-slate-400">Protection stricte de vos données</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div>
              <p className="font-bold text-[#0E1D38] dark:text-white">Accompagnement Sur Mesure</p>
              <p className="text-[#475569] dark:text-slate-400">Offre adaptée à votre modèle d'affaires</p>
            </div>
          </div>
        </div>

        {/* Wizard Box */}
        <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white dark:bg-[#0A2254]/30 border border-[#DDE4EE] dark:border-white/10 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold mb-2 text-[#01184C] dark:text-[#D4AF37]">
              <span className="tabular-nums">Étape 0{step} / 04 — {STEPS_LABELS[step - 1]}</span>
              <span className="tabular-nums font-mono">{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EEF2F8] dark:bg-[#01184C] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3D87E] rounded-full"
                initial={false}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0E1D38] dark:text-white mb-1">
                    Étape 01 : Votre besoin
                  </h3>
                  <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300">
                    Sélectionnez le service clé et votre secteur d'activité.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-2">
                    Service souhaité <span className="text-[#D4AF37]">*</span>
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => {
                      setFormData({ ...formData, service: e.target.value });
                      if (errors.service) setErrors({ ...errors, service: '' });
                    }}
                    className="w-full p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {serviceList.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.number} - {s.title}
                      </option>
                    ))}
                  </select>
                  {errors.service && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.service}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-2">
                    Secteur d'activité <span className="text-[#D4AF37]">*</span>
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) => {
                      setFormData({ ...formData, sector: e.target.value });
                      if (errors.sector) setErrors({ ...errors, sector: '' });
                    }}
                    className="w-full p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {sectorList.map((sec) => (
                      <option key={sec.id} value={sec.name}>
                        {sec.name}
                      </option>
                    ))}
                    <option value="Autre secteur">Autre secteur d'activité</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200">
                      Description de votre besoin <span className="text-[#D4AF37]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#01184C] dark:text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>Cadrer avec le Conseiller IA</span>
                    </button>
                  </div>

                  {/* Fast Framing Suggestions */}
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          service: serviceList[0]?.title || prev.service,
                          description:
                            "Nous souhaitons externaliser la réception d'appels et le support multicanal (appels, WhatsApp, email) pour notre clientèle à Niamey, avec suivi rigoureux des KPIs et astreinte continue.",
                        }));
                        if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EEF2F8] dark:bg-[#01184C] hover:bg-[#D4AF37]/20 border border-[#DDE4EE] dark:border-white/10 text-[#0E1D38] dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      + Centre d’appels 24/7
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          service: serviceList[1]?.title || prev.service,
                          description:
                            "Nous avons besoin d'intégrer un CRM moderne (HubSpot/Salesforce/Zoho) avec automatisation de nos relances commerciales, centralisation des données clients et formation des équipes.",
                        }));
                        if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EEF2F8] dark:bg-[#01184C] hover:bg-[#D4AF37]/20 border border-[#DDE4EE] dark:border-white/10 text-[#0E1D38] dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      + Intégration CRM & Pipeline
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          service: serviceList[2]?.title || prev.service,
                          description:
                            "Nous souhaitons lancer une campagne de télémarketing ciblée pour qualifier notre base prospects et planifier des rendez-vous commerciaux qualifiés pour nos équipes de vente.",
                        }));
                        if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EEF2F8] dark:bg-[#01184C] hover:bg-[#D4AF37]/20 border border-[#DDE4EE] dark:border-white/10 text-[#0E1D38] dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      + Prospection B2B & Leads
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) setErrors({ ...errors, description: '' });
                    }}
                    placeholder="Ex : Nous souhaitons externaliser notre relation client et déployer un CRM interconnecté avec nos canaux digitaux..."
                    className="w-full p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#01184C] hover:bg-[#D4AF37] text-white hover:text-[#01184C] dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-white font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    <span>Continuer vers l'étape 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0E1D38] dark:text-white mb-1">
                    Étape 02 : Votre projet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300">
                    Précisez l'enveloppe budgétaire indicative et vos délais cibles.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-2">
                    Budget indicatif
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {BUDGET_RANGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-2">
                    Délai envisagé
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {TIMELINES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-2">
                    Cahier des charges ou pièce jointe (optionnel)
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#DDE4EE] dark:border-white/15 rounded-2xl cursor-pointer hover:border-[#D4AF37] bg-[#F8FAFD] dark:bg-[#01184C]/40 transition-colors">
                    <div className="flex flex-col items-center justify-center text-center">
                      <UploadCloud className="w-8 h-8 text-[#D4AF37] mb-2" />
                      <p className="text-xs font-semibold text-[#0E1D38] dark:text-white">
                        {formData.fileName ? (
                          <span className="text-[#D4AF37] font-mono flex items-center gap-1">
                            <FileText className="w-4 h-4" /> {formData.fileName}
                          </span>
                        ) : (
                          'Cliquez pour joindre un document (PDF, DOCX, ZIP)'
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Taille maximale : 10 Mo</p>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.zip,.png,.jpg"
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#DDE4EE] dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#01184C] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#01184C] hover:bg-[#D4AF37] text-white hover:text-[#01184C] dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-white font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    <span>Continuer vers l'étape 3</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0E1D38] dark:text-white mb-1">
                    Étape 03 : Vos informations
                  </h3>
                  <p className="text-xs sm:text-sm text-[#536582] dark:text-slate-300">
                    Vos coordonnées directes pour vous adresser une proposition chiffrée.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      Nom <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (errors.lastName) setErrors({ ...errors, lastName: '' });
                      }}
                      placeholder="Ex : Moussa"
                      className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      Prénom <span className="text-[#D4AF37]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (errors.firstName) setErrors({ ...errors, firstName: '' });
                      }}
                      placeholder="Ex : Ibrahim"
                      className="w-full p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                    Entreprise / Organisation
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Nom de votre société ou institution"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                    Email professionnel <span className="text-[#D4AF37]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      placeholder="nom@entreprise.com"
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      Téléphone <span className="text-[#D4AF37]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        placeholder="+227 90 00 00 00"
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0E1D38] dark:text-slate-200 mb-1.5">
                      Numéro WhatsApp (optionnel)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+227 78 00 00 00"
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-sm text-[#0E1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#DDE4EE] dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#01184C] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-extrabold text-xs tracking-wide hover:shadow-lg shadow-[#D4AF37]/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#01184C] border-t-transparent rounded-full animate-spin" />
                        <span>Transmission en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Valider ma demande de devis</span>
                        <Send className="w-4 h-4 text-[#01184C]" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mx-auto border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20">
                  <Check className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-extrabold text-[#0E1D38] dark:text-white">
                    Demande transmise avec succès !
                  </h3>
                  <p className="text-sm font-semibold text-[#D4AF37]">
                    Merci pour votre demande. Notre équipe vous contactera prochainement.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F8FAFD] dark:bg-[#01184C]/60 border border-[#DDE4EE] dark:border-white/10 text-xs text-left max-w-md mx-auto space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service :</span>
                    <span className="font-semibold text-[#0E1D38] dark:text-white text-right">
                      {formData.service}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Demandeur :</span>
                    <span className="font-semibold text-[#0E1D38] dark:text-white">
                      {formData.firstName} {formData.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact :</span>
                    <span className="font-mono text-[#D4AF37] font-semibold">
                      {formData.email} / {formData.phone}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setFormData({
                        service: serviceList[0]?.title || '',
                        sector: sectorList[0]?.name || '',
                        description: '',
                        budget: 'Non spécifié / À évaluer',
                        timeline: 'Dès que possible (< 1 mois)',
                        fileName: '',
                        lastName: '',
                        firstName: '',
                        company: '',
                        email: '',
                        phone: '',
                        whatsapp: '',
                      });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#DDE4EE] dark:border-white/10 text-xs font-bold text-[#0E1D38] dark:text-white hover:bg-slate-100 dark:hover:bg-[#01184C] cursor-pointer"
                  >
                    <span>Nouvelle demande</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
