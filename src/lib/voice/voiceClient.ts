import { runLocalBrain, buildVoiceSystemPrompt, buildVoiceHistory, buildUnknownTurn } from './brain';
import { detectVoiceLanguage } from './intents';
import { discoverLocalServer, shouldUseLocalServer } from './localServer';
import { canSpeakNatively, playAudioBase64, speakWithBrowser, stopAllSpeech } from './speechSynthesis';
import { LANGUAGE_META } from './languages';
import type {
  AssistantContext,
  AssistantTurn,
  LocalServerStatus,
  SynthesisResult,
  TranscriptionResult,
  VoiceLanguage,
} from './types';

/**
 * ISA — Client vocal (orchestrateur)
 * ==================================
 * Décide, à chaque étape, quel moteur utiliser :
 *
 *   Reconnaissance  : serveur local (Whisper, zarma/haoussa, hors-ligne)
 *                     → sinon `/api/voice/stt` (Gemini audio, cloud).
 *   Cerveau         : règles locales instantanées
 *                     → serveur local (Ollama/llama.cpp)
 *                     → `/api/voice/think` (Gemini).
 *   Voix            : navigateur (fr/en) → serveur local (Piper/MMS) → cloud.
 *   Cartes & GPS    : `/api/geo/*` (Nominatim, OSRM, Overpass, Open-Meteo)
 *                     → base « Niger » hors-ligne.
 *
 * Toutes les requêtes utilisent des chemins RELATIFS : l'aperçu web, Netlify,
 * cPanel et le serveur local fonctionnent donc sans changer une URL.
 */

const REQUEST_TIMEOUT_MS = 20000;

let cachedServerStatus: LocalServerStatus | null = null;

export async function refreshLocalServer(): Promise<LocalServerStatus> {
  cachedServerStatus = await discoverLocalServer();
  return cachedServerStatus;
}

export function getLocalServerStatus(): LocalServerStatus | null {
  return cachedServerStatus;
}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function base64FromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(blob);
  });
}

/* ------------------------------------------------------------------ */
/* 1. Reconnaissance vocale (audio → texte)                            */
/* ------------------------------------------------------------------ */

