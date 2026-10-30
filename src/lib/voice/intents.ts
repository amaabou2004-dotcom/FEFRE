import { INTENT_LEXICON, INTENT_ORDER, TIME_UNITS, WORD_NUMBERS, normalizeLanguageCode } from './languages';
import {
  matchNigerFact,
  matchNigerPlace,
  matchPlaceCategory,
  normalizeSearchText,
  NIGER_PLACES,
} from './nigerKnowledge';
import type { VoiceIntent, VoiceLanguage, VoiceSlots } from './types';

/**
 * ISA — Moteur d'intentions
 * =========================
 * Déterministe, sans dépendance réseau : il fonctionne donc hors-ligne et sur
 * un petit serveur à Niamey. Chaque intention est détectée par lexique (fr /
 * zarma / haoussa / anglais), puis les emplacements (destination, durée,
 * numéro, heure) sont extraits.
 *
 * Quand rien ne correspond, le cerveau passe la main à un modèle de langage
 * (Gemini en ligne, Ollama/llama.cpp sur le serveur local) : l'ordre
 * d'exécution est « règles locales d'abord, LLM ensuite ».
 */

export interface IntentMatch {
  intent: VoiceIntent;
  language: VoiceLanguage;
  slots: VoiceSlots;
  confidence: number;
  matchedKeyword?: string;
}

/**
 * Repli des lettres africaines crochetées vers l'alphabet latin de base.
 *
 * Le haoussa s'écrit avec ɓ ɗ ƙ ʼ et le zarma avec ŋ ʒ : selon le clavier, le
 * moteur de transcription ou la saisie, on reçoit « ƙarfe » ou « karfe ». Sans
 * ce repli, la moitié des phrases haoussa ne seraient pas reconnues.
 */
const AFRICAN_FOLD: Record<string, string> = {
  ɓ: 'b', ɗ: 'd', ƙ: 'k', ƴ: 'y', ɲ: 'n', ŋ: 'n', ɛ: 'e', ɔ: 'o', ə: 'e',
  ʒ: 'j', č: 'c', š: 's', ž: 'z', ł: 'l', ħ: 'h', ŧ: 't', ß: 'ss',
  'ʼ': "'", 'ʻ': "'", '\u2019': "'", '\u2018': "'", '`': "'",
};

