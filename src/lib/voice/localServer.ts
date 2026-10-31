import type { LocalServerStatus } from './types';

/**
 * ISA — Découverte du serveur IA local (Niamey)
 * =============================================
 * L'application web cherche automatiquement un serveur `voice-ai` joignable :
 *
 *   1. `VITE_ISA_LOCAL_SERVER` (défini au build) ou `?isaServer=…` dans l'URL ;
 *   2. une valeur mémorisée dans `localStorage` (réglage manuel) ;
 *   3. `http://localhost:8787` et `http://127.0.0.1:8787` (poste local) ;
 *   4. l'adresse LAN saisie par l'utilisateur (ex. `http://192.168.1.20:8787`)
 *      pour équiper un kiosque ou un bureau entier depuis un seul serveur.
 *
 * Chaque adresse est sondée via `/health` avec un délai court. Dès qu'un
 * serveur répond, ISA passe en mode « 100 % local » : reconnaissance vocale
 * Whisper, voix zarma/haoussa MMS-TTS et modèle de langage local — sans
 * Internet.
 */

const STORAGE_KEY = 'isa-local-server';
const DEFAULT_PORT = 8787;
const PROBE_TIMEOUT_MS = 2500;

export function readEnvLocalServer(): string | undefined {
  try {
    const env = (import.meta as any)?.env;
    const value = env?.VITE_ISA_LOCAL_SERVER || env?.VITE_ISA_LOCAL_URL;
    if (typeof value === 'string' && value.trim()) return value.trim().replace(/\/$/, '');
  } catch {
    /* noop */
  }
  return undefined;
}

export function readQueryLocalServer(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('isaServer') || params.get('localServer');
    if (value) return value.trim().replace(/\/$/, '');
    // `?isaLocal=1` → localhost par défaut (pratique en démo).
    if (params.get('isaLocal') === '1') return `http://localhost:${DEFAULT_PORT}`;
  } catch {
    /* noop */
  }
  return undefined;
}

export function readStoredLocalServer(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? value.replace(/\/$/, '') : undefined;
  } catch {
    return undefined;
  }
}

export function saveLocalServer(baseUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!baseUrl) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, baseUrl.replace(/\/$/, ''));
  } catch {
    /* stockage indisponible (navigation privée) : sans gravité */
  }
}

/** Liste des adresses candidates, dans l'ordre de priorité. */
export function candidateLocalServers(): string[] {
  const candidates = new Set<string>();
  const push = (value?: string | null) => {
    if (!value) return;
    const normalized = value.trim().replace(/\/+$/, '');
    if (!normalized) return;
    // Complète une adresse saisie sans protocole ni port.
    let url = normalized;
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
    if (!/:\d+$/.test(url.replace(/^https?:\/\//i, ''))) url = `${url}:${DEFAULT_PORT}`;
    candidates.add(url.replace(/\/+$/, ''));
  };

  push(readEnvLocalServer());
  push(readQueryLocalServer());
  push(readStoredLocalServer());
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
    push(`http://localhost:${DEFAULT_PORT}`);
    push(`http://127.0.0.1:${DEFAULT_PORT}`);
  } else {
    // En HTTPS, le navigateur bloque les requêtes vers http:// (mixed content) :
    // on propose quand même localhost, qui reste autorisé par la plupart des
    // navigateurs, et l'utilisateur peut forcer une adresse HTTPS.
    push(`http://localhost:${DEFAULT_PORT}`);
  }
  return Array.from(candidates);
}

const EMPTY_STATUS: LocalServerStatus = {
  reachable: false,
  stt: false,
  tts: false,
  llm: false,
};

/** Sonde un serveur précis et renvoie ses capacités. */
export async function probeLocalServer(baseUrl: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<LocalServerStatus> {
  if (typeof window === 'undefined') return EMPTY_STATUS;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return EMPTY_STATUS;
    const payload = (await response.json()) as Record<string, any>;
    const capabilities = payload?.capabilities || payload || {};
    return {
      reachable: true,
      baseUrl,
      latencyMs: Date.now() - startedAt,
      stt: Boolean(capabilities.stt ?? payload?.stt ?? true),
      tts: Boolean(capabilities.tts ?? payload?.tts ?? true),
      llm: Boolean(capabilities.llm ?? payload?.llm ?? true),
      models: payload?.models,
      checkedAt: Date.now(),
    };
  } catch {
    return EMPTY_STATUS;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Sonde toutes les adresses candidates et garde la première qui répond. */
export async function discoverLocalServer(): Promise<LocalServerStatus> {
  const candidates = candidateLocalServers();
  if (!candidates.length) return EMPTY_STATUS;

  // Sondage en parallèle : le premier serveur trouvé gagne, mais on laisse
  // 2 s de battement pour ne pas afficher « hors-ligne » trop vite.
  const results = await Promise.all(candidates.map((url) => probeLocalServer(url)));
  const found = results.find((result) => result.reachable);
  if (found?.baseUrl) saveLocalServer(found.baseUrl);
  return found || { ...EMPTY_STATUS, checkedAt: Date.now() };
}

/** Le serveur local est-il réellement préférable au cloud pour cette tâche ? */
export function shouldUseLocalServer(status: LocalServerStatus | null, feature: 'stt' | 'tts' | 'llm'): boolean {
  if (!status?.reachable) return false;
  return Boolean(status[feature]);
}
