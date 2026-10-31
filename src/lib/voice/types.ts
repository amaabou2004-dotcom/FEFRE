/**
 * ISA — Assistant Vocal IA du Niger
 * ---------------------------------
 * Types partagés entre le navigateur (React), le serveur Node (Express /
 * Netlify Functions) et le serveur IA local Python (`voice-ai/`).
 *
 * Le protocole est volontairement plat et JSON-pur : les trois implémentations
 * peuvent donc produire et consommer exactement les mêmes objets, ce qui permet
 * de basculer du cloud vers le 100 % local sans changer une ligne de l'UI.
 */

/** Langues supportées par ISA. Codes ISO 639-1 / 639-3. */
export type VoiceLanguage = 'fr' | 'dje' | 'ha' | 'en';

/** Intention détectée dans la phrase de l'utilisateur. */
export type VoiceIntent =
  | 'greeting'
  | 'thanks'
  | 'identity'
  | 'help'
  | 'navigate'
  | 'find_place'
  | 'distance'
  | 'call'
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'time'
  | 'date'
  | 'weather'
  | 'timer'
  | 'alarm'
  | 'reminder'
  | 'translate'
  | 'company_services'
  | 'company_quote'
  | 'company_contact'
  | 'company_hours'
  | 'company_location'
  | 'emergency'
  | 'open_site'
  | 'search_web'
  | 'play_music'
  | 'stop_speaking'
  | 'repeat'
  | 'unknown';

/** Emplacements extraits de la phrase (le « quoi » de la demande). */
export interface VoiceSlots {
  /** Destination ou lieu recherché, tel que dit par l'utilisateur. */
  destination?: string;
  /** Requête libre (recherche web, question générale). */
  query?: string;
  /** Nom de contact ou numéro normalisé pour appels / SMS / WhatsApp. */
  contact?: string;
  /** Numéro au format E.164 si reconnu. */
  phoneNumber?: string;
  /** Corps du message à envoyer. */
  message?: string;
  /** Durée en minutes pour minuteurs / alarmes / rappels. */
  minutes?: number;
  /** Heure cible "HH:MM" pour les alarmes. */
  clockTime?: string;
  /** Langue cible d'une demande de traduction. */
  targetLanguage?: VoiceLanguage;
  /** Catégorie de lieu pour la recherche de proximité (pharmacie, hôpital…). */
  placeCategory?: string;
  /** Motif-clé résiduel utile au repli LLM. */
  rawMatchedKeyword?: string;
}

/** Action exécutable par le client (navigateur, Android, kiosque…). */
export type VoiceAction =
  | { type: 'speak'; text: string; language: VoiceLanguage }
  | { type: 'open_map'; url: string; label: string }
  | { type: 'show_map'; query: string; lat?: number; lon?: number; label?: string; zoom?: number }
  | { type: 'navigate_to'; origin?: string; destination: string; mode: 'driving' | 'walking' | 'transit' | 'bicycling'; url: string }
  | { type: 'call'; phoneNumber: string; label?: string }
  | { type: 'sms'; phoneNumber: string; body?: string }
  | { type: 'whatsapp'; phoneNumber: string; body?: string }
  | { type: 'email'; address: string; subject?: string; body?: string }
  | { type: 'open_url'; url: string; label?: string; external?: boolean }
  | { type: 'navigate_site'; path: string; label?: string }
  | { type: 'timer'; seconds: number; label?: string }
  | { type: 'alarm'; clockTime: string; label?: string }
  | { type: 'reminder'; text: string; clockTime?: string; minutes?: number }
  | { type: 'show_weather'; city?: string }
  | { type: 'show_list'; title: string; items: Array<{ title: string; subtitle?: string; url?: string }> }
  | { type: 'copy'; text: string }
  | { type: 'stop_speaking' }
  | { type: 'request_permission'; permission: 'microphone' | 'geolocation' | 'notifications' };

/** Carte « riche » affichée sous la réponse vocale. */
export interface VoiceCard {
  kind: 'place' | 'route' | 'weather' | 'contact' | 'info' | 'timer' | 'service';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  primaryAction?: VoiceAction;
  secondaryAction?: VoiceAction;
  meta?: Array<{ label: string; value: string }>;
}

/** Réponse complète du cerveau ISA. */
export interface AssistantTurn {
  /** Texte affiché à l'écran. */
  reply: string;
  /** Texte prononcé (peut être plus court que `reply`). */
  speak: string;
  language: VoiceLanguage;
  intent: VoiceIntent;
  slots: VoiceSlots;
  actions: VoiceAction[];
  cards: VoiceCard[];
  suggestions: string[];
  /** Origine de la réponse : utile pour le badge « hors-ligne » / « local ». */
  source: 'local-rule' | 'local-knowledge' | 'local-llm' | 'cloud-llm' | 'fallback';
  /** Vrai quand la réponse a été produite sans aucun accès Internet. */
  offline: boolean;
  modelUsed?: string;
  confidence?: number;
}

/** Contexte envoyé au cerveau (position, entreprise, page courante…). */
export interface AssistantContext {
  language: VoiceLanguage;
  /** Position GPS de l'appareil, si l'utilisateur l'a partagée. */
  position?: { lat: number; lon: number; accuracy?: number; label?: string };
  currentPage?: string;
  siteContext?: {
    companyName?: string;
    location?: string;
    email?: string;
    whatsappRaw?: string;
    phones?: Array<{ label: string; number: string; raw: string }>;
    workingHours?: string;
  };
  /** Historique court, pour la résolution des références (« et en taxi ? »). */
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

/** Résultat de transcription vocale. */
export interface TranscriptionResult {
  text: string;
  language: VoiceLanguage;
  detectedLanguages?: Array<{ code: string; score: number }>;
  confidence?: number;
  source: 'browser' | 'local-server' | 'cloud';
  engine?: string;
  durationMs?: number;
}

/** Résultat de synthèse vocale. */
export interface SynthesisResult {
  /** Audio encodé (WAV/MP3) quand la voix vient d'un moteur serveur. */
  audioBase64?: string;
  mimeType?: string;
  /** Vrai quand le navigateur a pu parler directement (Web Speech API). */
  spokenByBrowser: boolean;
  engine: 'browser' | 'piper' | 'mms-tts' | 'espeak-ng' | 'gemini-tts' | 'none';
  voice?: string;
}

/** État de disponibilité du serveur IA local sur le réseau (Niamey). */
export interface LocalServerStatus {
  reachable: boolean;
  baseUrl?: string;
  latencyMs?: number;
  stt: boolean;
  tts: boolean;
  llm: boolean;
  models?: { stt?: string; tts?: Record<string, string>; llm?: string };
  checkedAt?: number;
}