export async function transcribeAudio(params: {
  blob: Blob;
  language: VoiceLanguage;
  mimeType?: string;
}): Promise<TranscriptionResult> {
  const startedAt = Date.now();
  const status = cachedServerStatus || (await refreshLocalServer());

  // Priorité au serveur local : zarma/haoussa + hors-ligne + aucune donnée
  // audio ne quitte le Niger.
  if (shouldUseLocalServer(status, 'stt') && status?.baseUrl) {
    try {
      const form = new FormData();
      form.append('audio', params.blob, `isa-audio.${params.blob.type.includes('wav') ? 'wav' : 'webm'}`);
      form.append('language', params.language);
      const payload = await fetchJson<any>(`${status.baseUrl}/stt`, { method: 'POST', body: form }, 25000);
      return {
        text: String(payload?.text || '').trim(),
        language: (payload?.language as VoiceLanguage) || params.language,
        detectedLanguages: payload?.languages,
        confidence: typeof payload?.confidence === 'number' ? payload.confidence : undefined,
        source: 'local-server',
        engine: payload?.engine || 'faster-whisper',
        durationMs: Date.now() - startedAt,
      };
    } catch {
      // Le serveur local a échoué : on tente le cloud avant d'abandonner.
    }
  }

  // Repli cloud via notre propre API (la clé Gemini reste côté serveur).
  // L'audio part en JSON base64 : aucun parseur multipart nécessaire, et la
  // requête passe aussi bien sur Express que sur Netlify Functions.
  const audioBase64 = await base64FromBlob(params.blob);
  const payload = await fetchJson<any>(
    '/api/voice/stt',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType: params.mimeType || params.blob.type || 'audio/wav', language: params.language }),
    },
    25000,
  );
  if (!payload || typeof payload.text !== 'string') throw new Error('STT_FAILED');
  return {
    text: payload.text.trim(),
    language: (payload.language as VoiceLanguage) || params.language,
    confidence: payload.confidence,
    source: 'cloud',
    engine: payload.engine || 'gemini-audio',
    durationMs: Date.now() - startedAt,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Cerveau (texte → réponse + actions)                              */
/* ------------------------------------------------------------------ */

export async function think(utterance: string, context: AssistantContext): Promise<AssistantTurn> {
  const language = detectVoiceLanguage(utterance, context.language);

  // Étape 1 — règles locales : immédiates, hors-ligne, gratuites.
  const local = runLocalBrain(utterance, { ...context, language });
  if (local) return local;

  // Étape 2 — modèle local (Ollama / llama.cpp) sur le serveur de Niamey.
  const status = cachedServerStatus || (await refreshLocalServer());
  if (shouldUseLocalServer(status, 'llm') && status?.baseUrl) {
    try {
      const payload = await fetchJson<any>(
        `${status.baseUrl}/think`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: utterance,
            language,
            context,
            systemPrompt: buildVoiceSystemPrompt({ ...context, language }, language),
            history: buildVoiceHistory({ ...context, language }),
          }),
        },
        30000,
      );
      if (payload?.reply) {
        return {
          reply: String(payload.reply),
          speak: String(payload.speak || payload.reply),
          language: (payload.language as VoiceLanguage) || language,
          intent: payload.intent || 'unknown',
          slots: payload.slots || {},
          actions: Array.isArray(payload.actions) ? payload.actions : [],
          cards: Array.isArray(payload.cards) ? payload.cards : [],
          suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
          source: 'local-llm',
          offline: true,
          modelUsed: payload.modelUsed,
        };
      }
    } catch {
      // On bascule sur le cloud.
    }
  }

  // Étape 3 — Gemini (cloud), via notre API.
  try {
    const payload = await fetchJson<any>(
      '/api/voice/think',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: utterance,
          language,
          context,
          systemPrompt: buildVoiceSystemPrompt({ ...context, language }, language),
          history: buildVoiceHistory({ ...context, language }),
        }),
      },
      30000,
    );
    if (payload?.reply) {
      return {
        reply: String(payload.reply),
        speak: String(payload.speak || payload.reply),
        language: (payload.language as VoiceLanguage) || language,
        intent: payload.intent || 'unknown',
        slots: payload.slots || {},
        actions: Array.isArray(payload.actions) ? payload.actions : [],
        cards: Array.isArray(payload.cards) ? payload.cards : [],
        suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
        source: payload.source === 'fallback' ? 'fallback' : 'cloud-llm',
        offline: false,
        modelUsed: payload.modelUsed,
      };
    }
  } catch {
    /* réseau indisponible */
  }

  // Étape 4 — dernier recours 100 % local : on explique comment reformuler.
  return buildUnknownTurn(utterance, language);
}

/* ------------------------------------------------------------------ */
/* 3. Voix (texte → audio)                                             */
/* ------------------------------------------------------------------ */

