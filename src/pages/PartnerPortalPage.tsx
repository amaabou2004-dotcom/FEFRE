import React, { useState } from 'react';
import {
  Handshake,
  Building2,
  LogOut,
  FolderKanban,
  CheckCircle2,
  FileText,
  Download,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { useSiteData } from '../lib/DataContext';

export const PartnerPortalPage: React.FC = () => {
  const {
    partnerUser,
    partnerProjects,
    partnerDocuments,
    loginPartner,
    logoutPartner,
    settings,
  } = useSiteData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginPartner(email);
      if (!res.success) {
        setError(res.error || 'Identifiants invalides.');
      }
    } catch {
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300 pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/40 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
            <Handshake className="w-4 h-4 text-[#D4AF37]" />
            <span>Portail Collaboratif Sécurisé</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0E1D38] dark:text-white">
            Espace Partenaires & Projets
          </h1>
          <p className="text-sm sm:text-base text-[#536582] dark:text-slate-300">
            Plateforme dédiée au suivi des chantiers conjoints, à la mise à disposition des livrables opérationnels et aux conventions partenariales.
          </p>
        </div>

        {partnerUser ? (
          <div className="space-y-8">
            {/* Header / Current User */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0A2254]/50 border border-[#DDE4EE] dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#01184C] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/40 shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#0E1D38] dark:text-white">
                      {partnerUser.company}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                      Accréditation Validée
                    </span>
                  </div>
                  <p className="text-xs text-[#536582] dark:text-slate-400">
                    Connecté en tant que : <strong>{partnerUser.email}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={logoutPartner}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#01184C] hover:bg-slate-200 dark:hover:bg-[#0A2254] text-xs font-semibold text-slate-700 dark:text-slate-200 border border-[#DDE4EE] dark:border-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Projects List */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="text-base font-bold text-[#0E1D38] dark:text-white">
                      Chantiers et Déploiements Opérationnels
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {partnerProjects.length} actif(s)
                  </span>
                </div>

                <div className="space-y-4">
                  {partnerProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-6 rounded-2xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                            Projet Partenaire
                          </span>
                          <h4 className="text-base font-bold text-[#0E1D38] dark:text-white mt-0.5">
                            {p.title}
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                          En cours ({p.progress}%)
                        </span>
                      </div>

                      <p className="text-xs text-[#536582] dark:text-slate-300 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Avancement opérationnel</span>
                          <span className="font-mono font-bold text-[#D4AF37]">{p.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#01184C] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D4AF37]"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                          Livrables & jalons validés :
                        </p>
                        <div className="space-y-1.5">
                          {p.keyDeliverables.map((del, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{del}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents & Agreements */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="text-base font-bold text-[#0E1D38] dark:text-white">
                      Documents & Accords Cadres
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {partnerDocuments.length} fichier(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {partnerDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-white dark:bg-[#0A2254]/40 border border-[#DDE4EE] dark:border-white/10 shadow-sm flex items-center justify-between gap-3 hover:border-[#D4AF37] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#EEF2F8] dark:bg-[#01184C] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0E1D38] dark:text-white truncate">
                            {doc.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="uppercase">{doc.type}</span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            <span>•</span>
                            <span>{doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.url || (doc as any).downloadUrl || '#'}
                        download
                        className="p-2 rounded-lg bg-[#F8FAFD] dark:bg-[#01184C] hover:bg-[#D4AF37] text-[#01184C] dark:text-[#D4AF37] hover:text-[#01184C] border border-[#DDE4EE] dark:border-white/10 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>

                {/* Direct Contact Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#01184C] to-[#0A2254] text-white border border-[#D4AF37]/30 shadow-md space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ligne Dédiée Direction Partenariats</span>
                  </div>
                  <p className="text-xs text-slate-200">
                    Pour toute requête urgente, convention spécifique ou demande d'audit conjoint :
                  </p>
                  <p className="text-xs font-mono font-bold text-white">{settings.email}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div className="max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0A2254]/60 border border-[#DDE4EE] dark:border-white/10 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2F8] dark:bg-[#01184C] border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#0E1D38] dark:text-white">
                Authentification Partenaire
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accès réservé aux partenaires accrédités et clients institutionnels d’Excellence Services SARL.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Adresse e-mail professionnelle
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partenaire@institution.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Clé d’accès sécurisée / Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#01184C] hover:bg-[#0A2254] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border border-[#D4AF37]/30"
                >
                  <span>{loading ? 'Vérification...' : 'Accéder à mon espace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400">
                  Besoin d'un accès ? Contactez la direction au{' '}
                  <span className="text-[#D4AF37] font-semibold">{settings.email}</span>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
