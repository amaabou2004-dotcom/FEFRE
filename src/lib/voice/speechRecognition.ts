import { LANGUAGE_META, getLanguageMeta } from './languages';
import type { VoiceLanguage } from './types';

/**
 * ISA — Reconnaissance vocale du navigateur (Web Speech API)
 * ==========================================================
 * Rapide et gratuite pour le français (et l'anglais). En revanche :
 *   • le zarma n'est pas couvert par les navigateurs,
 *   • le haoussa n'est couvert que sur certains Chrome/Android,
 *   • Chrome envoie l'audio aux serveurs Google (donc nécessite Internet).
 *
 * Pour le zarma, le haoussa et tout usage hors-ligne, ISA bascule sur
 * l'enregistreur WAV + `faster-whisper` du serveur local (`voice-ai/`).
 */

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export function isBrowserRecognitionAvailable(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

/** Le navigateur peut-il réellement transcrire cette langue ? */
export function browserRecognitionSupport(language: VoiceLanguage): 'native' | 'partial' | 'none' {
  if (!isBrowserRecognitionAvailable()) return 'none';
  return getLanguageMeta(language).browserSttSupport;
}

export interface RecognitionHandlers {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (code: string, message: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
  onLevel?: (level: number) => void;
}

export class BrowserRecognizer {
  private recognition: SpeechRecognitionLike | null = null;
  private handlers: RecognitionHandlers | null = null;
  private analyser: AnalyserNode | null = null;
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private levelTimer: number | null = null;
  private finalText = '';
  private active = false;

  get isActive(): boolean {
    return this.active;
  }

  async start(language: VoiceLanguage, handlers: RecognitionHandlers): Promise<boolean> {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      handlers.onError?.('unsupported', 'Web Speech API indisponible sur ce navigateur.');
      return false;
    }
    if (this.active) this.stop();

    this.handlers = handlers;
    this.finalText = '';
    this.active = true;

    const recognition = new Ctor();
    recognition.lang = LANGUAGE_META[language]?.bcp47 || 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      handlers.onStart?.();
      void this.startLevelMeter(handlers.onLevel);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = String(result[0]?.transcript || '');
        if (result.isFinal) finalChunk += transcript;
        else interim += transcript;
      }
      if (finalChunk) {
        this.finalText = `${this.finalText} ${finalChunk}`.trim();
        handlers.onResult(this.finalText, true);
      } else if (interim) {
        handlers.onResult(`${this.finalText} ${interim}`.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      const code = String(event?.error || 'unknown');
      handlers.onError?.(code, this.describeError(code, language));
      this.active = false;
      this.stopLevelMeter();
    };

    recognition.onend = () => {
      this.active = false;
      this.stopLevelMeter();
      handlers.onEnd?.();
    };

    this.recognition = recognition;
    try {
      recognition.start();
      return true;
    } catch (error) {
      this.active = false;
      handlers.onError?.('start-failed', String((error as Error)?.message || error));
      return false;
    }
  }

  stop(): string {
    const text = this.finalText;
    this.active = false;
    try {
      this.recognition?.stop();
    } catch {
      /* noop */
    }
    this.stopLevelMeter();
    this.recognition = null;
    return text;
  }

  cancel(): void {
    this.active = false;
    try {
      this.recognition?.abort();
    } catch {
      /* noop */
    }
    this.stopLevelMeter();
    this.recognition = null;
    this.finalText = '';
  }

  private describeError(code: string, language: VoiceLanguage): string {
    if (code === 'not-allowed' || code === 'service-not-allowed') return uiError(language, 'mic-denied');
    if (code === 'no-speech') return uiError(language, 'no-speech');
    if (code === 'network') {
      return language === 'ha'
        ? 'Matsalar hanyar sadarwa. Sabar cikin gida za ta iya aiki ba tare da intanet ba.'
        : language === 'dje'
          ? 'Interneti firka. Niamey ordinater ga hin ma goy interneti si no.'
          : 'Erreur réseau : la reconnaissance du navigateur exige Internet. Le serveur local ISA fonctionne sans.';
    }
    if (code === 'language-not-supported') {
      return language === 'dje' || language === 'ha'
        ? 'Ce navigateur ne transcrit pas cette langue : utilisez le serveur local ISA (Whisper).'
        : 'Langue non prise en charge par ce navigateur.';
    }
    if (code === 'audio-capture') return uiError(language, 'mic-denied');
    return uiError(language, 'generic');
  }

  private async startLevelMeter(onLevel?: (level: number) => void): Promise<void> {
    if (!onLevel || typeof AudioContext === 'undefined') return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new Ctx();
      const source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.levelTimer = window.setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i += 1) {
          const deviation = Math.abs(data[i] - 128) / 128;
          if (deviation > peak) peak = deviation;
        }
        onLevel(Math.min(1, peak * 2.2));
      }, 90);
    } catch {
      /* le niveau sonore est décoratif : on ignore l'échec */
    }
  }

  private stopLevelMeter(): void {
    if (this.levelTimer) window.clearInterval(this.levelTimer);
    this.levelTimer = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    try {
      void this.context?.close().catch(() => undefined);
    } catch {
      /* noop */
    }
    this.context = null;
    this.analyser = null;
  }
}

function uiError(language: VoiceLanguage, kind: 'mic-denied' | 'no-speech' | 'generic'): string {
  if (kind === 'mic-denied') {
    if (language === 'ha') return 'Ba a ba da izinin mikrofo ba. Ka ba da izini a cikin brawza.';
    if (language === 'dje') return 'Mikoro si faaba. Ma mikoro ne cere.';
    return 'Accès au micro refusé. Autorisez le micro dans votre navigateur.';
  }
  if (kind === 'no-speech') {
    if (language === 'ha') return 'Ban ji komai ba. Ka sake gwadawa kusa da mikrofo.';
    if (language === 'dje') return 'Ay mana hã fo. Ma sanni ka kay mikoro se.';
    return "Je n'ai rien entendu. Réessayez plus près du micro.";
  }
  if (language === 'ha') return 'An sami kuskure. Ka sake gwadawa.';
  if (language === 'dje') return 'Firka fo te. Ma koyne cebe.';
  return 'Une erreur est survenue. Réessayez.';
}
