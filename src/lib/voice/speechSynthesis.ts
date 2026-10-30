import { LANGUAGE_META, getLanguageMeta } from './languages';
import type { SynthesisResult, VoiceLanguage } from './types';

/**
 * ISA — Synthèse vocale (voix)
 * ============================
 * Trois niveaux, dans cet ordre :
 *
 *  1. `speechSynthesis` du navigateur : instantané, gratuit, hors-ligne.
 *     Couvre bien le français (et l'anglais) selon les voix installées.
 *  2. Voix locales du serveur de Niamey (`voice-ai/`) : Piper pour le
 *     français, Meta MMS-TTS pour le zarma (`mms_tts_dje`) et le haoussa
 *     (`mms_tts_hau`) — ces langues n'existent PAS dans les navigateurs.
 *  3. Gemini TTS en ligne (repli cloud, qualité maximale).
 *
 * Le client décide grâce à `canSpeakNatively()` : si le navigateur n'a aucune
 * voix pour la langue demandée, on appelle `/api/voice/tts`.
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

/** Liste les voix disponibles, en attendant que Chrome les charge (asynchrone). */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  try {
    return window.speechSynthesis.getVoices() || [];
  } catch {
    return [];
  }
}

let voicesLoaded = false;
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve([]);
  if (voicesLoaded) return Promise.resolve(getAvailableVoices());
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      voicesLoaded = true;
      resolve(getAvailableVoices());
    }, 1200);
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
      window.clearTimeout(timeout);
      resolve(getAvailableVoices());
    };
    // Certains navigateurs remplissent la liste immédiatement.
    const immediate = getAvailableVoices();
    if (immediate.length) {
      voicesLoaded = true;
      window.clearTimeout(timeout);
      resolve(immediate);
    }
  });
}

/** Trouve la meilleure voix du navigateur pour une langue ISA. */
export function pickBrowserVoice(language: VoiceLanguage): SpeechSynthesisVoice | undefined {
  const meta = getLanguageMeta(language);
  const voices = getAvailableVoices();
  if (!voices.length) return undefined;

  const wanted = [meta.bcp47.toLowerCase(), String(meta.bcp47).split('-')[0].toLowerCase()];
  const exact = voices.find((voice) => wanted.includes(String(voice.lang || '').toLowerCase()));
  if (exact) return exact;

  const prefix = voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith(`${wanted[1]}-`));
  if (prefix) return prefix;

  // Zarma / haoussa : repli sur le français seulement si la voix existe et que
  // le texte est court — sinon on préfère la voix MMS du serveur local.
  const fallbackLang = LANGUAGE_META[meta.fallback].bcp47.toLowerCase();
  return voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith(fallbackLang.split('-')[0]));
}

/** Le navigateur peut-il prononcer cette langue correctement ? */
export function canSpeakNatively(language: VoiceLanguage): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  const meta = getLanguageMeta(language);
  const voice = pickBrowserVoice(language);
  if (!voice) return false;
  const voiceLang = String(voice.lang || '').toLowerCase();
  return voiceLang.startsWith(meta.bcp47.split('-')[0].toLowerCase());
}

export interface SpeakOptions {
  language: VoiceLanguage;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceURI?: string;
  interrupt?: boolean;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Parle avec le moteur du navigateur. Résout à la fin de l'énoncé. */
export function speakWithBrowser(text: string, options: SpeakOptions): Promise<SynthesisResult> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported() || !text.trim()) {
      resolve({ spokenByBrowser: false, engine: 'none' });
      return;
    }
    try {
      if (options.interrupt !== false) window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_META[options.language]?.bcp47 || 'fr-FR';
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    const voice = options.voiceURI
      ? getAvailableVoices().find((item) => item.voiceURI === options.voiceURI)
      : pickBrowserVoice(options.language);
    if (voice) utterance.voice = voice;

    const finish = (spoken: boolean) => {
      currentUtterance = null;
      resolve({ spokenByBrowser: spoken, engine: spoken ? 'browser' : 'none', voice: voice?.name });
    };

    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    currentUtterance = utterance;

    // Chrome interrompt parfois les longues phrases : on relance le moteur.
    window.speechSynthesis.speak(utterance);
    const keepAlive = window.setInterval(() => {
      if (!currentUtterance) {
        window.clearInterval(keepAlive);
        return;
      }
      try {
        if (!window.speechSynthesis.speaking) window.clearInterval(keepAlive);
        else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch {
        window.clearInterval(keepAlive);
      }
    }, 8000);
  });
}

/** Stoppe immédiatement la voix du navigateur. */
export function stopBrowserSpeech(): void {
  currentUtterance = null;
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Lecture d'un audio renvoyé par un moteur serveur (Piper / MMS)      */
/* ------------------------------------------------------------------ */

let audioElement: HTMLAudioElement | null = null;
let audioUrl: string | null = null;

export function isServerAudioPlaying(): boolean {
  return Boolean(audioElement && !audioElement.paused && !audioElement.ended);
}

/**
 * Joue un audio encodé en base64 (WAV/MP3) produit par le serveur local ou
 * Gemini TTS. Résout quand la lecture se termine.
 */
export function playAudioBase64(base64: string, mimeType = 'audio/wav'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!base64) {
      resolve();
      return;
    }
    try {
      stopServerAudio();
      const bytes = base64ToBytes(base64);
      // Copie dans un ArrayBuffer garanti non partagé : les types DOM refusent
      // un Uint8Array adossé à un SharedArrayBuffer.
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const blob = new Blob([buffer], { type: mimeType });
      audioUrl = URL.createObjectURL(blob);
      audioElement = new Audio(audioUrl);
      audioElement.onended = () => {
        cleanupAudio();
        resolve();
      };
      audioElement.onerror = () => {
        cleanupAudio();
        reject(new Error('AUDIO_PLAYBACK_FAILED'));
      };
      void audioElement.play();
    } catch (error) {
      cleanupAudio();
      reject(error instanceof Error ? error : new Error('AUDIO_PLAYBACK_FAILED'));
    }
  });
}

/** Lit une URL audio distante (ex. `/api/voice/tts?text=…`). */
export async function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopServerAudio();
    audioUrl = url;
    audioElement = new Audio(url);
    audioElement.onended = () => {
      cleanupAudio();
      resolve();
    };
    audioElement.onerror = () => {
      cleanupAudio();
      reject(new Error('AUDIO_PLAYBACK_FAILED'));
    };
    void audioElement.play().catch((error) => {
      cleanupAudio();
      reject(error instanceof Error ? error : new Error('AUDIO_PLAYBACK_FAILED'));
    });
  });
}

export function stopServerAudio(): void {
  if (audioElement) {
    try {
      audioElement.pause();
      audioElement.currentTime = 0;
    } catch {
      /* noop */
    }
  }
  cleanupAudio();
}

function cleanupAudio(): void {
  audioElement = null;
  if (audioUrl) {
    try {
      if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    } catch {
      /* noop */
    }
    audioUrl = null;
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Node (tests serveur)
  return new Uint8Array(Buffer.from(clean, 'base64'));
}

/** Coupe toute parole (navigateur + serveur) : commande « tais-toi ». */
export function stopAllSpeech(): void {
  stopBrowserSpeech();
  stopServerAudio();
}
