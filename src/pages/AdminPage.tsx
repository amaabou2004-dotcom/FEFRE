import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  LayoutDashboard,
  Briefcase,
  Layers,
  Quote,
  Handshake,
  FileText,
  HelpCircle,
  MessageSquare,
  Settings as SettingsIcon,
  Image as ImageIcon,
  BookOpen,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Save,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Download,
  Database,
  Newspaper,
  FolderKanban,
  Files,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { PartnerManager } from '../components/admin/PartnerManager';
import { EntityManager } from '../components/admin/EntityManager';

/**
 * Éditeur des paramètres du site (table Supabase `site_settings`).
 * Les téléphones sont stockés en JSON : 3 lignes fixes comme sur le site.
 */
const SettingsEditor: React.FC = () => {
  const { settings, updateSettings } = useSiteData();
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    location: '',
    country: '',
    email: '',
    whatsapp: '',
    whatsappRaw: '',
    workingHours: '',
    nif: '',
    rccm: '',
    tagline: '',
    heroSubtitle: '',
    mission: '',
    aboutText: '',
    defaultWhatsAppMessage: '',
    shopNotice: '',
    seoDefaultTitle: '',
    seoDefaultDescription: '',
    facebook: '',
    tiktok: '',
    valuesText: '',
  });
  const [phones, setPhones] = useState<{ label: string; number: string; raw: string }[]>([]);
  const [shopStatus, setShopStatus] = useState<'in_preparation' | 'open' | 'maintenance'>('in_preparation');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: settings.name || '',
      shortName: settings.shortName || '',
      location: settings.location || '',
      country: settings.country || '',
      email: settings.email || '',
      whatsapp: settings.whatsapp || '',
      whatsappRaw: settings.whatsappRaw || '',
      workingHours: settings.workingHours || '',
      nif: settings.nif || '',
      rccm: settings.rccm || '',
      tagline: settings.tagline || '',
      heroSubtitle: settings.heroSubtitle || '',
      mission: settings.mission || '',
      aboutText: settings.aboutText || '',
      defaultWhatsAppMessage: settings.defaultWhatsAppMessage || '',
      shopNotice: settings.shopNotice || '',
      seoDefaultTitle: settings.seoDefaultTitle || '',
      seoDefaultDescription: settings.seoDefaultDescription || '',
      facebook: settings.facebook || '',
      tiktok: settings.tiktok || '',
      valuesText: (settings.values || []).join('\n'),
    });
    setPhones(settings.phones?.length ? settings.phones : [{ label: '', number: '', raw: '' }]);
    setShopStatus(settings.shopStatus || 'in_preparation');
  }, [settings]);

  const fields: { key: keyof typeof form; label: string; textarea?: boolean }[] = [
    { key: 'name', label: 'Raison sociale' },
    { key: 'shortName', label: 'Nom court' },
    { key: 'location', label: 'Localisation' },
    { key: 'country', label: 'Pays' },
    { key: 'email', label: 'Email officiel' },
    { key: 'whatsapp', label: 'WhatsApp (affiché)' },
    { key: 'whatsappRaw', label: 'WhatsApp (format international, sans +)' },
    { key: 'workingHours', label: 'Horaires' },
    { key: 'nif', label: 'NIF' },
    { key: 'rccm', label: 'RCCM' },
    { key: 'tagline', label: 'Slogan', textarea: true },
    { key: 'heroSubtitle', label: 'Sous-titre page d’accueil', textarea: true },
    { key: 'mission', label: 'Mission', textarea: true },
    { key: 'aboutText', label: 'Texte « À propos »', textarea: true },
    { key: 'defaultWhatsAppMessage', label: 'Message WhatsApp par défaut', textarea: true },
    { key: 'shopNotice', label: 'Message boutique' },
    { key: 'seoDefaultTitle', label: 'Titre SEO par défaut' },
    { key: 'seoDefaultDescription', label: 'Description SEO par défaut', textarea: true },
    { key: 'facebook', label: 'Lien Facebook' },
    { key: 'tiktok', label: 'Lien TikTok' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const { valuesText, ...rest } = form;
      await updateSettings({
        ...rest,
        values: valuesText.split('\n').map((v) => v.trim()).filter(Boolean),
        phones: phones.filter((p) => p.number.trim()),
        shopStatus,
      });
      setFeedback({ type: 'success', message: 'Coordonnées et paramètres enregistrés dans Supabase : tout le site est à jour.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Enregistrement impossible : ${err?.message || 'erreur inconnue'}` });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]';
  const labelCls = 'block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5';

  return (
    <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[#0A2254]/40 border border-white/10 space-y-5">
      <div>
        <h3 className="text-lg font-bold">Coordonnées, mentions légales & textes du site</h3>
        <p className="text-xs text-gray-400">Enregistrés dans Supabase (table site_settings) et appliqués immédiatement à toutes les pages.</p>
      </div>
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/50 border-red-500/40 text-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
            <label className={labelCls}>{f.label}</label>
            {f.textarea ? (
              <textarea
                value={form[f.key]}
                rows={3}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className={inputCls}
              />
            ) : (
              <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls} />
            )}
          </div>
        ))}
        <div>
          <label className={labelCls}>Valeurs (une par ligne)</label>
          <textarea value={form.valuesText} rows={3} onChange={(e) => setForm({ ...form, valuesText: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>État de la boutique</label>
          <select value={shopStatus} onChange={(e) => setShopStatus(e.target.value as any)} className={inputCls}>
            <option value="in_preparation" className="bg-[#01184C]">En préparation</option>
            <option value="open" className="bg-[#01184C]">Ouverte</option>
            <option value="maintenance" className="bg-[#01184C]">Maintenance</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-[11px] uppercase font-bold tracking-wider text-slate-300">Lignes téléphoniques</p>
        {phones.map((p, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={p.label}
              placeholder="Libellé (ex : Ligne Principale)"
              onChange={(e) => setPhones(phones.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              className={inputCls}
            />
            <input
              value={p.number}
              placeholder="+227 …"
              onChange={(e) => setPhones(phones.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))}
              className={inputCls}
            />
            <input
              value={p.raw}
              placeholder="227… (sans +)"
              onChange={(e) => setPhones(phones.map((x, j) => (j === i ? { ...x, raw: e.target.value } : x)))}
              className={inputCls}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPhones([...phones, { label: '', number: '', raw: '' }])}
          className="text-[11px] font-semibold text-[#D4AF37] hover:underline cursor-pointer"
        >
          + Ajouter une ligne
        </button>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-xs font-bold disabled:opacity-50 cursor-pointer"
      >
        <Save className="w-3.5 h-3.5" />
        {saving ? 'Enregistrement…' : 'Enregistrer dans Supabase'}
      </button>
    </form>
  );
};

export const AdminPage: React.FC = () => {
  const { isAdmin, isAuthenticated, loginWithPassword, logout, currentUser } = useAuth();
  const { currentPath, navigate } = useRouter();
  const {
    services,
    sectors,
    testimonials,
    partners,
    quotes,
    contactMessages,
    settings,
    media,
    faqs,
    projects,
    articles,
    pages,
    isConnectedToCloud,
    isSupabaseConfigured,
    refreshData,
    saveService,
    deleteService,
    saveSector,
    deleteSector,
    saveTestimonial,
    deleteTestimonial,
    savePartner,
    deletePartner,
    saveProject,
    deleteProject,
    saveArticle,
    deleteArticle,
    savePage,
    updateQuoteStatus,
    updateMessageStatus,
    deleteQuote,
    deleteContactMessage,
    updateSettings,
    saveMedia,
    deleteMedia,
    saveFaq,
    deleteFaq,
    seedDatabaseIfNeeded,
    resetToDefaults,
  } = useSiteData();

  // Login form state (mot de passe uniquement, sans email)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tab mapping
  const getTabFromPath = (p: string) => {
    if (p.includes('/services')) return 'services';
    if (p.includes('/secteurs')) return 'sectors';
    if (p.includes('/temoignages')) return 'testimonials';
    if (p.includes('/partenaires') || p.includes('/partners')) return 'partners';
    if (p.includes('/faq')) return 'faq';
    if (p.includes('/contact')) return 'contact';
    if (p.includes('/parametres') || p.includes('/settings')) return 'settings';
    if (p.includes('/medias') || p.includes('/media')) return 'media';
    if (p.includes('/guide')) return 'guide';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(currentPath));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(getTabFromPath(currentPath));
  }, [currentPath]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (tab === 'dashboard') navigate('/admin');
    else if (tab === 'services') navigate('/admin/services');
    else if (tab === 'sectors') navigate('/admin/secteurs');
    else if (tab === 'testimonials') navigate('/admin/temoignages');
    else if (tab === 'partners') navigate('/admin/partenaires');
    else if (tab === 'faq') navigate('/admin/faq');
    else if (tab === 'contact') navigate('/admin/contact');
    else if (tab === 'settings') navigate('/admin/parametres');
    else if (tab === 'media') navigate('/admin/medias');
    else if (tab === 'guide') navigate('/admin/guide');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!password.trim()) {
      setLoginError('Veuillez saisir le mot de passe administrateur.');
      return;
    }
    setIsLoggingIn(true);
    const res = await loginWithPassword(password);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Mot de passe incorrect. Veuillez vérifier votre saisie.');
    }
  };

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Réimporter les contenus par défaut dans Supabase ? Les éléments par défaut (services, secteurs, FAQ, etc.) seront réécrits avec leurs valeurs d’origine. Les éléments que vous avez ajoutés en plus sont conservés.'
      )
    ) {
      return;
    }
    try {
      await resetToDefaults();
    } catch (err: any) {
      window.alert(`Réinitialisation impossible : ${err?.message || 'erreur inconnue'}`);
    }
  };

  // If not admin, show streamlined login
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-200/40 dark:bg-[#0A2254]/50 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#01184C]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0A2254] text-[#D4AF37] flex items-center justify-center mx-auto border border-slate-200 dark:border-[#D4AF37]/40 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#01184C] dark:text-white tracking-tight">
                Portail Administrateur
              </h1>
              <p className="text-xs text-slate-500 dark:text-gray-400">Excellence Services SARL • Niamey, Niger</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-[#0A2254]/60 border border-slate-200 dark:border-[#D4AF37]/30 text-[10px] font-mono text-[#01184C] dark:text-[#D4AF37]">
                <Database className="w-3 h-3 animate-pulse text-[#D4AF37]" />
                <span>ACCÈS PAR MOT DE PASSE • SUPABASE</span>
              </div>
            </div>

            {!isSupabaseConfigured && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/40 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Supabase n’est pas encore configuré sur ce site
                </p>
                <p>
                  Ajoutez <code className="font-mono font-semibold">VITE_SUPABASE_URL</code> et{' '}
                  <code className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</code>, exécutez le script SQL
                  fourni, créez le compte admin avec votre mot de passe dans Supabase, puis redéployez. Guide :{' '}
                  <strong>SUPABASE_SETUP.md</strong>.
                </p>
              </div>
            )}

            {isSupabaseConfigured && isAuthenticated && !isAdmin && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-xs text-red-700 dark:text-red-300 space-y-2">
                <p>
                  Mot de passe accepté, mais ce compte n’est pas reconnu administrateur : vérifiez qu’il figure dans
                  la table <code className="font-mono">admin_users</code> de Supabase (guide SUPABASE_SETUP.md).
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Se déconnecter
                </button>
              </div>
            )}

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
                  Mot de passe administrateur
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="current-password"
                    placeholder="Saisissez votre mot de passe"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A2254]/60 border border-slate-300 dark:border-white/10 text-xs text-[#0E1D38] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 dark:text-gray-400 hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-extrabold text-xs tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    'Accéder à l’espace admin'
                  )}
                </button>
                <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-gray-500">
                  Accès par mot de passe uniquement. Le mot de passe se configure une seule fois dans Supabase → Authentication → Users (guide SUPABASE_SETUP.md).
                </p>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs text-slate-500 dark:text-gray-400 hover:text-[#01184C] dark:hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  ← Retour au site public
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tabs config
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'services', label: `Services (${services.length})`, icon: Briefcase },
    { id: 'sectors', label: 'Secteurs d’activité', icon: Layers },
    { id: 'testimonials', label: 'Témoignages', icon: Quote },
    { id: 'partners', label: `Partenaires (${partners.length})`, icon: Handshake },
    { id: 'projects', label: `Réalisations (${projects.length})`, icon: FolderKanban },
    { id: 'articles', label: `Actualités (${articles.length})`, icon: Newspaper },
    { id: 'pages', label: 'Pages du site', icon: Files },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    {
      id: 'contact',
      label: 'Devis & Messages',
      icon: MessageSquare,
      badge:
        quotes.filter((q) => q.status === 'new').length +
        contactMessages.filter((m) => m.status === 'unread').length,
    },
    { id: 'settings', label: 'Coordonnées & SARL', icon: SettingsIcon },
    { id: 'media', label: 'Médiathèque', icon: ImageIcon },
    { id: 'guide', label: 'Guide Administrateur', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white flex flex-col font-sans max-w-full overflow-x-hidden transition-colors duration-300">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#01184C] border-r border-slate-200 dark:border-white/10 text-[#0E1D38] dark:text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div>
              <Logo showSubtitle={true} className="scale-90 origin-left" />
              <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0A2254] border border-slate-200 dark:border-[#D4AF37]/30 text-[10px] font-mono text-[#01184C] dark:text-[#D4AF37] w-fit">
                <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                <span>CONSOLE ADMIN V2.0</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-[#01184C] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#01184C] font-bold shadow-md shadow-[#D4AF37]/20'
                      : 'text-slate-600 dark:text-gray-300 hover:text-[#01184C] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0A2254]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#01184C]' : 'text-[#B38F22] dark:text-[#D4AF37]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isSelected ? 'bg-[#01184C] text-[#D4AF37]' : 'bg-[#D4AF37] text-[#01184C]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2 bg-slate-50 dark:bg-[#01184C]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Thème :</span>
            <ThemeToggle className="w-8 h-8" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 hover:text-[#01184C] dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 border border-slate-300 dark:border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#B38F22] dark:text-[#D4AF37]" />
            <span>Voir le site public</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se déconnecter</span>
          </button>
          <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-gray-500">
            Connecté : {currentUser?.email || 'Administrateur Général'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#01184C]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#0A2254] text-slate-700 dark:text-gray-300 hover:text-[#01184C] dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-[#01184C] dark:text-white capitalize">
              {navItems.find((i) => i.id === activeTab)?.label || 'Console Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/download/cpanel"
              download="excellence-services-cpanel-public_html.zip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-[11px] font-extrabold shadow-sm transition-all cursor-pointer"
              title="Télécharger l'archive ZIP pour hébergement cPanel LWS"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Télécharger ZIP cPanel</span>
              <span className="sm:hidden">ZIP cPanel</span>
            </a>
            <ThemeToggle className="w-8 h-8" />
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A2254] border border-slate-300 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-gray-300 hover:text-[#01184C] dark:hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer shadow-2xs"
              title="Réimporter les contenus par défaut dans Supabase"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          </div>
        </header>

        {/* Tab views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-xs">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Services</p>
                  <p className="text-2xl font-bold text-[#B38F22] dark:text-[#D4AF37] mt-1">{services.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-xs">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Secteurs</p>
                  <p className="text-2xl font-bold text-[#B38F22] dark:text-[#D4AF37] mt-1">{sectors.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-xs">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Partenaires</p>
                  <p className="text-2xl font-bold text-[#B38F22] dark:text-[#D4AF37] mt-1">{partners.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-xs">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Devis Reçus</p>
                  <p className="text-2xl font-bold text-[#B38F22] dark:text-[#D4AF37] mt-1">{quotes.length}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-xs col-span-2 lg:col-span-1">
                  <p className="text-xs text-gray-400">Messages Web</p>
                  <p className="text-2xl font-bold text-[#D4AF37] mt-1">{contactMessages.length}</p>
                </div>
              </div>

              {/* Export cPanel LWS Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#01184C] via-[#0A2254] to-[#01184C] border border-[#D4AF37]/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                      Prêt pour Déploiement Production
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Export Hébergement cPanel LWS
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Téléchargez en un clic les archives ZIP prêtes à être téléversées et extraites directement dans votre gestionnaire de fichiers cPanel LWS (avec <span className="text-[#D4AF37] font-mono font-semibold">.htaccess</span> Apache/LiteSpeed préconfiguré, images WebP optimisées et SPA routing).
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    <a
                      href="/download/cpanel"
                      download="excellence-services-cpanel-public_html.zip"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-xs font-black shadow-md hover:shadow-lg transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Archive public_html (Recommandé)</span>
                    </a>
                    <a
                      href="/download/cpanel-nodejs"
                      download="excellence-services-cpanel-nodejs.zip"
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all"
                      title="Pour le module cPanel Setup Node.js App"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Archive Node.js</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-3xl bg-[#0A2254]/30 border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Accès Rapides & Raccourcis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleTabChange('services')}
                    className="p-4 rounded-xl bg-[#01184C] hover:bg-[#0A2254] border border-white/10 text-left transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-5 h-5 text-[#D4AF37] mb-2" />
                    <h4 className="text-xs font-bold text-white">Gérer les 8 Services</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Modifier descriptions & prestations</p>
                  </button>

                  <button
                    onClick={() => handleTabChange('partners')}
                    className="p-4 rounded-xl bg-[#01184C] hover:bg-[#0A2254] border border-white/10 text-left transition-colors cursor-pointer"
                  >
                    <Handshake className="w-5 h-5 text-[#D4AF37] mb-2" />
                    <h4 className="text-xs font-bold text-white">Gérer les Partenaires</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ajout, modification & visibilité</p>
                  </button>

                  <button
                    onClick={() => handleTabChange('contact')}
                    className="p-4 rounded-xl bg-[#01184C] hover:bg-[#0A2254] border border-white/10 text-left transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 text-[#D4AF37] mb-2" />
                    <h4 className="text-xs font-bold text-white">Traiter les Devis & Contacts</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Consulter les demandes soumises</p>
                  </button>

                  <button
                    onClick={() => handleTabChange('settings')}
                    className="p-4 rounded-xl bg-[#01184C] hover:bg-[#0A2254] border border-white/10 text-left transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-5 h-5 text-[#D4AF37] mb-2" />
                    <h4 className="text-xs font-bold text-white">Coordonnées Officielles</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Téléphones, NIF, RCCM, WhatsApp</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <EntityManager
              title="Catalogue des Services"
              description="Table Supabase « services » — modifiez les offres affichées sur tout le site."
              items={services}
              onSave={saveService}
              onDelete={deleteService}
              getTitle={(srv) => `${srv.number ? srv.number + ' — ' : ''}${srv.title}`}
              getSubtitle={(srv) => srv.summary}
              defaults={{ status: 'active', iconName: 'Headphones', prestations: [] }}
              addLabel="Nouveau service"
              fields={[
                { key: 'number', label: 'Numéro (01, 02…)' },
                { key: 'title', label: 'Titre', required: true },
                { key: 'slug', label: 'Slug URL (auto si vide)' },
                { key: 'iconName', label: 'Icône Lucide (Headphones, Database, Compass…)' },
                { key: 'positioning', label: 'Positionnement' },
                { key: 'displayOrder', label: 'Ordre d’affichage', type: 'number' },
                { key: 'summary', label: 'Résumé', type: 'textarea', rows: 3 },
                { key: 'prestations', label: 'Prestations (une par ligne)', type: 'list' },
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'active', label: 'Actif' },
                    { value: 'draft', label: 'Brouillon' },
                    { value: 'hidden', label: 'Masqué' },
                  ],
                },
              ]}
            />
          )}

          {activeTab === 'sectors' && (
            <EntityManager
              title="Secteurs d’activité"
              description="Table Supabase « sectors »."
              items={sectors}
              onSave={saveSector}
              onDelete={deleteSector}
              getTitle={(sec) => sec.name}
              getSubtitle={(sec) => sec.description}
              defaults={{ status: 'active', iconName: 'ShieldCheck', features: [] }}
              addLabel="Nouveau secteur"
              fields={[
                { key: 'name', label: 'Nom', required: true },
                { key: 'slug', label: 'Slug URL (auto si vide)' },
                { key: 'iconName', label: 'Icône Lucide' },
                { key: 'displayOrder', label: 'Ordre d’affichage', type: 'number' },
                { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
                { key: 'features', label: 'Points forts (un par ligne)', type: 'list' },
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'active', label: 'Actif' },
                    { value: 'draft', label: 'Brouillon' },
                    { value: 'hidden', label: 'Masqué' },
                  ],
                },
              ]}
            />
          )}

          {activeTab === 'testimonials' && (
            <EntityManager
              title="Témoignages clients"
              description="Table Supabase « testimonials »."
              items={testimonials}
              onSave={saveTestimonial}
              onDelete={deleteTestimonial}
              getTitle={(t) => t.author}
              getSubtitle={(t) => `« ${t.quote} »`}
              defaults={{ status: 'published' }}
              addLabel="Nouveau témoignage"
              fields={[
                { key: 'author', label: 'Auteur', required: true },
                { key: 'role', label: 'Fonction' },
                { key: 'company', label: 'Entreprise' },
                { key: 'rating', label: 'Note (1 à 5)', type: 'number' },
                { key: 'avatarUrl', label: 'Photo / avatar', type: 'image' },
                { key: 'displayOrder', label: 'Ordre d’affichage', type: 'number' },
                { key: 'quote', label: 'Citation', type: 'textarea', rows: 3, required: true },
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'published', label: 'Publié' },
                    { value: 'pending', label: 'En attente' },
                  ],
                },
              ]}
            />
          )}

          {activeTab === 'partners' && (
            <PartnerManager />
          )}

          {activeTab === 'projects' && (
            <EntityManager
              title="Réalisations / Projets"
              description="Table Supabase « projects » — affichés dans la section Réalisations."
              items={projects}
              onSave={saveProject}
              onDelete={deleteProject}
              getTitle={(pr) => pr.title}
              getSubtitle={(pr) => pr.summary}
              defaults={{ status: 'standard', deliverables: [], results: [] }}
              addLabel="Nouvelle réalisation"
              fields={[
                { key: 'title', label: 'Titre', required: true },
                { key: 'slug', label: 'Slug (optionnel)' },
                { key: 'category', label: 'Catégorie' },
                { key: 'client', label: 'Client' },
                { key: 'date', label: 'Date (texte libre)' },
                { key: 'displayOrder', label: 'Ordre d’affichage', type: 'number' },
                { key: 'imageUrl', label: 'Image', type: 'image' },
                { key: 'summary', label: 'Résumé', type: 'textarea', rows: 3 },
                { key: 'deliverables', label: 'Livrables (un par ligne)', type: 'list' },
                { key: 'results', label: 'Résultats (un par ligne)', type: 'list' },
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'featured', label: 'À la une' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'upcoming', label: 'À venir' },
                  ],
                },
              ]}
            />
          )}

          {activeTab === 'articles' && (
            <EntityManager
              title="Actualités / Articles"
              description="Table Supabase « articles » — page Actualités et section d’accueil."
              items={articles}
              onSave={saveArticle}
              onDelete={deleteArticle}
              getTitle={(a) => a.title}
              getSubtitle={(a) => a.summary}
              defaults={{ status: 'published', author: 'Excellence Services SARL', tags: [] }}
              addLabel="Nouvel article"
              fields={[
                { key: 'title', label: 'Titre', required: true },
                { key: 'slug', label: 'Slug URL (auto si vide)' },
                { key: 'category', label: 'Catégorie' },
                { key: 'date', label: 'Date (ex : 12 Mars 2026)' },
                { key: 'readTime', label: 'Temps de lecture (ex : 4 min)' },
                { key: 'author', label: 'Auteur' },
                { key: 'authorRole', label: 'Fonction de l’auteur' },
                { key: 'displayOrder', label: 'Ordre d’affichage', type: 'number' },
                { key: 'imageUrl', label: 'Image principale', type: 'image' },
                { key: 'summary', label: 'Résumé', type: 'textarea', rows: 3 },
                { key: 'content', label: 'Contenu complet', type: 'textarea', rows: 10 },
                { key: 'tags', label: 'Étiquettes (une par ligne)', type: 'list' },
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'published', label: 'Publié' },
                    { value: 'draft', label: 'Brouillon' },
                  ],
                },
              ]}
            />
          )}

          {activeTab === 'pages' && (
            <EntityManager
              title="Textes des pages"
              description="Table Supabase « pages » — titres, accroches et SEO des pages principales. Les pages système ne se suppriment pas."
              items={Object.values(pages)}
              onSave={savePage}
              getTitle={(pg) => pg.name || pg.title}
              getSubtitle={(pg) => pg.subtitle}
              addLabel="Nouvelle page"
              fields={[
                { key: 'name', label: 'Nom interne', required: true },
                { key: 'slug', label: 'Identifiant / slug', required: true },
                { key: 'title', label: 'Titre affiché', type: 'textarea', rows: 2 },
                { key: 'subtitle', label: 'Sous-titre', type: 'textarea', rows: 2 },
                { key: 'content', label: 'Contenu', type: 'textarea', rows: 5 },
                { key: 'ctaText', label: 'Texte du bouton' },
                { key: 'ctaLink', label: 'Lien du bouton' },
                { key: 'seoTitle', label: 'Titre SEO' },
                { key: 'seoDescription', label: 'Description SEO', type: 'textarea', rows: 2 },
              ]}
            />
          )}

          {activeTab === 'faq' && (
            <EntityManager
              title="Foire aux questions (FAQ)"
              description="Table Supabase « faqs »."
              items={faqs}
              onSave={saveFaq}
              onDelete={deleteFaq}
              getTitle={(f) => f.question}
              getSubtitle={(f) => f.answer}
              defaults={{ status: 'published', category: 'Général', displayOrder: faqs.length + 1 }}
              addLabel="Nouvelle question"
              fields={[
                { key: 'question', label: 'Question', required: true, type: 'textarea', rows: 2 },
                { key: 'answer', label: 'Réponse', type: 'textarea', rows: 4, required: true },
                { key: 'category', label: 'Catégorie' },
                { key: 'displayOrder', label: 'Ordre d’affichage', type: 'number' },
                {
                  key: 'status',
                  label: 'Statut',
                  type: 'select',
                  options: [
                    { value: 'published', label: 'Publiée' },
                    { value: 'draft', label: 'Brouillon' },
                  ],
                },
              ]}
            />
          )}

          {activeTab === 'media' && (
            <EntityManager
              title="Médiathèque"
              description="Table Supabase « media » + bucket Storage « site-media ». Remplacer l’URL d’un emplacement (ex : hero-main) change l’image sur le site."
              items={media}
              onSave={saveMedia}
              onDelete={deleteMedia}
              getTitle={(m) => m.name || m.id}
              getSubtitle={(m) => `${m.location || ''} · ${m.alt || ''}`}
              defaults={{ category: 'custom' }}
              addLabel="Nouveau média"
              fields={[
                { key: 'name', label: 'Nom', required: true },
                { key: 'location', label: 'Emplacement sur le site (ex : hero-main)' },
                { key: 'url', label: 'Image (URL ou téléversement Supabase)', type: 'image' },
                { key: 'mobileUrl', label: 'URL mobile (optionnel)' },
                { key: 'alt', label: 'Texte alternatif (accessibilité / SEO)' },
                { key: 'category', label: 'Catégorie' },
                { key: 'aspectRatio', label: 'Ratio (16:9, 4:3…)' },
                { key: 'priority', label: 'Prioritaire', type: 'checkbox' },
                { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
              ]}
            />
          )}


          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Devis & Demandes Reçues</h3>
                <p className="text-xs text-gray-400">Suivi des prospects et messages reçus</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                  Demandes de Devis ({quotes.length})
                </h4>
                {quotes.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucune demande de devis reçue pour le moment.</p>
                ) : (
                  quotes.map((q: any) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-[#0A2254]/40 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {q.fullName || `${q.firstName || ''} ${q.lastName || ''}`.trim() || 'Prospect'} ({q.company || 'Particulier'})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-mono text-[10px]">
                          {q.status}
                        </span>
                      </div>
                      <p className="text-gray-300">
                        <strong>Service :</strong> {q.service || q.serviceInterest} | <strong>Secteur :</strong> {q.sector || 'Général'}
                      </p>
                      <p className="text-gray-400">« {q.description || q.details} »</p>
                      <p className="text-[#D4AF37]">
                        {q.email} • {q.phone}
                        {q.createdAt ? ` • ${new Date(q.createdAt).toLocaleString('fr-FR')}` : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Statut :</label>
                        <select
                          value={q.status}
                          onChange={(e) => void updateQuoteStatus(q.id, e.target.value as any).catch((err) => window.alert(err?.message || 'Erreur'))}
                          className="px-2 py-1.5 rounded-lg bg-[#01184C] border border-white/15 text-[11px] text-white cursor-pointer"
                        >
                          <option value="new">Nouveau</option>
                          <option value="in_review">En étude</option>
                          <option value="contacted">Contacté</option>
                          <option value="completed">Terminé</option>
                          <option value="archived">Archivé</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Supprimer définitivement cette demande de devis ?')) {
                              void deleteQuote(q.id).catch((err) => window.alert(err?.message || 'Erreur'));
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 text-[11px] font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <h4 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] pt-4">
                  Messages de Contact ({contactMessages.length})
                </h4>
                {contactMessages.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun message de contact reçu pour le moment.</p>
                ) : (
                  contactMessages.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-[#0A2254]/40 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {m.fullName} ({m.email})
                        </span>
                        <span className="text-[10px] text-gray-400">{m.createdAt}</span>
                      </div>
                      <p className="text-[#D4AF37] font-semibold">{m.subject}</p>
                      <p className="text-gray-300">« {m.message} »</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Statut :</label>
                        <select
                          value={m.status}
                          onChange={(e) => void updateMessageStatus(m.id, e.target.value as any).catch((err) => window.alert(err?.message || 'Erreur'))}
                          className="px-2 py-1.5 rounded-lg bg-[#01184C] border border-white/15 text-[11px] text-white cursor-pointer"
                        >
                          <option value="unread">Non lu</option>
                          <option value="read">Lu</option>
                          <option value="replied">Répondu</option>
                          <option value="archived">Archivé</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Supprimer définitivement ce message ?')) {
                              void deleteContactMessage(m.id).catch((err) => window.alert(err?.message || 'Erreur'));
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 text-[11px] font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && <SettingsEditor />}

          {activeTab === 'guide' && (
            <div className="p-8 rounded-3xl bg-[#0A2254]/40 border border-white/10 space-y-6">
              <div>
                <h3 className="text-xl font-bold">Guide Opérationnel de l'Administrateur</h3>
                <p className="text-xs text-gray-400">Manuel d'utilisation de la console SARL</p>
              </div>
              <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
                <p>
                  Bienvenue dans l'espace d'administration officiel d'<strong>Excellence Services SARL</strong>. Cette console permet de piloter l'ensemble des contenus publics, les messages des prospects et les projets partenariaux.
                </p>
                <div className="p-4 rounded-xl bg-[#01184C] border border-[#D4AF37]/30 space-y-2">
                  <h4 className="font-bold text-[#D4AF37]">Points Clés :</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-200">
                    <li>Les 8 services reflètent le périmètre officiel déclaré au RCCM et dans les statuts de la SARL.</li>
                    <li>Toute demande soumise par le formulaire de devis ou de contact apparaît instantanément dans l'onglet Devis & Messages.</li>
                    <li>Les coordonnées (NIF, RCCM, Téléphones) sont synchronisées sur l'ensemble des pages publiques et du pied de page.</li>
                    <li>Toutes les données sont stockées dans Supabase (PostgreSQL) : chaque enregistrement met à jour le site en temps réel.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10 space-y-2">
                  <h4 className="font-bold text-[#D4AF37]">Supabase — mise en route (à faire une seule fois) :</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-gray-200">
                    <li>Supabase → SQL Editor : exécuter le script <code className="font-mono text-[#D4AF37]">supabase/migrations/20261029120000_initial_schema.sql</code> (et y indiquer votre email admin).</li>
                    <li>Supabase → Authentication → Users : créer le compte administrateur technique avec votre mot de passe (celui saisi ici, sans email à taper), puis désactiver les inscriptions publiques.</li>
                    <li>Hébergeur : renseigner <code className="font-mono text-[#D4AF37]">VITE_SUPABASE_URL</code> et <code className="font-mono text-[#D4AF37]">VITE_SUPABASE_ANON_KEY</code>, puis redéployer le site.</li>
                    <li>Connectez-vous ici : les contenus par défaut sont importés automatiquement dans Supabase. Détail complet dans le fichier SUPABASE_SETUP.md du projet.</li>
                  </ol>
                  <p className="text-amber-300">Sécurité : l’ancien mot de passe partagé a été supprimé. Seuls les comptes présents dans la table admin_users peuvent modifier le site ; les visiteurs ne voient jamais les devis et messages reçus.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
