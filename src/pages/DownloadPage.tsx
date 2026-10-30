import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Server,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  ArrowRight,
  Database
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const DownloadPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleBlobDownload = async (url: string, filename: string, key: string) => {
    try {
      setDownloading(key);
      setDownloadError(null);
      setDownloadSuccess(null);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      // Sur un hébergement SPA, une archive absente peut être remplacée par
      // index.html (HTTP 200). On vérifie donc la signature ZIP « PK\x03\x04 »
      // avant de proposer un fichier qui serait en réalité du HTML.
      const buffer = await response.arrayBuffer();
      const header = new Uint8Array(buffer.slice(0, 4));
      const isZip = header.length === 4 && header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
      if (!isZip) {
        throw new Error('Archive introuvable sur cet hébergement');
      }

      const blob = new Blob([buffer], { type: 'application/zip' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(key);
    } catch (err: any) {
      console.error('Erreur téléchargement blob:', err);
      setDownloadSuccess(null);
      setDownloadError('Archive introuvable sur cet hébergement. Utilisez le ZIP fourni avec le guide LWS, ou téléchargez-le depuis le site principal à jour.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#030F26] text-[#0E1D38] dark:text-white transition-colors duration-300 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-10">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Téléchargement de votre site (cPanel LWS)' }
          ]}
        />

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37]">
            <FolderArchive className="w-4 h-4 text-[#D4AF37]" />
            <span>Fichiers de Production & Déploiement cPanel</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#01184C] dark:text-white tracking-tight">
            Téléchargement du site pour <span className="text-[#D4AF37]">cPanel LWS</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Téléchargez les archives de production pour héberger Excellence Services SARL chez LWS. <strong>Supabase est déjà configuré</strong> : aucune base MySQL, aucun import SQL et aucune variable Supabase ne sont à saisir dans cPanel.
          </p>
        </div>

        {/* Important Warning Banner: "Pourquoi le fichier ne fonctionne pas par double-clic" */}
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-100 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-300">
                Pourquoi le fichier ne fonctionne pas en double-cliquant dessus sur votre ordinateur ?
              </h3>
              <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                Ce site est une application web moderne (SPA). Les navigateurs récents bloquent l’exécution des modules JavaScript lorsque vous double-cliquez directement sur <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">index.html</code> en local (protocole <code>file://</code>).
                <br />
                <strong>Pour qu’il fonctionne, le fichier ZIP doit impérativement être téléversé et extrait sur votre serveur d’hébergement cPanel LWS (dans le dossier <code className="text-amber-600 dark:text-amber-400 font-mono font-bold">public_html</code>).</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-sm sm:text-base text-emerald-900 dark:text-emerald-200">Base Supabase déjà reliée</h2>
            <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed mt-1">
              Après extraction sur LWS, le site et l’admin <code className="font-mono">/admin</code> utilisent immédiatement la base Supabase existante. Ne créez pas de base MySQL dans cPanel et n’importez aucun fichier SQL sur LWS.
            </p>
          </div>
        </div>

        {downloadError && (
          <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-start gap-3" role="alert">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-200 leading-relaxed">{downloadError}</p>
          </div>
        )}

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Standard public_html */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A2254]/60 border-2 border-[#D4AF37] shadow-xl relative flex flex-col justify-between space-y-6">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#D4AF37] text-[#01184C] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
              Recommandé (95% des cas)
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#01184C] dark:bg-[#01184C] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <FileArchive className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#01184C] dark:text-white">
                  Archive Standard <code className="text-sm font-mono text-[#D4AF37]">public_html</code>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fichier : <span className="font-mono text-slate-700 dark:text-slate-200">excellence-services-cpanel-public_html.zip</span> (~2,6 Mo)
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Contient le site complet prêt pour le dossier <strong>public_html</strong> de cPanel LWS : page d’accueil, pages services, secteurs, devis, images WebP optimisées et fichier <strong className="text-[#D4AF37]">.htaccess</strong> avec les redirections et la compression Apache.
              </p>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border-t border-slate-200 dark:border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Fichier <code className="font-mono">.htaccess</code> compatible Apache 2.4 / LiteSpeed LWS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Supabase déjà configuré : aucun MySQL ni import SQL sur LWS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>IA locale vérifiée incluse pour l’hébergement statique</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleBlobDownload(
                  '/downloads/excellence-services-cpanel-public_html.zip',
                  'excellence-services-cpanel-public_html.zip',
                  'public_html'
                )}
                disabled={downloading === 'public_html'}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-black text-sm tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloading === 'public_html' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Préparation du téléchargement...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger l’archive public_html (ZIP)</span>
                  </>
                )}
              </button>

              {downloadSuccess === 'public_html' && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center">
                  ✅ Téléchargement lancé avec succès dans votre navigateur !
                </p>
              )}

              <div className="text-center pt-1">
                <a
                  href="/downloads/excellence-services-cpanel-public_html.zip"
                  download="excellence-services-cpanel-public_html.zip"
                  className="text-[11px] text-slate-500 hover:text-[#D4AF37] underline"
                >
                  Lien de secours direct (si le bouton ne réagit pas)
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Node.js App */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A2254]/40 border border-slate-200 dark:border-white/10 shadow-lg relative flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#01184C] border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white">
                <Server className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#01184C] dark:text-white">
                  Archive Node.js <code className="text-sm font-mono text-slate-500">cPanel App</code>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fichier : <span className="font-mono text-slate-700 dark:text-slate-200">excellence-services-cpanel-nodejs.zip</span> (~2,7 Mo)
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                À utiliser <strong>uniquement</strong> si vous activez le module cPanel <strong>« Setup Node.js App »</strong> chez LWS. Supabase reste déjà configuré côté site ; seule une clé Gemini optionnelle peut être ajoutée au serveur pour enrichir l’IA.
              </p>

              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border-t border-slate-200 dark:border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Point d’entrée <code className="font-mono">app.js</code> préconfiguré pour Phusion Passenger</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Fichier <code className="font-mono">package.json</code> de production inclus</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleBlobDownload(
                  '/downloads/excellence-services-cpanel-nodejs.zip',
                  'excellence-services-cpanel-nodejs.zip',
                  'nodejs'
                )}
                disabled={downloading === 'nodejs'}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#01184C] dark:text-white font-bold text-sm tracking-wide transition-all border border-slate-300 dark:border-white/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloading === 'nodejs' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Préparation du téléchargement...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger l’archive Node.js (ZIP)</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <a
                  href="/downloads/excellence-services-cpanel-nodejs.zip"
                  download="excellence-services-cpanel-nodejs.zip"
                  className="text-[11px] text-slate-500 hover:text-[#D4AF37] underline"
                >
                  Lien de secours direct Node.js
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0A2254]/50 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#01184C] dark:text-white">
              Instructions détaillées pour cPanel LWS (Comment l’installer en 3 étapes)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#01184C]/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#01184C] font-black flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-bold text-[#01184C] dark:text-white text-sm">Ouvrir public_html</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Connectez-vous à votre cPanel LWS, ouvrez le <strong>Gestionnaire de fichiers</strong> et entrez dans le dossier <strong>public_html</strong>. Supprimez les éventuels anciens fichiers par défaut de LWS.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#01184C]/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#01184C] font-black flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-bold text-[#01184C] dark:text-white text-sm">Charger et Extraire</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Cliquez sur <strong>Charger</strong> et téléversez <code className="font-mono">excellence-services-cpanel-public_html.zip</code>. Ensuite, faites clic-droit &gt; <strong>Extraire</strong> dans <code className="font-mono font-bold">/public_html</code> (veillez à ce que les fichiers ne soient pas enfermés dans un sous-dossier).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#01184C]/60 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#01184C] font-black flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-bold text-[#01184C] dark:text-white text-sm">Vérifier Supabase et l’admin</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Activez le HTTPS, ouvrez votre domaine puis <code className="font-mono text-[#D4AF37]">/admin</code> avec le mot de passe administrateur actuel. Le diagnostic <code className="font-mono">test-lws.php</code> est optionnel : supprimez-le immédiatement après usage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
