import { BrowserRecognizer, isBrowserRecognitionAvailable } from './speechRecognition';
import { normalizeUtterance } from './intents';
import type { VoiceLanguage } from './types';

/**
 * ISA — Mot de réveil (« Isa ! »)
 * ===============================
 * Objectif Siri : l'assistant peut rester en veille et se réveiller à la voix,
 * sans appuyer sur un bouton.
 *
 * Implémentation volontairement sobre et économe en batterie :
 *   • En français/anglais : reconnaissance continue du navigateur, filtrée sur
 *     les mots-clés « isa », « isa isa », « hé isa », « ok isa ».
 *   • En zarma/haoussa : le navigateur ne transcrit pas ces langues, donc la
 *     veille « mains libres » passe par le serveur local (`voice-ai/`) qui fait
 *     tourner Whisper en boucle courte ; ce module expose alors le crochet
 *     `onWakeWord` alimenté par `/ws` (voir la documentation du serveur).
 *   • La veille s'arrête automatiquement dès que l'onglet passe en
 *     arrière-plan, pour préserver la batterie du téléphone.
 */

const WAKE_WORDS = [
  'isa',
  'isa isa',
  'hey isa',
  'ok isa',
  'he isa',
  'issa',
  'yisa',
  'isa faaba',
];

/** Délai de ré-écoute après un cycle de reconnaissance (ms). */
const RESTART_DELAY_MS = 350;

export interface WakeWordHandlers {
  onWakeWord: (matched: string) => void;
  onError?: (message: string) => void;
  onStateChange?: (listening: boolean) => void;
}

export class WakeWordListener {
  private recognizer: BrowserRecognizer | null = null;
  private handlers: WakeWordHandlers | null = null;
  private running = false;
  private restartTimer: number | null = null;
  private language: VoiceLanguage = 'fr';
  private visibilityHandler: (() => void) | null = null;
  private lastTrigger = 0;

  get isActive(): boolean {
    return this.running;
  }

  /** Démarre la veille vocale. Retourne `false` si le navigateur ne le permet pas. */
  start(language: VoiceLanguage, handlers: WakeWordHandlers): boolean {
    if (this.running) return true;
    if (!isBrowserRecognitionAvailable()) {
      handlers.onError?.('WAKE_WORD_UNSUPPORTED');
      return false;
    }
    this.handlers = handlers;
    this.language = language;
    this.running = true;

    this.visibilityHandler = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden) this.pause();
      else if (this.running) this.resume();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.listen();
    return true;
  }

  private listen(): void {
    if (!this.running || !this.handlers) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    this.recognizer = new BrowserRecognizer();
    void this.recognizer.start(this.language, {
      onResult: (text) => {
        const matched = this.matchWakeWord(text);
        if (!matched) return;
        // Anti-rebond : deux déclenchements à moins de 1,5 s = un seul.
        if (Date.now() - this.lastTrigger < 1500) return;
        this.lastTrigger = Date.now();
        this.handlers?.onWakeWord(matched);
      },
      onError: (code) => {
        // « no-speech » est normal en veille : on relance sans prévenir.
        if (code !== 'no-speech' && code !== 'aborted') {
          this.handlers?.onError?.(code);
        }
      },
      onEnd: () => {
        if (!this.running) return;
        this.handlers?.onStateChange?.(false);
        if (this.restartTimer) window.clearTimeout(this.restartTimer);
        this.restartTimer = window.setTimeout(() => this.listen(), RESTART_DELAY_MS);
      },
      onStart: () => this.handlers?.onStateChange?.(true),
    });
  }

  private matchWakeWord(text: string): string | undefined {
    const normalized = ` ${normalizeUtterance(text)} `;
    return WAKE_WORDS.find((word) => normalized.includes(` ${word} `));
  }

  pause(): void {
    if (this.restartTimer) window.clearTimeout(this.restartTimer);
    this.restartTimer = null;
    try {
      this.recognizer?.cancel();
    } catch {
      /* noop */
    }
    this.handlers?.onStateChange?.(false);
  }

  resume(): void {
    if (!this.running) return;
    this.pause();
    this.listen();
  }

  stop(): void {
    this.running = false;
    this.pause();
    this.recognizer = null;
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.visibilityHandler = null;
    this.handlers = null;
  }
}

/** Le mot de réveil est-il utilisable sur cet appareil, dans cette langue ? */
export function isWakeWordAvailable(language: VoiceLanguage): boolean {
  if (!isBrowserRecognitionAvailable()) return false;
  // Le navigateur ne transcrit ni le zarma ni (fiablement) le haoussa :
  // la veille mains libres nécessite alors le serveur local.
  return language === 'fr' || language === 'en';
}
