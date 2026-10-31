import { GoogleGenAI } from '@google/genai';
import { runLocalBrain } from '../src/lib/voice/brain';
import { detectVoiceLanguage } from '../src/lib/voice/intents';
import { getLanguageMeta } from '../src/lib/voice/languages';
import { getWeather, describeWeather, searchGeo, searchNearby, getRoute } from './geoService';
import type { AssistantContext, AssistantTurn, VoiceLanguage } from '../src/lib/voice/types';

/**
 * ISA — Service vocal serveur
 * ===========================
 * Trois fonctions exposées par Express ET par Netlify Functions :
 *
 *   • `stt`   audio → texte  (serveur local Whisper d'abord, sinon Gemini)
 *   • `think` texte → réponse + actions (règles locales d'abord, sinon Gemini)
 *   • `tts`   texte → audio  (serveur local Piper/MMS d'abord, sinon Gemini TTS)
 *
 * Règle de conception : les clés API restent côté serveur, jamais dans le
 * navigateur. Le serveur local de Niamey (`ISA_LOCAL_SERVER`) est toujours
 * préféré quand il répond : données qui ne quittent pas le pays + hors-ligne.
 */

const STT_TIMEOUT_MS = 25000;
const TTS_TIMEOUT_MS = 20000;
const THINK_TIMEOUT_MS = 20000;

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey = '';

function getApiKey(options?: { apiKey?: string }): string {
  return (
    options?.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  );
}

function getClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

function getLocalServerUrl(): string | undefined {
  const value = process.env.ISA_LOCAL_SERVER || process.env.ISA_LOCAL_URL || process.env.VITE_ISA_LOCAL_SERVER;
  return value ? String(value).replace(/\/+$/, '') : undefined;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* WAV : encapsule un PCM brut (Gemini TTS renvoie du PCM 24 kHz)      */
/* ------------------------------------------------------------------ */

function pcmBase64ToWavBase64(pcmBase64: string, sampleRate = 24000, channels = 1, bitsPerSample = 16): string {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const header = Buffer.alloc(44);
  const dataSize = pcm.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

/* ------------------------------------------------------------------ */
/* 1. Reconnaissance vocale                                            */
/* ------------------------------------------------------------------ */

export interface SttResult {
  status: number;
  body: Record<string, unknown>;
}

export async function handleVoiceStt(params: {
  audioBase64: string;
  mimeType?: string;
  language?: string;
  apiKey?: string;
}): Promise<SttResult> {
  const audioBase64 = String(params.audioBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
  if (!audioBase64) return { status: 400, body: { error: 'Audio manquant.', language: 'fr' } };

  const language = (params.language as VoiceLanguage) || 'fr';
  const mimeType = params.mimeType || 'audio/wav';

  // Priorité : serveur local de Niamey (Whisper) → aucune donnée ne sort.
  const localUrl = getLocalServerUrl();
  if (localUrl) {
    try {
      const response = await fetchWithTimeout(
        `${localUrl}/stt`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64, mimeType, language }),
        },
        STT_TIMEOUT_MS,
      );
      if (response.ok) {
        const payload = await response.json();
        return {
          status: 200,
          body: {
            text: String(payload?.text || '').trim(),
            language: payload?.language || language,
            confidence: payload?.confidence,
            engine: payload?.engine || 'faster-whisper',
            source: 'local-server',
          },
        };
      }
    } catch (error) {
      console.warn('[ISA voice] Serveur local STT indisponible, repli cloud :', (error as Error)?.message || error);
    }
  }

  const apiKey = getApiKey({ apiKey: params.apiKey });
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: 'Aucun moteur de reconnaissance disponible. Démarrez le serveur local ISA (voice-ai) ou définissez GEMINI_API_KEY.',
        language,
      },
    };
  }

  try {
    const ai = getClient(apiKey);
    const languageName = getLanguageMeta(language).label;
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_ASR_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Transcris EXACTEMENT cet audio, sans ajouter ni retirer de mots.',
                "L'audio peut être en français, en zarma (Zarmaciine, Niger) ou en haoussa.",
                `Langue attendue : ${languageName}. Si la langue réelle est différente, transcris quand même fidèlement.`,
                'Pour le zarma et le haoussa, utilise une orthographe simple et lisible.',
                'Réponds UNIQUEMENT en JSON strict : {"text": "...", "language": "fr|dje|ha|en", "confidence": 0.0-1.0}',
                'Si aucun mot intelligible, renvoie {"text": "", "language": "fr", "confidence": 0}.',
              ].join('\n'),
            },
            { inlineData: { mimeType, data: audioBase64 } },
          ],
        },
      ],
      config: { temperature: 0, maxOutputTokens: 400 } as any,
    });

    const raw = String(response.text || '').trim();
    const parsed = parseJsonLoose(raw);
    const text = String(parsed?.text || '').trim();
    return {
      status: 200,
      body: {
        text,
        language: normalizeLang(parsed?.language) || language,
        confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : undefined,
        engine: 'gemini-audio',
        source: 'cloud',
      },
    };
  } catch (error) {
    console.error('[ISA voice] Transcription cloud en échec :', (error as Error)?.message || error);
    return { status: 502, body: { error: 'Transcription impossible pour le moment.', language } };
  }
}

