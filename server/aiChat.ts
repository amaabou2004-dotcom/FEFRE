import { GoogleGenAI } from '@google/genai';
import {
  buildAIContents,
  buildAISystemInstruction,
  buildDeterministicAIReply,
  buildKnowledgeFallbackReply,
  cleanAIText,
  detectAILanguage,
  getAICandidateModels,
  getAIIntent,
  getAISuggestions,
  normalizeAIHistory,
  normalizeAISiteContext,
  sanitizeAIResponse,
  validateAIResponse,
  type AILanguage,
  type AISurface,
} from '../src/lib/aiAssistant';

export interface AIChatHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 60;
const MODEL_TIMEOUT_MS = 6500;
const GENERATION_DEADLINE_MS = 9000;
const rateLimitByIp = new Map<string, RateLimitEntry>();

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey = '';

function getAIClient(apiKey: string): GoogleGenAI {
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

function checkRateLimit(clientIp?: string | null): boolean {
  if (!clientIp) return true;
  const now = Date.now();
  const key = clientIp.slice(0, 120);
  const current = rateLimitByIp.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitByIp.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT_MAX;
}

function getErrorStatus(error: any): number | undefined {
  const value = error?.status || error?.code || error?.error?.code || error?.response?.status;
  const status = Number(value);
  return Number.isFinite(status) ? status : undefined;
}

function localizedError(language: AILanguage, type: 'empty' | 'long' | 'rate'): string {
  if (language === 'en') {
    if (type === 'empty') return 'Please enter a message.';
    if (type === 'long') return 'Your message is too long. Please shorten it to 2,000 characters maximum.';
    return 'Too many requests in a short time. Please wait a moment or contact an advisor directly.';
  }
  if (type === 'empty') return 'Veuillez saisir un message.';
  if (type === 'long') return 'Votre message est trop long. Merci de le limiter à 2 000 caractères.';
  return 'Trop de demandes en peu de temps. Veuillez patienter un instant ou contacter directement un conseiller.';
}

async function generateWithModel(params: {
  ai: GoogleGenAI;
  model: string;
  contents: ReturnType<typeof buildAIContents>;
  systemInstruction: string;
  surface: AISurface;
  timeoutMs?: number;
}): Promise<string> {
  const timeoutMs = Math.max(1000, Math.min(params.timeoutMs || MODEL_TIMEOUT_MS, MODEL_TIMEOUT_MS));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await params.ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: 0.22,
        topP: 0.82,
        maxOutputTokens: params.surface === 'floating' ? 650 : 850,
        httpOptions: { timeout: timeoutMs },
        abortSignal: controller.signal,
      } as any,
    });
    return response.text?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleAIChatRequest(
  rawBody: unknown,
  options: {
    apiKey?: string;
    configuredModels?: string;
    clientIp?: string | null;
    now?: Date;
  } = {},
): Promise<AIChatHandlerResult> {
  const body = rawBody && typeof rawBody === 'object' ? (rawBody as Record<string, any>) : {};
  const preferredLanguage: AILanguage | undefined = body.language === 'en' || body.language === 'fr' ? body.language : undefined;
  const surface: AISurface = body.surface === 'floating' ? 'floating' : 'page';
  const rawMessage = typeof body.message === 'string' ? body.message : '';
  const language = detectAILanguage(rawMessage, preferredLanguage);

  if (!rawMessage.trim()) {
    return {
      status: 400,
      body: { error: localizedError(language, 'empty'), language },
    };
  }
  if (rawMessage.trim().length > 2000) {
    return {
      status: 413,
      body: { error: localizedError(language, 'long'), language },
    };
  }
  if (!checkRateLimit(options.clientIp)) {
    return {
      status: 429,
      body: { error: localizedError(language, 'rate'), language },
    };
  }

  const message = cleanAIText(rawMessage, 2000);
  const context = normalizeAISiteContext(body.siteContext);
  const history = normalizeAIHistory(body.history);

  const directReply = buildDeterministicAIReply(message, context, language, history, surface);
  if (directReply) {
    return {
      status: 200,
      body: {
        reply: directReply.reply,
        intent: directReply.intent,
        suggestions: directReply.suggestions,
        language,
        source: 'knowledge',
        modelUsed: 'excellence-ai',
      },
    };
  }

  const apiKey =
    options.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    '';

  if (!apiKey) {
    const fallback = buildKnowledgeFallbackReply(message, context, language, history, surface);
    return {
      status: 200,
      body: {
        reply: fallback.reply,
        intent: fallback.intent,
        suggestions: fallback.suggestions,
        language,
        source: 'fallback',
        fallback: true,
        modelUsed: 'excellence-ai',
      },
    };
  }

  const currentDate = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Niamey',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(options.now || new Date());
  const systemInstruction = buildAISystemInstruction(context, language, surface, currentDate);
  const contents = buildAIContents(history, message);
  const models = getAICandidateModels(options.configuredModels || process.env.GEMINI_MODEL || process.env.GEMINI_MODELS);
  const ai = getAIClient(apiKey);

  let lastError: any = null;
  const generationStartedAt = Date.now();
  for (const model of models) {
    const remainingMs = GENERATION_DEADLINE_MS - (Date.now() - generationStartedAt);
    if (remainingMs < 1500) break;
    try {
      const rawReply = await generateWithModel({
        ai,
        model,
        contents,
        systemInstruction,
        surface,
        timeoutMs: Math.min(MODEL_TIMEOUT_MS, remainingMs),
      });
      if (!rawReply) continue;
      const reply = sanitizeAIResponse(rawReply);
      const validation = validateAIResponse(reply, context, message);
      if (!validation.ok) {
        console.warn(`[Excellence AI] Rejected an unverified response (${validation.reason || 'validation'}). Trying another route.`);
        continue;
      }
      const intent = getAIIntent(message, reply);
      return {
        status: 200,
        body: {
          reply,
          intent,
          suggestions: getAISuggestions(intent.needsQuote ? 'quote' : intent.needsServices ? 'services' : intent.needsContact ? 'contact' : 'general', language, context),
          language,
          source: 'ai',
          modelUsed: 'excellence-ai',
        },
      };
    } catch (error: any) {
      lastError = error;
      const status = getErrorStatus(error);
      const messageText = String(error?.message || error || '');
      console.warn(`[Excellence AI] Model ${model} failed (${status || 'unknown'}): ${messageText.slice(0, 220)}`);

      // Authentication/request-shape errors will not be fixed by trying every model.
      if ((status === 400 || status === 401 || status === 403) && !/model|not found|not supported/i.test(messageText)) {
        break;
      }
    }
  }

  if (lastError) {
    console.error('[Excellence AI] All generation attempts failed; using verified knowledge fallback.', lastError?.message || lastError);
  }

  const fallback = buildKnowledgeFallbackReply(message, context, language, history, surface);
  return {
    status: 200,
    body: {
      reply: fallback.reply,
      intent: fallback.intent,
      suggestions: fallback.suggestions,
      language,
      source: 'fallback',
      fallback: true,
      modelUsed: 'excellence-ai',
    },
  };
}