export async function speak(params: {
  text: string;
  language: VoiceLanguage;
  rate?: number;
  preferLocal?: boolean;
}): Promise<SynthesisResult> {
  const text = String(params.text || '').trim();
  if (!text) return { spokenByBrowser: false, engine: 'none' };

  const status = cachedServerStatus || (await refreshLocalServer());
  const nativeOk = canSpeakNatively(params.language);

  // Zarma / haoussa : le navigateur n'a aucune voix → serveur local obligatoire
  // (MMS-TTS). Si le serveur est absent, on lit en français et on l'indique.
  if (!nativeOk || params.preferLocal) {
    if (shouldUseLocalServer(status, 'tts') && status?.baseUrl) {
      try {
        const payload = await fetchJson<any>(
          `${status.baseUrl}/tts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: params.language, model: LANGUAGE_META[params.language]?.serverTtsModel }),
          },
          20000,
        );
        if (payload?.audioBase64) {
          await playAudioBase64(payload.audioBase64, payload.mimeType || 'audio/wav');
          return {
            audioBase64: payload.audioBase64,
            mimeType: payload.mimeType,
            spokenByBrowser: false,
            engine: payload.engine || 'piper',
            voice: payload.voice,
          };
        }
      } catch {
        /* on retombe sur le cloud ou le navigateur */
      }
    }

    try {
      const url = `/api/voice/tts?lang=${encodeURIComponent(params.language)}&text=${encodeURIComponent(text.slice(0, 900))}`;
      const payload = await fetchJson<any>(url, { method: 'GET' }, 20000);
      if (payload?.audioBase64) {
        await playAudioBase64(payload.audioBase64, payload.mimeType || 'audio/wav');
        return { audioBase64: payload.audioBase64, mimeType: payload.mimeType, spokenByBrowser: false, engine: payload.engine || 'gemini-tts', voice: payload.voice };
      }
    } catch {
      /* réseau indisponible : dernier repli navigateur */
    }
  }

  const result = await speakWithBrowser(text, { language: params.language, rate: params.rate ?? 1 });
  return result;
}

export function stopSpeaking(): void {
  stopAllSpeech();
}

/* ------------------------------------------------------------------ */
/* 4. Cartes, lieux, itinéraires, météo (API gratuites, sans clé)      */
/* ------------------------------------------------------------------ */

export interface GeoPlace {
  name: string;
  displayName?: string;
  lat: number;
  lon: number;
  type?: string;
  city?: string;
  source: 'osm' | 'offline';
}

export async function searchPlaces(query: string, options?: { near?: { lat: number; lon: number }; limit?: number }): Promise<GeoPlace[]> {
  try {
    const params = new URLSearchParams({ q: query, limit: String(options?.limit || 5) });
    if (options?.near) {
      params.set('lat', String(options.near.lat));
      params.set('lon', String(options.near.lon));
    }
    const payload = await fetchJson<any>(`/api/geo/search?${params.toString()}`);
    if (Array.isArray(payload?.results)) return payload.results as GeoPlace[];
  } catch {
    /* hors-ligne : la base Niger prend le relais */
  }
  return [];
}

export async function searchNearby(params: {
  category: string;
  lat?: number;
  lon?: number;
  radius?: number;
  limit?: number;
}): Promise<GeoPlace[]> {
  try {
    const query = new URLSearchParams({
      category: params.category,
      radius: String(params.radius || 4000),
      limit: String(params.limit || 6),
    });
    if (params.lat !== undefined && params.lon !== undefined) {
      query.set('lat', String(params.lat));
      query.set('lon', String(params.lon));
    }
    const payload = await fetchJson<any>(`/api/geo/nearby?${query.toString()}`);
    if (Array.isArray(payload?.results)) return payload.results as GeoPlace[];
  } catch {
    /* hors-ligne */
  }
  return [];
}

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  steps?: string[];
  source: 'osrm' | 'estimate';
}

export async function getRoute(params: {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  mode?: 'driving' | 'walking' | 'bicycling';
}): Promise<RouteInfo | null> {
  try {
    const query = new URLSearchParams({
      from: `${params.from.lat},${params.from.lon}`,
      to: `${params.to.lat},${params.to.lon}`,
      mode: params.mode || 'driving',
    });
    const payload = await fetchJson<any>(`/api/geo/route?${query.toString()}`);
    if (payload && typeof payload.distanceMeters === 'number') return payload as RouteInfo;
  } catch {
    /* hors-ligne */
  }
  return null;
}

export interface WeatherInfo {
  city: string;
  temperatureC: number;
  condition: string;
  humidity?: number;
  windKmh?: number;
  forecast?: Array<{ day: string; minC: number; maxC: number; condition: string }>;
  source: 'open-meteo';
}

export async function getWeather(city = 'Niamey'): Promise<WeatherInfo | null> {
  try {
    const payload = await fetchJson<any>(`/api/geo/weather?city=${encodeURIComponent(city)}`);
    if (payload && typeof payload.temperatureC === 'number') return payload as WeatherInfo;
  } catch {
    /* hors-ligne */
  }
  return null;
}

/** Position GPS de l'appareil (nécessaire pour « près de moi »). */
export function getCurrentPosition(timeoutMs = 8000): Promise<{ lat: number; lon: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (value: { lat: number; lon: number; accuracy: number } | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        done({ lat: position.coords.latitude, lon: position.coords.longitude, accuracy: position.coords.accuracy });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}