function foldAfricanLetters(value: string): string {
  return value.replace(/[ɓɗƙƴɲŋɛɔəʒčšžłħŧßʼʻ’‘`]/g, (char) => AFRICAN_FOLD[char] || char);
}

/** Ponctuation et espaces que la reconnaissance vocale adore inventer. */
export function normalizeUtterance(text: string): string {
  return foldAfricanLetters(
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘`´]/g, "'")
      .replace(/[\u2019\u02bc\u02bb]/g, ''),
  )
    .replace(/[.,!?;:…]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalisation « douce » qui CONSERVE les deux-points et les « h » :
 * indispensable pour lire une heure (« 07:15 », « 6h30 »), que la
 * normalisation complète transformerait en « 07 15 ».
 */
export function normalizeKeepingTime(text: string): string {
  return foldAfricanLetters(
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘`´]/g, "'")
      .replace(/[\u2019\u02bc\u02bb]/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Détection de langue. Priorité : zarma → haoussa → anglais → français.
 * On commence par les langues nationales parce que le français partage beaucoup
 * de mots avec elles (emprunts) alors que l'inverse est faux.
 */
export function detectVoiceLanguage(text: string, hint?: string): VoiceLanguage {
  const normalized = normalizeUtterance(text);
  const hinted = normalizeLanguageCode(hint);

  if (!normalized) return hinted;

  let best: { code: VoiceLanguage; score: number } = { code: hinted, score: 0 };

  const scoreFor = (language: VoiceLanguage): number => {
    const lexicon = INTENT_LEXICON;
    let score = 0;
    (Object.keys(lexicon) as VoiceIntent[]).forEach((intent) => {
      const patterns = lexicon[intent][language] || [];
      patterns.forEach((pattern) => {
        if (typeof pattern === 'string') {
          const needle = normalizeUtterance(pattern);
          if (needle && needle.length >= 3 && normalized.includes(needle)) {
            score += needle.length;
          }
        } else if (pattern.test(normalized)) {
          score += 6;
        }
      });
    });
    return score;
  };

  (['dje', 'ha', 'en', 'fr'] as VoiceLanguage[]).forEach((code) => {
    const score = scoreFor(code);
    if (score > best.score) best = { code, score };
  });

  // Marqueurs forts, indépendants du lexique d'intentions.
  const zarmaMarkers = [' fofo', 'mate ni go', 'baani samay', 'ay ga', 'ay go ba', 'ma ay', 'kwaara', 'boro', 'hunkuna', 'zaari', ' ay ', 'ni go'];
  const hausaMarkers = ['sannu', 'na gode', 'nagode', 'yaya kake', 'ina son', 'yi mini', 'ka ', 'ni ', ' kuke', 'sai ', 'gaskiya', "a'a", ' zan ', ' mu ', 'ban '];
  const englishMarkers = ['the ', 'what ', 'where is', 'how ', 'please ', 'you ', 'i want'];
  const frenchMarkers = ['le ', 'la ', 'les ', ' est ', ' je ', ' où ', 'ou est', 's\'il vous plait', "s'il vous", 'merci', 'bonjour'];

  const count = (markers: string[]) => markers.filter((marker) => normalized.includes(marker.trim())).length;
  const zarmaScore = count(zarmaMarkers);
  const hausaScore = count(hausaMarkers);
  const englishScore = count(englishMarkers);
  const frenchScore = count(frenchMarkers);

  const markerWinner = Math.max(zarmaScore, hausaScore, englishScore, frenchScore);
  if (markerWinner >= 2) {
    if (markerWinner === zarmaScore) return 'dje';
    if (markerWinner === hausaScore) return 'ha';
    if (markerWinner === englishScore) return 'en';
    if (markerWinner === frenchScore) return 'fr';
  }

  if (best.score >= 4) return best.code;

  // Repli : l'utilisateur a choisi sa langue dans l'interface.
  return hinted;
}

/** Extrait un numéro de téléphone nigérien / international. */
export function extractPhoneNumber(text: string): string | undefined {
  const candidates = String(text || '').match(/(?:\+?\d[\d\s().-]{6,}\d)/g) || [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) {
      const hasPlus = candidate.trim().startsWith('+');
      const alreadyInternational = digits.startsWith('227') && digits.length === 11;
      // Un numéro local nigérien compte 8 chiffres : on ajoute l'indicatif +227
      // pour que `tel:` fonctionne aussi depuis un téléphone étranger.
      if (hasPlus || alreadyInternational) return `+${digits}`;
      if (digits.length === 8) return `+227${digits}`;
      return digits;
    }
  }

  const digits = String(text || '').replace(/\D/g, '');
  if (digits.length === 8) return `+227${digits}`;
  if (digits.length === 11 && digits.startsWith('227')) return `+${digits}`;
  return undefined;
}

/** Met au format E.164 (+227…) un numéro local à 8 chiffres. */
export function toE164Niger(number: string): string {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 8) return `+227${digits}`;
  if (digits.length === 11 && digits.startsWith('227')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
}

/** Unités de durée reconnues, toutes langues confondues. */
const DURATION_UNITS = 'min|mins|minut|minute|minutes|minti|mintiya|mintuna|hour|hours|heure|heures|saati|saatyey|awa|awanni|seconde|secondes|seconds|dakika';

function unitToMinutes(unit: string, language: VoiceLanguage): 'hour' | 'second' | 'minute' {
  const resolved = TIME_UNITS[language]?.[unit] || TIME_UNITS.fr[unit] || TIME_UNITS.ha[unit] || 'minute';
  return resolved;
}

/**
 * Extrait une durée en minutes.
 *
 * Accepte les deux ordres de mots, car ils diffèrent selon la langue :
 *   • français / anglais : « 10 minutes », « dix minutes »
 *   • haoussa / zarma    : « mintuna 5 », « minti hinka » (unité AVANT le nombre)
 */
export function extractDurationMinutes(text: string, language: VoiceLanguage): number | undefined {
  const normalized = normalizeUtterance(text);
  const numbers = WORD_NUMBERS[language] || {};

  // 1) Nombre en chiffres, dans les deux ordres.
  const afterUnit = normalized.match(new RegExp(`\\b(${DURATION_UNITS})\\s+(\\d+)\\b`));
  const beforeUnit = normalized.match(new RegExp(`\\b(\\d+)\\s*(${DURATION_UNITS})\\b`));
  const numeric = afterUnit ? { unit: afterUnit[1], value: Number(afterUnit[2]) } : beforeUnit ? { unit: beforeUnit[2], value: Number(beforeUnit[1]) } : null;
  if (numeric && Number.isFinite(numeric.value)) {
    const unit = unitToMinutes(numeric.unit, language);
    if (unit === 'hour') return numeric.value * 60;
    if (unit === 'second') return Math.max(1, Math.round(numeric.value / 60));
    return numeric.value;
  }

  // 2) Nombre en lettres, dans les deux ordres (« dix minutes » / « minti hinka »).
  const words = Object.entries(numbers).sort((a, b) => b[0].length - a[0].length);
  for (const [word, value] of words) {
    const token = word.replace(/[-']/g, ' ').replace(/\s+/g, ' ').trim();
    if (!token) continue;
    const wordFirst = new RegExp(`\\b${token}\\b[^\\d]{0,18}?\\b(${DURATION_UNITS})\\b`);
    const unitFirst = new RegExp(`\\b(${DURATION_UNITS})\\b[^\\d]{0,18}?\\b${token}\\b`);
    const match = normalized.match(wordFirst) || normalized.match(unitFirst);
    if (!match) continue;
    const unit = unitToMinutes(match[1], language);
    if (unit === 'hour') return value * 60;
    if (unit === 'second') return Math.max(1, Math.round(value / 60));
    return value;
  }
  return undefined;
}

/** Extrait une heure (« à 7h30 », « 07:30 », « sept heures trente »). */
export function extractClockTime(text: string, language: VoiceLanguage): string | undefined {
  // Normalisation douce : les deux-points et les « h » doivent survivre.
  const normalized = normalizeKeepingTime(text);
  const direct = normalized.match(/\b(\d{1,2})\s*[h:]\s*(\d{1,2})\b/);
  if (direct) {
    const hour = Number(direct[1]);
    const minute = Number(direct[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }
  // « sept heures » / « sept heures trente »
  const hourOnly = normalized.match(/\b(\d{1,2})\s*(?:h|heures?|awa|saati)\b/);
  if (hourOnly) {
    const hour = Number(hourOnly[1]);
    if (hour >= 0 && hour <= 23) return `${String(hour).padStart(2, '0')}:00`;
  }

  const numbers = WORD_NUMBERS[language] || {};
  const words = Object.entries(numbers);
  let hour: number | undefined;
  let minute = 0;
  for (const [word, value] of words) {
    if (new RegExp(`\\b${word}\\b`).test(normalized) && value <= 23) {
      hour = value;
      break;
    }
  }
  if (hour === undefined) return undefined;
  for (const [word, value] of words) {
    if (value <= 59 && value > 0 && normalized.lastIndexOf(word) > normalized.length / 2) {
      minute = value;
    }
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Extrait la destination d'une phrase de navigation ou de recherche de lieu.
 * On retire les mots d'ordre (« amène-moi à », « kai ni », « ma ay ne koy »)
 * puis on recherche un lieu connu. Si aucun lieu connu n'est trouvé, on garde
 * la chaîne brute : elle sera envoyée à Google Maps / Nominatim.
 */
export function extractDestination(text: string, language: VoiceLanguage): string | undefined {
  const raw = String(text || '').trim();
  if (!raw) return undefined;
  const normalized = normalizeUtterance(raw);

  const prefixes: Record<VoiceLanguage, string[]> = {
    fr: [
      'amene moi a', 'amene moi au', 'amene moi aux', 'conduis moi a', 'conduis moi au', 'emmene moi a', 'emmene moi au',
      'mene moi a', 'mene moi au', 'je veux aller a', 'je veux aller au', 'aller a', 'aller au', 'itineraire vers',
      'itineraire pour', 'route vers', 'chemin vers', 'direction', 'guide moi vers', 'guide moi a', 'comment aller a',
      'comment aller au', 'comment je vais a', 'ou se trouve', 'ou est', 'cherche', 'trouve', 'montre moi', 'je cherche',
      'va a', 'va au', 'navigate to', 'take me to',
    ],
    dje: ['ay ma koy', 'ma ay ne koy', 'ay koyne', 'koy', 'mar no', 'man hare', 'ma ay cebe', 'ay ma ceeci', 'ceeci', 'fondo'],
    ha: ['kai ni', 'je ni', 'nuna mini', 'nuna min', 'ina son zuwa', 'zan je', 'hanyar zuwa', 'tafiya zuwa', 'jagorance ni zuwa', 'ina', 'nemo', 'nemi'],
    en: ['take me to', 'drive me to', 'navigate to', 'directions to', 'route to', 'how do i get to', 'where is', 'find', 'show me'],
  };

  let cleaned = normalized;
  const ordered = [...(prefixes[language] || []), ...prefixes.fr];
  for (const prefix of ordered.sort((a, b) => b.length - a.length)) {
    const index = cleaned.indexOf(prefix);
    if (index >= 0) {
      cleaned = cleaned.slice(index + prefix.length);
      break;
    }
  }
  cleaned = cleaned
    .replace(/\b(le|la|les|l|au|aux|des|du|de|d)\b/g, ' ')
    .replace(/\b(the|a|an|to)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Enlève un suffixe interrogatif traînant (« grand marche ne » / « ina kasuwa »).
  cleaned = cleaned.replace(/\b(ne|ce|wo|no|ina|a ina)\s*$/g, '').trim();

  if (!cleaned) return undefined;

  // Un lieu connu remporte toujours la priorité (orthographe stable).
  const known = matchNigerPlace(cleaned) || matchNigerPlace(raw);
  if (known) return known.name;

  // Sinon : texte capitalisé, tel que l'utilisateur l'a dit.
  const fromRaw = raw.replace(/^(am[eè]ne[- ]moi|conduis[- ]moi|emm[eè]ne[- ]moi|m[eè]ne[- ]moi|je veux aller|kai ni|take me to|navigate to|directions to)\s*(à|a|au|aux|to)?\s*/i, '');
  const finalText = (fromRaw || raw).replace(/\s+/g, ' ').trim();
  if (!finalText || finalText.length < 2) return undefined;
  return finalText.charAt(0).toUpperCase() + finalText.slice(1);
}

/** Retire les mots d'ordre pour récupérer une requête de recherche propre. */
export function extractQuery(text: string): string {
  return normalizeSearchText(text)
    .replace(/\b(cherche|recherche|cherche sur internet|google|search the web|look up|bincika|nemo|ceeci)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Poids de priorité par intention.
 *
 * Sans ce barème, un NOM long l'emporterait sur un VERBE court : dans
 * « Appelle Excellence Services », le mot « services » (8 lettres) battrait
 * « appelle » (7 lettres) et l'assistant ouvrirait la page des services au
 * lieu de téléphoner. Les intentions d'action (appel, navigation, minuteur,
 * urgence) reçoivent donc un bonus, et les intentions conversationnelles
 * (salutation, remerciement) un poids faible.
 */
const INTENT_WEIGHTS: Record<VoiceIntent, number> = {
  stop_speaking: 100,
  emergency: 90,
  repeat: 60,
  navigate: 40,
  call: 35,
  sms: 35,
  whatsapp: 38,
  email: 32,
  timer: 30,
  alarm: 30,
  reminder: 30,
  time: 25,
  date: 25,
  weather: 25,
  translate: 22,
  distance: 20,
  play_music: 15,
  find_place: 10,
  open_site: 10,
  greeting: 8,
  thanks: 8,
  identity: 8,
  help: 8,
  company_quote: 6,
  company_hours: 6,
  company_location: 6,
  company_contact: 6,
  company_services: 5,
  search_web: 5,
  unknown: 0,
};

/** Résout l'intention principale d'un énoncé. */
export function detectIntent(text: string, language: VoiceLanguage): IntentMatch {
  const normalized = normalizeUtterance(text);
  const slots: VoiceSlots = {};
  if (!normalized) {
    return { intent: 'unknown', language, slots, confidence: 0 };
  }

  let intent: VoiceIntent = 'unknown';
  let matchedKeyword: string | undefined;
  let score = 0;

  for (const candidate of INTENT_ORDER) {
    const patterns = INTENT_LEXICON[candidate]?.[language] || [];
    const extraLanguages = language === 'fr' ? ['dje', 'ha'] : language === 'dje' || language === 'ha' ? ['fr'] : ['fr'];
    const allPatterns = [...patterns, ...extraLanguages.flatMap((code) => INTENT_LEXICON[candidate]?.[code as VoiceLanguage] || [])];

    for (const pattern of allPatterns) {
      const needle = typeof pattern === 'string' ? normalizeUtterance(pattern) : '';
      const hit = typeof pattern === 'string' ? needle.length >= 3 && normalized.includes(needle) : pattern.test(normalized);
      if (!hit) continue;
      const weight = typeof pattern === 'string' ? needle.length : 8;
      // Bonus pour la langue parlée : une intention trouvée dans la langue de
      // l'utilisateur est plus fiable qu'un mot français emprunté.
      const languageBonus = (INTENT_LEXICON[candidate]?.[language] || []).includes(pattern) ? 4 : 0;
      const total = weight + languageBonus + (INTENT_WEIGHTS[candidate] || 0);
      if (total > score) {
        score = total;
        intent = candidate;
        matchedKeyword = typeof pattern === 'string' ? pattern : pattern.source;
      }
    }
  }

  const rawScore = Math.max(0, score - (INTENT_WEIGHTS[intent] || 0));

  // Emplacements par intention.
  const destination = extractDestination(text, language);
  const phoneNumber = extractPhoneNumber(text);
  const category = matchPlaceCategory(text);
  const fact = matchNigerFact(text);
  const place = matchNigerPlace(text);

  if (destination) slots.destination = destination;
  if (phoneNumber) slots.phoneNumber = phoneNumber;
  if (category) slots.placeCategory = category;
  if (matchedKeyword) slots.rawMatchedKeyword = matchedKeyword;

  if (intent === 'navigate' || intent === 'find_place' || intent === 'distance') {
    if (category) slots.placeCategory = category;
    if (place && !slots.destination) slots.destination = place.name;
    if (!slots.destination && !slots.placeCategory) {
      slots.query = extractQuery(text);
    }
  }

  if (intent === 'timer' || intent === 'reminder') {
    const minutes = extractDurationMinutes(text, language);
    if (minutes !== undefined) slots.minutes = minutes;
    const clock = extractClockTime(text, language);
    if (!slots.minutes && clock) slots.clockTime = clock;
    if (intent === 'reminder') slots.message = text.slice(0, 240);
  }

  if (intent === 'alarm') {
    const clock = extractClockTime(text, language);
    if (clock) slots.clockTime = clock;
    else {
      const minutes = extractDurationMinutes(text, language);
      if (minutes) slots.minutes = minutes;
    }
  }

  if (intent === 'call' || intent === 'sms' || intent === 'whatsapp' || intent === 'email') {
    if (!slots.phoneNumber) {
      slots.contact = extractContactName(text, language);
    }
    if (intent === 'sms' || intent === 'whatsapp' || intent === 'email') {
      slots.message = extractMessageBody(text, language);
    }
  }

  if (intent === 'time' || intent === 'date' || intent === 'weather') {
    if (place && !slots.destination) slots.destination = place.name;
  }

  if (intent === 'search_web' || intent === 'unknown') {
    const query = extractQuery(text);
    if (query) slots.query = query;
    if (fact && intent === 'unknown') intent = 'find_place'; // réponse factuelle locale
  }

  if (intent === 'translate') {
    slots.targetLanguage = detectTranslationTarget(text);
    slots.query = text;
  }

  // La confiance repose sur le score lexical brut (sans le poids de priorité),
  // pour rester comparable d'une intention à l'autre.
  const confidence = intent === 'unknown' ? 0 : Math.min(1, 0.45 + rawScore / 45);
  return { intent, language, slots, confidence, matchedKeyword };
}

/** Extrait un nom de contact (« appelle Hama », « kira Boubacar »). */
function extractContactName(text: string, language: VoiceLanguage): string | undefined {
  const normalized = normalizeUtterance(text);
  const patterns: Record<VoiceLanguage, string[]> = {
    fr: ['appelle', 'appeler', 'telephone', 'contacte', 'joindre', 'envoie un sms a', 'message a', 'sms a'],
    dje: ['telefon', 'da', 'sanni sanba'],
    ha: ['kira', 'yi kiran', 'yi mini kira', 'aika sako', 'aika saƙo'.toLowerCase()],
    en: ['call', 'ring', 'dial', 'text'],
  };
  let cleaned = normalized;
  for (const prefix of [...(patterns[language] || []), ...patterns.fr].sort((a, b) => b.length - a.length)) {
    const index = cleaned.indexOf(prefix);
    if (index >= 0) {
      cleaned = cleaned.slice(index + prefix.length);
      break;
    }
  }
  cleaned = cleaned.replace(/\b(au|a|le|la|to|the|mini|ni|ay)\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length < 2) return undefined;
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Extrait le corps d'un message (« dis-lui que… », « saƙo cewa… »). */
function extractMessageBody(text: string, language: VoiceLanguage): string | undefined {
  const normalized = normalizeUtterance(text);
  const markers: Record<VoiceLanguage, string[]> = {
    fr: ['que ', 'dis lui', 'dis-lui', 'message que', 'avec le texte', 'ecris'],
    dje: ['nda sanni', 'ce ', 'sanni nda'],
    ha: ['cewa', 'da rubutun', 'sako cewa', 'ce'],
    en: ['saying', 'that ', 'with the text', 'message'],
  };
  for (const marker of markers[language] || []) {
    const index = normalized.indexOf(marker);
    if (index >= 0) {
      const body = normalized.slice(index + marker.length).trim();
      if (body.length >= 2) return body.charAt(0).toUpperCase() + body.slice(1);
    }
  }
  return undefined;
}

/** Détecte la langue cible d'une traduction. */
function detectTranslationTarget(text: string): VoiceLanguage | undefined {
  const normalized = normalizeUtterance(text);
  if (/(zarma|djerma|zarmaciine|dje)/.test(normalized)) return 'dje';
  if (/(haoussa|hausa|hau)/.test(normalized)) return 'ha';
  if (/(anglais|english)/.test(normalized)) return 'en';
  if (/(francais|french)/.test(normalized)) return 'fr';
  return undefined;
}

/**
 * Suggère des lieux proches d'un texte approximatif (utile quand Whisper
 * écrit « grand marcher » ou « kasuwar »).
 */
export function suggestPlaces(query: string, limit = 5): typeof NIGER_PLACES {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const scored = NIGER_PLACES.map((place) => {
    const candidates = [place.name, ...place.aliases].map(normalizeSearchText);
    let score = 0;
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (candidate === normalized) score += 100;
      else if (normalized.includes(candidate)) score += 40 + candidate.length;
      else if (candidate.includes(normalized)) score += 25 + normalized.length;
      else {
        const distance = levenshtein(candidate.slice(0, 14), normalized.slice(0, 14));
        if (distance <= 2) score += 12 - distance;
      }
    }
    return { place, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((entry) => entry.place);
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i += 1) matrix[i] = [i];
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length] ?? 99;
}