/* ------------------------------------------------------------------ */
/* 2. Cerveau (règles locales → LLM)                                   */
/* ------------------------------------------------------------------ */

export interface ThinkResult {
  status: number;
  body: Record<string, unknown>;
}

function normalizeLang(value: unknown): VoiceLanguage | undefined {
  const text = String(value || '').toLowerCase();
  if (['dje', 'zarma', 'djerma', 'zar'].some((item) => text.includes(item))) return 'dje';
  if (['ha', 'hausa', 'haoussa'].includes(text) || text.startsWith('ha-') || text.startsWith('hau')) return 'ha';
  if (text.startsWith('en')) return 'en';
  if (text.startsWith('fr')) return 'fr';
  return undefined;
}

function parseJsonLoose(raw: string): Record<string, any> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, any>;
    } catch {
      return null;
    }
  }
}

function normalizeContext(raw: unknown): AssistantContext {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  return {
    language: normalizeLang(input.language) || 'fr',
    position:
      input.position && Number.isFinite(Number(input.position?.lat)) && Number.isFinite(Number(input.position?.lon))
        ? { lat: Number(input.position.lat), lon: Number(input.position.lon), accuracy: input.position.accuracy }
        : undefined,
    currentPage: typeof input.currentPage === 'string' ? input.currentPage : undefined,
    siteContext: input.siteContext || undefined,
    history: Array.isArray(input.history) ? input.history.slice(-8) : [],
  };
}

