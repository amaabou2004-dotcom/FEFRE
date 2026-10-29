import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase (navigateur).
 *
 * Le projet Supabase de production d'Excellence Services SARL est intégré
 * ci-dessous avec sa clé « publishable ». Cette clé est conçue pour être
 * publique dans le navigateur : les données restent protégées par les
 * politiques RLS et par la liste blanche `admin_users`. Grâce à ces valeurs
 * par défaut, aucun réglage d'hébergeur (Netlify, LWS, etc.) n'est requis.
 *
 * Les variables Vite restent acceptées uniquement comme surcharge complète
 * pour utiliser un autre projet Supabase :
 *
 *   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
 *   (ou VITE_SUPABASE_ANON_KEY avec l'ancienne clé anon)
 *
 * ⚠️ N'utilisez JAMAIS une clé `service_role` ou `sb_secret_...` côté
 * navigateur : elle contournerait toutes les protections RLS.
 */

const DEFAULT_SUPABASE_URL = 'https://jwmgrsoxzkgpviglrrwm.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_wMs4RT7D98TxA9NXNdRhyg_IfY7i1-m';

const envSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envSupabaseKey = (
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
)?.trim();

// Une surcharge n'est utilisée que si l'URL et la clé sont fournies ensemble.
// Cela évite de mélanger accidentellement l'URL d'un projet et la clé d'un autre.
const hasEnvConfig = Boolean(envSupabaseUrl && envSupabaseKey);
const supabaseUrl = hasEnvConfig ? envSupabaseUrl : DEFAULT_SUPABASE_URL;
const supabaseKey = hasEnvConfig ? envSupabaseKey : DEFAULT_SUPABASE_PUBLISHABLE_KEY;

/**
 * Compte administrateur Supabase Auth associé à la connexion "mot de passe
 * uniquement" de l'espace admin. Cet email n'est JAMAIS demandé à l'écran :
 * il sert uniquement, en coulisses, à ouvrir une session Supabase sécurisée.
 * Le mot de passe, lui, n'existe que dans Supabase (jamais dans le code).
 * Modifiable via VITE_ADMIN_EMAIL si le compte créé dans Supabase diffère.
 */
export const ADMIN_LOGIN_EMAIL = (
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() ||
  'admin@excellence-services-sarl.com'
);

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'La connexion à Supabase est momentanément indisponible. Vérifiez votre connexion, puis réessayez.';

function createSafeClient(url?: string, key?: string): SupabaseClient | null {
  if (!url || !key) return null;
  try {
    // Une configuration optionnelle invalide ne doit jamais planter le site.
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Configuration invalide :', err);
    return null;
  }
}

// Si une surcharge d'environnement est invalide, revenir au projet officiel.
export const supabase: SupabaseClient | null =
  createSafeClient(supabaseUrl, supabaseKey) ??
  (hasEnvConfig ? createSafeClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_PUBLISHABLE_KEY) : null);
export const isSupabaseConfigured = supabase !== null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(`[Supabase] ${SUPABASE_NOT_CONFIGURED_MESSAGE}`);
}

/** Noms des tables PostgreSQL (miroir exact de supabase/migrations/…). */
export const SUPABASE_TABLES = {
  SETTINGS: 'site_settings',
  SERVICES: 'services',
  SECTORS: 'sectors',
  TESTIMONIALS: 'testimonials',
  FAQS: 'faqs',
  PAGES: 'pages',
  MEDIA: 'media',
  ARTICLES: 'articles',
  QUOTES: 'quotes',
  CONTACT_MESSAGES: 'contact_messages',
  ACTIVITY_LOGS: 'activity_logs',
  PARTNERS: 'partners',
  PROJECTS: 'projects',
  PARTNER_PROJECTS: 'partner_projects',
  PARTNER_DOCUMENTS: 'partner_documents',
  ADMIN_USERS: 'admin_users',
} as const;

export const MEDIA_BUCKET = 'site-media';

/**
 * Traduit une erreur Supabase/PostgreSQL en message français compréhensible
 * pour l'administrateur.
 */
export function describeSupabaseError(err: unknown): string {
  if (!isSupabaseConfigured) return SUPABASE_NOT_CONFIGURED_MESSAGE;
  const e = err as { code?: string; message?: string } | null;
  const msg = e?.message || String(err);
  if (e?.code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return "Permission refusée par Supabase (RLS) : vérifiez que vous êtes connecté avec un compte administrateur présent dans la table « admin_users » (voir SUPABASE_SETUP.md, étape 4).";
  }
  if (e?.code === '42P01' || /relation .* does not exist|Could not find the table/i.test(msg)) {
    return "Les tables Supabase sont introuvables : exécutez d'abord le script SQL fourni (supabase/migrations/) dans le SQL Editor de votre projet Supabase.";
  }
  if (/Failed to fetch|NetworkError|fetch failed/i.test(msg)) {
    return 'Impossible de contacter Supabase : vérifiez votre connexion Internet, puis réessayez.';
  }
  if (/Invalid API key|JWT/i.test(msg)) {
    return 'La clé publique Supabase du site est invalide ou révoquée. Contactez l’administrateur technique.';
  }
  return msg;
}

/**
 * Téléverse un fichier dans le bucket public `site-media` et renvoie son URL.
 * Réservé aux administrateurs (politiques Storage dans le schéma SQL).
 */
export async function uploadSiteMedia(file: File): Promise<string> {
  if (!supabase) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '') || 'webp';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(describeSupabaseError(error));
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
