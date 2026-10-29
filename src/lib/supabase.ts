import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase (navigateur).
 *
 * Configuration via variables d'environnement Vite (fichier `.env.local`
 * en développement, ou variables Netlify / hébergeur en production) :
 *
 *   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   (clé "anon public" / "publishable")
 *
 * ⚠️ N'utilisez JAMAIS la clé `service_role` côté navigateur : elle
 * contourne toutes les protections (RLS). La clé anon est publique et
 * sûre tant que les politiques RLS du schéma SQL sont appliquées.
 *
 * Si les variables sont absentes, `supabase` vaut `null` et le site
 * fonctionne en mode "contenus par défaut" (aucun écran blanc).
 */

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase n'est pas encore configuré : ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir SUPABASE_SETUP.md), puis redéployez le site.";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

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
    return "Impossible de contacter Supabase : vérifiez votre connexion Internet et la valeur de VITE_SUPABASE_URL.";
  }
  if (/Invalid API key|JWT/i.test(msg)) {
    return "Clé Supabase invalide : vérifiez VITE_SUPABASE_ANON_KEY (clé « anon public », pas la clé service_role).";
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