export async function handleVoiceThink(params: {
  text?: string;
  language?: string;
  context?: unknown;
  systemPrompt?: string;
  history?: unknown;
  apiKey?: string;
  clientIp?: string | null;
}): Promise<ThinkResult> {
  const utterance = String(params.text || '').trim().slice(0, 1200);
  if (!utterance) return { status: 400, body: { error: 'Message vide.', language: 'fr' } };

  const context = normalizeContext(params.context);
  const language: VoiceLanguage = detectVoiceLanguage(utterance, normalizeLang(params.language) || context.language);
  context.language = language;

  // Étape 1 — règles locales : hors-ligne, instantané, gratuit.
  const local = runLocalBrain(utterance, context);

  // Cas particuliers enrichis en direct (météo, proximité, itinéraire) :
  // ils ajoutent des données réelles à la réponse locale.
  if (local && local.intent === 'weather') {
    const city = local.slots.destination || 'Niamey';
    const weather = await getWeather(city);
    if (weather) {
      const sentence = describeWeather(weather, language);
      return {
        status: 200,
        body: {
          ...local,
          reply: sentence,
          speak: sentence,
          source: 'local-knowledge',
          offline: false,
          cards: [
            {
              kind: 'weather',
              title: `${Math.round(weather.temperatureC)} °C · ${weather.city}`,
              subtitle: weather.condition,
              meta: [
                { label: 'Humidité', value: weather.humidity !== undefined ? `${weather.humidity} %` : '—' },
                { label: 'Vent', value: weather.windKmh !== undefined ? `${Math.round(weather.windKmh)} km/h` : '—' },
                ...(weather.forecast || []).map((day) => ({
                  label: day.day,
                  value: `${Math.round(day.minC)}–${Math.round(day.maxC)} °C · ${day.condition}`,
                })),
              ],
            },
          ],
        } as unknown as Record<string, unknown>,
      };
    }
  }

  if (local && local.intent === 'find_place' && local.slots.placeCategory && context.position) {
    const nearby = await searchNearby({
      category: local.slots.placeCategory,
      lat: context.position.lat,
      lon: context.position.lon,
      radius: 5000,
      limit: 6,
    });
    if (nearby.length) {
      return {
        status: 200,
        body: {
          ...local,
          offline: false,
          reply:
            language === 'ha'
              ? `Na sami wurare ${nearby.length} kusa da kai. Ga mafi kusa a taswira.`
              : language === 'dje'
                ? `Ay du nangu ${nearby.length} ni gaa. Wo ga kart ra.`
                : `J'ai trouvé ${nearby.length} lieux près de vous. Voici le plus proche sur la carte.`,
          speak:
            language === 'ha'
              ? `Na sami wurare ${nearby.length} kusa da kai.`
              : language === 'dje'
                ? `Ay du nangu ${nearby.length} ni gaa.`
                : `J'ai trouvé ${nearby.length} lieux près de vous.`,
          cards: [
            {
              kind: 'place',
              title: nearby[0].name,
              subtitle: nearby[0].displayName || nearby[0].city || 'Niger',
              primaryAction: {
                type: 'navigate_to',
                destination: `${nearby[0].lat},${nearby[0].lon}`,
                mode: 'driving',
                url: `https://www.google.com/maps/dir/?api=1&origin=${context.position.lat},${context.position.lon}&destination=${nearby[0].lat},${nearby[0].lon}&travelmode=driving`,
              },
              secondaryAction: {
                type: 'open_map',
                url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearby[0].name + ', Niger')}`,
                label: nearby[0].name,
              },
              meta: nearby.slice(1, 4).map((item) => ({ label: item.name, value: item.displayName || 'Niger' })),
            },
          ],
        } as unknown as Record<string, unknown>,
      };
    }
  }

  if (local) {
    return { status: 200, body: local as unknown as Record<string, unknown> };
  }

  // Étape 2 — serveur local (Ollama / llama.cpp) à Niamey.
  const localUrl = getLocalServerUrl();
  if (localUrl) {
    try {
      const response = await fetchWithTimeout(
        `${localUrl}/think`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: utterance,
            language,
            context,
            systemPrompt: params.systemPrompt,
            history: params.history,
          }),
        },
        THINK_TIMEOUT_MS + 8000,
      );
      if (response.ok) {
        const payload = (await response.json()) as Record<string, any>;
        if (payload?.reply) {
          return { status: 200, body: { ...payload, source: 'local-llm', offline: true } };
        }
      }
    } catch (error) {
      console.warn('[ISA voice] Serveur local LLM indisponible, repli cloud :', (error as Error)?.message || error);
    }
  }

  // Étape 3 — Gemini (cloud).
  const apiKey = getApiKey({ apiKey: params.apiKey });
  if (!apiKey) {
    return { status: 200, body: offlineUnknownTurn(utterance, language) as unknown as Record<string, unknown> };
  }

  try {
    const ai = getClient(apiKey);
    const history = Array.isArray(params.history) ? (params.history as Array<{ role: string; text: string }>).slice(-8) : [];
    const contents = [
      ...history.map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(item.text || '').slice(0, 1200) }],
      })),
      { role: 'user', parts: [{ text: utterance }] },
    ];

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_VOICE_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: params.systemPrompt || defaultVoiceSystemPrompt(context, language),
        temperature: 0.3,
        topP: 0.85,
        maxOutputTokens: 400,
      } as any,
    });

    const reply = String(response.text || '').trim();
    if (!reply) return { status: 200, body: offlineUnknownTurn(utterance, language) as unknown as Record<string, unknown> };

    return {
      status: 200,
      body: {
        reply,
        speak: reply,
        language,
        intent: 'unknown',
        slots: { query: utterance },
        actions: [],
        cards: [],
        suggestions: [],
        source: 'cloud-llm',
        offline: false,
        modelUsed: process.env.GEMINI_VOICE_MODEL || 'gemini-2.5-flash',
      },
    };
  } catch (error) {
    console.error('[ISA voice] Génération cloud en échec :', (error as Error)?.message || error);
    return { status: 200, body: offlineUnknownTurn(utterance, language) as unknown as Record<string, unknown> };
  }
}

function defaultVoiceSystemPrompt(context: AssistantContext, language: VoiceLanguage): string {
  const names: Record<VoiceLanguage, string> = { fr: 'français', dje: 'zarma (Zarmaciine)', ha: 'haoussa', en: 'anglais' };
  const site = context.siteContext;
  return [
    'Tu es ISA, l’assistant vocal du Niger, créé par Excellence Services SARL à Niamey.',
    `Réponds uniquement en ${names[language]}, en 2 ou 3 phrases courtes destinées à être lues à voix haute.`,
    'Tu comprends le français, le zarma et le haoussa. Si la phrase mélange plusieurs langues, réponds dans la langue dominante.',
    'Aucun formatage Markdown : texte brut seulement.',
    site?.companyName ? `Entreprise : ${site.companyName}, ${site.location || 'Niamey, Niger'}.` : '',
    'N’invente jamais un numéro de téléphone, une adresse, un prix ou un horaire.',
    'Ne parle pas de politique ni de personnes publiques.',
  ]
    .filter(Boolean)
    .join('\n');
}

function offlineUnknownTurn(utterance: string, language: VoiceLanguage): AssistantTurn {
  const phrases: Record<VoiceLanguage, string> = {
    fr: 'Je n’ai pas pu traiter cette demande pour le moment. Essayez « Conduis-moi au Grand Marché », « Quelle heure est-il ? » ou « Appelle le 17 ».',
    dje: 'Ay mana hin ma wo tee sohonno. Ma ne: « Ma ay ne koy Grand Marché », « Waati cendi? » wala « Polisi telefon 17 ».',
    ha: 'Ban iya aiwatar da wannan bukatar a yanzu. Gwada: « Kai ni Babbar Kasuwa », « Ƙarfe nawa yanzu? » ko « Kira 17 ».',
    en: 'I could not handle that request right now. Try “Take me to the Grand Marché”, “What time is it?” or “Call 17”.',
  };
  return {
    reply: phrases[language] || phrases.fr,
    speak: phrases[language] || phrases.fr,
    language,
    intent: 'unknown',
    slots: { query: utterance },
    actions: [],
    cards: [],
    suggestions: [],
    source: 'fallback',
    offline: true,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Synthèse vocale                                                  */
/* ------------------------------------------------------------------ */

const GEMINI_TTS_MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-preview-native-audio-dialog'];
const GEMINI_TTS_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'];

export interface TtsResult {
  status: number;
  body: Record<string, unknown>;
}

export async function handleVoiceTts(params: {
  text?: string;
  language?: string;
  voice?: string;
  apiKey?: string;
}): Promise<TtsResult> {
  const text = String(params.text || '').trim().slice(0, 1200);
  if (!text) return { status: 400, body: { error: 'Texte manquant.' } };

  const language = normalizeLang(params.language) || 'fr';

  // Priorité : serveur local (Piper pour le français, MMS-TTS pour le zarma et
  // le haoussa). C'est la SEULE façon de prononcer correctement ces langues.
  const localUrl = getLocalServerUrl();
  if (localUrl) {
    try {
      const response = await fetchWithTimeout(
        `${localUrl}/tts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language, voice: params.voice }),
        },
        TTS_TIMEOUT_MS,
      );
      if (response.ok) {
        const payload = (await response.json()) as Record<string, any>;
        if (payload?.audioBase64) {
          return {
            status: 200,
            body: {
              audioBase64: payload.audioBase64,
              mimeType: payload.mimeType || 'audio/wav',
              engine: payload.engine || 'piper',
              voice: payload.voice,
              language,
            },
          };
        }
      }
    } catch (error) {
      console.warn('[ISA voice] Serveur local TTS indisponible, repli cloud :', (error as Error)?.message || error);
    }
  }

  const apiKey = getApiKey({ apiKey: params.apiKey });
  if (!apiKey) {
    return { status: 503, body: { error: 'Aucun moteur vocal disponible. Démarrez voice-ai ou définissez GEMINI_API_KEY.', language } };
  }

  const ai = getClient(apiKey);
  const languageName = getLanguageMeta(language).label;

  for (const model of GEMINI_TTS_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: `Lis ce texte à voix haute, en ${languageName}, avec un ton calme et clair : ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: params.voice || GEMINI_TTS_VOICES[0] } },
          },
        } as any,
      });

      const part = (response as any)?.candidates?.[0]?.content?.parts?.[0];
      const inline = part?.inlineData || part?.inline_data;
      const data = inline?.data;
      if (!data) continue;
      const declaredMime = String(inline?.mimeType || inline?.mime_type || 'audio/L16;rate=24000');
      const rateMatch = declaredMime.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
      const wav = pcmBase64ToWavBase64(String(data), sampleRate);
      return {
        status: 200,
        body: { audioBase64: wav, mimeType: 'audio/wav', engine: 'gemini-tts', voice: params.voice || GEMINI_TTS_VOICES[0], language, sampleRate },
      };
    } catch (error) {
      console.warn(`[ISA voice] TTS ${model} en échec :`, (error as Error)?.message || error);
    }
  }

  return { status: 502, body: { error: 'Synthèse vocale indisponible. Le navigateur prend le relais.', language } };
}

/* ------------------------------------------------------------------ */
/* 4. Traduction fr ↔ zarma ↔ haoussa                                  */
/* ------------------------------------------------------------------ */

export async function handleVoiceTranslate(params: {
  text?: string;
  target?: string;
  source?: string;
  apiKey?: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const text = String(params.text || '').trim().slice(0, 1200);
  const target = normalizeLang(params.target) || 'fr';
  if (!text) return { status: 400, body: { error: 'Texte manquant.' } };

  const localUrl = getLocalServerUrl();
  if (localUrl) {
    try {
      const response = await fetchWithTimeout(
        `${localUrl}/translate`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, target, source: params.source }) },
        THINK_TIMEOUT_MS,
      );
      if (response.ok) {
        const payload = (await response.json()) as Record<string, any>;
        if (payload?.translation) return { status: 200, body: payload };
      }
    } catch {
      /* repli cloud */
    }
  }

  const apiKey = getApiKey({ apiKey: params.apiKey });
  if (!apiKey) return { status: 503, body: { error: 'Traduction indisponible sans moteur.' } };

  const names: Record<VoiceLanguage, string> = { fr: 'français', dje: 'zarma (Zarmaciine, Niger)', ha: 'haoussa (Hausa)', en: 'anglais' };
  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_VOICE_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Traduis en ${names[target]} le texte ci-dessous. Utilise des mots simples et courants. N'invente rien. Réponds en JSON strict : {"translation": "..."}\n\nTexte : ${text}`,
            },
          ],
        },
      ],
      config: { temperature: 0.1, maxOutputTokens: 400 } as any,
    });
    const parsed = parseJsonLoose(String(response.text || ''));
    const translation = String(parsed?.translation || response.text || '').trim();
    if (!translation) return { status: 502, body: { error: 'Traduction vide.' } };
    return { status: 200, body: { translation, target, source: params.source || 'auto', engine: 'gemini' } };
  } catch (error) {
    console.error('[ISA voice] Traduction en échec :', (error as Error)?.message || error);
    return { status: 502, body: { error: 'Traduction impossible pour le moment.' } };
  }
}

/* ------------------------------------------------------------------ */
/* 5. Points d'entrée géographiques (utilisés par server.ts)           */
/* ------------------------------------------------------------------ */

export { searchGeo, searchNearby, getRoute, getWeather, describeWeather };
