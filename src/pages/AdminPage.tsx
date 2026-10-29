import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Cloud,
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
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { PartnerManager } from '../components/admin/PartnerManager';

export const AdminPage: React.FC = () => {
  const { isAdmin, loginWithPassword, logout, currentUser } = useAuth();
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
    saveService,
    deleteService,
    saveSector,
    deleteSector,
    saveTestimonial,
    deleteTestimonial,
    savePartner,
    deletePartner,
    updateQuoteStatus,
    updateMessageStatus,
    updateSettings,
    saveMedia,
    deleteMedia,
    saveFaq,
    deleteFaq,
    resetToDefaults,
  } = useSiteData();

  // Login form state (password-only)
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
      setLoginError('Veuillez saisir votre mot de passe administrateur.');
      return;
    }
    setIsLoggingIn(true);
    const res = await loginWithPassword(password);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Mot de passe incorrect. Veuillez vérifier votre saisie.');
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
                <Cloud className="w-3 h-3 animate-pulse text-[#D4AF37]" />
                <span>ACCÈS SÉCURISÉ CLOUD</span>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-gray-300 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
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
                    'Se connecter à la console'
                  )}
                </button>
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
              onClick={resetToDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A2254] border border-slate-300 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-gray-300 hover:text-[#01184C] dark:hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer shadow-2xs"
              title="Réinitialiser les données aux valeurs par défaut officielles"
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Catalogue des Services</h3>
                  <p className="text-xs text-gray-400">Modifier ou ajuster les offres de la SARL</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-5 rounded-2xl bg-[#0A2254]/40 border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#D4AF37] font-bold">
                          SERVICE {srv.number}
                        </span>
                        <h4 className="text-base font-bold text-white">{srv.title}</h4>
                        <p className="text-xs text-[#D4AF37]">{srv.positioning}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {srv.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">{srv.summary}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {srv.prestations.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#01184C] border border-white/10 text-[10px] text-gray-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'partners' && (
            <PartnerManager />
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
                      </p>
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
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 rounded-3xl bg-[#0A2254]/40 border border-white/10 space-y-6">
              <div>
                <h3 className="text-lg font-bold">Coordonnées et Mentions Légales</h3>
                <p className="text-xs text-gray-400">Informations légales et contacts de la SARL</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">Raison Sociale</span>
                  <span className="font-bold text-white">{settings.name}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">Localisation</span>
                  <span className="font-bold text-white">{settings.location}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">NIF</span>
                  <span className="font-mono font-bold text-white">{settings.nif}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">RCCM</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{settings.rccm}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">Courriel</span>
                  <span className="font-bold text-white">{settings.email}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">Ligne WhatsApp</span>
                  <span className="font-bold text-[#D4AF37]">{settings.whatsapp}</span>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">Facebook</span>
                  <a
                    href={settings.facebook || 'https://www.facebook.com/share/18nx1djJnt/?mibextid=wwXIfr'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#1877F2] hover:underline truncate block"
                  >
                    {settings.facebook || 'https://www.facebook.com/share/18nx1djJnt/?mibextid=wwXIfr'}
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-[#01184C] border border-white/10">
                  <span className="text-gray-400 block mb-1">TikTok</span>
                  <a
                    href={settings.tiktok || 'https://www.tiktok.com/@excellenceservices?_r=1&_t=ZS-99nADDdMPcS'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#FE2C55] hover:underline truncate block"
                  >
                    {settings.tiktok || 'https://www.tiktok.com/@excellenceservices?_r=1&_t=ZS-99nADDdMPcS'}
                  </a>
                </div>
              </div>
            </div>
          )}

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
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
