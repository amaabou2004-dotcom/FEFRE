import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSiteData } from '../DataContext';
import { useLanguage } from '../../hooks/useLanguage';
import { useRouter } from '../router';
import { LANGUAGE_META, PRIMARY_VOICE_LANGUAGES, getLanguageMeta, ui } from './languages';
import { detectVoiceLanguage } from './intents';
import {
  getCurrentPosition,
  refreshLocalServer,
  speak,
  stopSpeaking,
  think,
  transcribeAudio,
} from './voiceClient';
import { BrowserRecognizer, browserRecognitionSupport } from './speechRecognition';
import { VoiceRecorder } from './audioRecorder';
import { WakeWordListener, isWakeWordAvailable } from './wakeWord';
import {
  addTask,
  ensureNotificationPermission,
  nextOccurrence,
  pendingTasks,
  startScheduler,
  describeTask,
  type ScheduledTask,
} from './scheduler';
import type {
  AssistantContext,
  AssistantTurn,
  LocalServerStatus,
  VoiceAction,
  VoiceLanguage,
} from './types';

/**
 * ISA — Fournisseur de contexte de l'assistant vocal
 * ==================================================
 * Machine à états façon Siri :
 *
 *   idle → listening → thinking → speaking → idle
 *
 * Il gère : la langue choisie, la position GPS (pour « près de moi »), l'état
 * du serveur local de Niamey, l'historique de conversation, l'exécution des
 * actions (appels, cartes, minuteurs, navigation dans le site) et le mot de
 * réveil.
 */

export type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  spoken?: string;
  language: VoiceLanguage;
  timestamp: string;
  actions?: VoiceAction[];
  cards?: AssistantTurn['cards'];
  suggestions?: string[];
  source?: AssistantTurn['source'];
  offline?: boolean;
  engine?: string;
}

interface VoiceAssistantContextValue {
  phase: VoicePhase;
  language: VoiceLanguage;
  setLanguage: (language: VoiceLanguage) => void;
  messages: VoiceMessage[];
  interimText: string;
  level: number;
  localServer: LocalServerStatus | null;
  position: { lat: number; lon: number; accuracy?: number } | null;
  autoSpeak: boolean;
  setAutoSpeak: (value: boolean) => void;
  wakeWordEnabled: boolean;
  setWakeWordEnabled: (value: boolean) => void;
  wakeWordAvailable: boolean;
  scheduled: ScheduledTask[];
  error: string | null;
  canUseBrowserRecognition: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancelListening: () => void;
  submitText: (text: string) => Promise<void>;
  processUtterance: (text: string) => Promise<void>;
  executeAction: (action: VoiceAction) => void;
  speakText: (text: string, language?: VoiceLanguage) => Promise<void>;
  stopSpeech: () => void;
  sharePosition: () => Promise<void>;
  refreshServer: () => Promise<void>;
  clearConversation: () => void;
  dismissError: () => void;
  uiText: (key: Parameters<typeof ui>[1]) => string;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

const HISTORY_KEY = 'isa-conversation-v1';
const LANGUAGE_KEY = 'isa-language';

function formatClock(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Niamey' });
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadHistory(language: VoiceLanguage): VoiceMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item: any) => item && typeof item.text === 'string')
      .slice(-40)
      .map((item: any) => ({
        id: String(item.id || makeId(item.role || 'msg')),
        role: item.role === 'user' ? 'user' : 'assistant',
        text: String(item.text).slice(0, 4000),
        spoken: item.spoken ? String(item.spoken).slice(0, 4000) : undefined,
        language: (item.language as VoiceLanguage) || language,
        timestamp: String(item.timestamp || formatClock()),
        actions: Array.isArray(item.actions) ? item.actions : undefined,
        cards: Array.isArray(item.cards) ? item.cards : undefined,
        suggestions: Array.isArray(item.suggestions) ? item.suggestions : undefined,
        source: item.source,
        offline: item.offline,
        engine: item.engine ? String(item.engine) : undefined,
      }));
  } catch {
    return [];
  }
}

function initialLanguage(): VoiceLanguage {
  if (typeof window === 'undefined') return 'fr';
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY) as VoiceLanguage | null;
    if (stored && LANGUAGE_META[stored]) return stored;
    const browser = String(navigator.language || '').toLowerCase();
    if (browser.startsWith('ha')) return 'ha';
    if (browser.startsWith('dje') || browser.startsWith('zar')) return 'dje';
    if (browser.startsWith('en')) return 'en';
  } catch {
    /* noop */
  }
  return 'fr';
}

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useSiteData();
  const { isEnglish } = useLanguage();
  const { navigate } = useRouter();

  const [language, setLanguageState] = useState<VoiceLanguage>(initialLanguage);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>(() => loadHistory(initialLanguage()));
  const [interimText, setInterimText] = useState('');
  const [level, setLevel] = useState(0);
  const [localServer, setLocalServer] = useState<LocalServerStatus | null>(null);
  const [position, setPosition] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabledState] = useState(false);
  const [scheduled, setScheduled] = useState<ScheduledTask[]>(() => (typeof window === 'undefined' ? [] : pendingTasks()));
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const recognizerRef = useRef<BrowserRecognizer | null>(null);
  const wakeRef = useRef<WakeWordListener | null>(null);
  const phaseRef = useRef<VoicePhase>('idle');
  const autoSpeakRef = useRef(true);
  const languageRef = useRef<VoiceLanguage>(language);
  const positionRef = useRef<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const busyRef = useRef(false);

  phaseRef.current = phase;
  autoSpeakRef.current = autoSpeak;
  languageRef.current = language;
  positionRef.current = position;

  const canUseBrowserRecognition = browserRecognitionSupport(language) !== 'none';

  /* ---------- persistance ---------- */

  useEffect(() => {
    try {
      window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* navigation privée : l'historique reste en mémoire */
    }
  }, [messages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
      if (typeof document !== 'undefined') document.documentElement.setAttribute('data-voice-lang', language);
    } catch {
      /* noop */
    }
  }, [language]);

  /* ---------- découverte du serveur local ---------- */

  const refreshServer = useCallback(async () => {
    const status = await refreshLocalServer();
    setLocalServer(status);
  }, []);

  useEffect(() => {
    void refreshServer();
    const interval = window.setInterval(() => void refreshServer(), 45000);
    return () => window.clearInterval(interval);
  }, [refreshServer]);

  /* ---------- minuteurs / alarmes / rappels ---------- */

  useEffect(() => {
    const stop = startScheduler(() => setScheduled(pendingTasks()));
    return stop;
  }, []);

  /* ---------- position GPS ---------- */

  const sharePosition = useCallback(async () => {
    const coords = await getCurrentPosition();
    if (coords) {
      setPosition(coords);
      positionRef.current = coords;
      void ensureNotificationPermission();
    } else {
      setError(ui(languageRef.current, 'sharePosition'));
    }
  }, []);

  /* ---------- parole ---------- */

  const speakText = useCallback(async (text: string, targetLanguage?: VoiceLanguage) => {
    if (!text.trim()) return;
    setPhase('speaking');
    try {
      await speak({ text, language: targetLanguage || languageRef.current });
    } catch {
      /* la voix est un confort : un échec ne bloque pas la réponse écrite */
    } finally {
      if (phaseRef.current === 'speaking') setPhase('idle');
    }
  }, []);

  const stopSpeech = useCallback(() => {
    stopSpeaking();
    if (phaseRef.current === 'speaking') setPhase('idle');
  }, []);

  /* ---------- exécution des actions ---------- */

  const executeAction = useCallback(
    (action: VoiceAction) => {
      switch (action.type) {
        case 'stop_speaking':
          stopSpeech();
          return;
        case 'navigate_site':
          navigate(action.path);
          return;
        case 'speak':
          void speakText(action.text, action.language);
          return;
        case 'open_map':
        case 'open_url': {
          if ('url' in action && action.url.startsWith('/api/')) return; // indice serveur, non exécutable
          if (action.type === 'open_url' && !action.external && action.url.startsWith('/')) {
            void fetch(action.url).catch(() => undefined);
            return;
          }
          window.open(action.url, '_blank', 'noopener,noreferrer');
          return;
        }
        case 'show_map':
        case 'show_weather':
        case 'show_list':
          return; // affiché par l'interface, pas d'effet de bord
        case 'navigate_to':
          window.open(action.url, '_blank', 'noopener,noreferrer');
          return;
        case 'call':
          window.location.href = `tel:${action.phoneNumber.replace(/[^\d+]/g, '')}`;
          return;
        case 'sms': {
          const body = action.body ? `?&body=${encodeURIComponent(action.body)}` : '';
          window.location.href = `sms:${action.phoneNumber.replace(/[^\d+]/g, '')}${body}`;
          return;
        }
        case 'whatsapp': {
          const digits = action.phoneNumber.replace(/\D/g, '');
          const normalized = digits.length === 8 ? `227${digits}` : digits;
          const query = action.body ? `?text=${encodeURIComponent(action.body)}` : '';
          window.open(`https://wa.me/${normalized}${query}`, '_blank', 'noopener,noreferrer');
          return;
        }
        case 'email': {
          const params = new URLSearchParams();
          if (action.subject) params.set('subject', action.subject);
          if (action.body) params.set('body', action.body);
          const query = params.toString();
          window.location.href = `mailto:${action.address}${query ? `?${query}` : ''}`;
          return;
        }
        case 'timer': {
          addTask({ kind: 'timer', fireAt: Date.now() + action.seconds * 1000, label: action.label, language: languageRef.current });
          setScheduled(pendingTasks());
          void ensureNotificationPermission();
          return;
        }
        case 'alarm': {
          addTask({
            kind: 'alarm',
            fireAt: nextOccurrence(action.clockTime),
            label: action.label || action.clockTime,
            language: languageRef.current,
          });
          setScheduled(pendingTasks());
          void ensureNotificationPermission();
          return;
        }
        case 'reminder': {
          const fireAt = action.clockTime
            ? nextOccurrence(action.clockTime)
            : Date.now() + (action.minutes || 30) * 60000;
          addTask({ kind: 'reminder', fireAt, label: action.text, language: languageRef.current });
          setScheduled(pendingTasks());
          void ensureNotificationPermission();
          return;
        }
        case 'copy': {
          void navigator.clipboard?.writeText(action.text).catch(() => undefined);
          return;
        }
        case 'request_permission': {
          if (action.permission === 'geolocation') void sharePosition();
          if (action.permission === 'notifications') void ensureNotificationPermission();
          return;
        }
        default:
          return;
      }
    },
    [navigate, sharePosition, speakText, stopSpeech],
  );

  /* ---------- envoi d'une phrase au cerveau ---------- */

  const pushMessage = useCallback((message: VoiceMessage) => {
    setMessages((current) => [...current, message].slice(-60));
  }, []);

  const buildContext = useCallback((): AssistantContext => {
    const settings = data?.settings;
    return {
      language: languageRef.current,
      position: positionRef.current || undefined,
      currentPage: typeof window === 'undefined' ? undefined : window.location.pathname,
      siteContext: settings
        ? {
            companyName: settings.name,
            location: settings.location,
            email: settings.email,
            whatsappRaw: settings.whatsappRaw,
            phones: settings.phones,
            workingHours: settings.workingHours,
          }
        : undefined,
      history: messages.slice(-6).map((item) => ({
        role: item.role === 'user' ? ('user' as const) : ('assistant' as const),
        text: item.text,
      })),
    };
  }, [data?.settings, messages]);

  const processUtterance = useCallback(
    async (text: string) => {
      const utterance = String(text || '').trim();
      if (!utterance || busyRef.current) return;
      busyRef.current = true;
      setError(null);

      const detected = detectVoiceLanguage(utterance, languageRef.current);
      if (detected !== languageRef.current && PRIMARY_VOICE_LANGUAGES.includes(detected)) {
        // ISA suit la langue réellement parlée (bilinguisme courant à Niamey).
        setLanguageState(detected);
        languageRef.current = detected;
      }

      pushMessage({
        id: makeId('user'),
        role: 'user',
        text: utterance,
        language: detected,
        timestamp: formatClock(),
      });

      setPhase('thinking');
      let turn: AssistantTurn;
      try {
        turn = await think(utterance, buildContext());
      } catch (err) {
        setPhase('error');
        setError(ui(languageRef.current, 'errorGeneric'));
        busyRef.current = false;
        return;
      }

      pushMessage({
        id: makeId('assistant'),
        role: 'assistant',
        text: turn.reply,
        spoken: turn.speak,
        language: turn.language,
        timestamp: formatClock(),
        actions: turn.actions,
        cards: turn.cards,
        suggestions: turn.suggestions,
        source: turn.source,
        offline: turn.offline,
      });

      // Actions exécutées automatiquement : voix, minuteurs, alarmes,
      // navigation interne. Les actions « ouvrant une app » (appel, WhatsApp,
      // Google Maps) restent des boutons : le navigateur exige un geste
      // utilisateur pour ces sauts.
      const autoActions = turn.actions.filter(
        (action) => action.type === 'timer' || action.type === 'alarm' || action.type === 'reminder' || action.type === 'navigate_site',
      );
      autoActions.forEach((action) => executeAction(action));

      busyRef.current = false;

      if (turn.speak && autoSpeakRef.current) {
        await speakText(turn.speak, turn.language);
      } else {
        setPhase('idle');
      }
    },
    [buildContext, executeAction, pushMessage, speakText],
  );

  /* ---------- écoute microphone ---------- */

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setLevel(0);
    if (!recorder) return;
    setPhase('transcribing');
    let audio;
    try {
      audio = await recorder.stop();
    } catch {
      setPhase('error');
      setError(ui(languageRef.current, 'errorGeneric'));
      return;
    }
    if (!audio || audio.blob.size < 800) {
      setPhase('idle');
      setError(ui(languageRef.current, 'noSpeech'));
      return;
    }
    try {
      const result = await transcribeAudio({ blob: audio.blob, language: languageRef.current, mimeType: audio.mimeType });
      if (!result.text) {
        setPhase('idle');
        setError(ui(languageRef.current, 'noSpeech'));
        return;
      }
      setInterimText('');
      await processUtterance(result.text);
    } catch {
      setPhase('error');
      setError(ui(languageRef.current, 'errorGeneric'));
    }
  }, [processUtterance]);

  const startListening = useCallback(async () => {
    setError(null);
    stopSpeaking();

    // Français / anglais : reconnaissance du navigateur (immédiate, gratuite).
    if (canUseBrowserRecognition && !localServer?.reachable) {
      const recognizer = new BrowserRecognizer();
      recognizerRef.current = recognizer;
      setPhase('listening');
      const started = await recognizer.start(languageRef.current, {
        onResult: (text, isFinal) => {
          setInterimText(text);
          if (isFinal && text.trim()) void processUtterance(text);
        },
        onError: (code, message) => {
          recognizerRef.current = null;
          setInterimText('');
          setLevel(0);
          setPhase('error');
          setError(message || ui(languageRef.current, 'errorGeneric'));
          if (code === 'not-allowed' || code === 'audio-capture') {
            void executeAction({ type: 'request_permission', permission: 'microphone' });
          }
        },
        onEnd: () => {
          recognizerRef.current = null;
          setLevel(0);
          if (phaseRef.current === 'listening') setPhase('idle');
        },
        onStart: () => setPhase('listening'),
        onLevel: (value) => setLevel(value),
      });
      if (!started) {
        setPhase('idle');
        setError(ui(languageRef.current, 'micDenied'));
      }
      return;
    }

    // Zarma / haoussa / serveur local disponible : enregistrement WAV puis
    // transcription par le serveur (Whisper), sans passer par le cloud.
    try {
      const recorder = recorderRef.current || new VoiceRecorder();
      recorderRef.current = recorder;
      setPhase('listening');
      await recorder.start((value) => setLevel(value));
    } catch (err) {
      setPhase('error');
      const code = (err as Error)?.message;
      setError(code === 'MICROPHONE_UNSUPPORTED' ? ui(languageRef.current, 'micDenied') : ui(languageRef.current, 'errorGeneric'));
    }
  }, [canUseBrowserRecognition, executeAction, localServer?.reachable, processUtterance]);

  const stopListening = useCallback(async () => {
    if (recognizerRef.current) {
      const text = recognizerRef.current.stop();
      recognizerRef.current = null;
      setLevel(0);
      setInterimText('');
      if (text.trim()) {
        await processUtterance(text);
        return;
      }
      setPhase('idle');
      return;
    }
    await finishRecording();
  }, [finishRecording, processUtterance]);

  const cancelListening = useCallback(() => {
    recognizerRef.current?.cancel();
    recognizerRef.current = null;
    recorderRef.current?.abort();
    recorderRef.current = null;
    setInterimText('');
    setLevel(0);
    setPhase('idle');
  }, []);

  /* ---------- mot de réveil ---------- */

  const wakeWordAvailable = isWakeWordAvailable(language) || Boolean(localServer?.reachable && localServer?.stt);

  const setWakeWordEnabled = useCallback(
    (value: boolean) => {
      if (!value) {
        wakeRef.current?.stop();
        wakeRef.current = null;
        setWakeWordEnabledState(false);
        return;
      }
      const listener = new WakeWordListener();
      const started = listener.start(languageRef.current, {
        onWakeWord: () => {
          listener.pause();
          void startListening();
        },
        onError: () => {
          setWakeWordEnabledState(false);
        },
      });
      if (!started) {
        setWakeWordEnabledState(false);
        setError(ui(languageRef.current, 'errorGeneric'));
        return;
      }
      wakeRef.current = listener;
      setWakeWordEnabledState(true);
    },
    [startListening],
  );

  useEffect(() => {
    return () => {
      wakeRef.current?.stop();
      wakeRef.current = null;
      recorderRef.current?.abort();
      recorderRef.current = null;
      stopSpeaking();
    };
  }, []);

  // La veille s'arrête quand l'utilisateur parle : évite l'auto-déclenchement.
  useEffect(() => {
    if (!wakeRef.current) return;
    if (phase === 'listening' || phase === 'thinking' || phase === 'speaking') wakeRef.current.pause();
    else if (wakeWordEnabled) wakeRef.current.resume();
  }, [phase, wakeWordEnabled]);

  const setLanguage = useCallback((next: VoiceLanguage) => {
    setLanguageState(next);
    languageRef.current = next;
    // Un changement de langue invalide la veille en cours.
    wakeRef.current?.stop();
    wakeRef.current = null;
    setWakeWordEnabledState(false);
  }, []);

  const submitText = useCallback(
    async (text: string) => {
      await processUtterance(text);
    },
    [processUtterance],
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    try {
      window.sessionStorage.removeItem(HISTORY_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const uiText = useCallback((key: Parameters<typeof ui>[1]) => ui(language, key), [language]);

  const value = useMemo<VoiceAssistantContextValue>(
    () => ({
      phase,
      language,
      setLanguage,
      messages,
      interimText,
      level,
      localServer,
      position,
      autoSpeak,
      setAutoSpeak,
      wakeWordEnabled,
      setWakeWordEnabled,
      wakeWordAvailable,
      scheduled,
      error,
      canUseBrowserRecognition,
      startListening,
      stopListening,
      cancelListening,
      submitText,
      processUtterance,
      executeAction,
      speakText,
      stopSpeech,
      sharePosition,
      refreshServer,
      clearConversation,
      dismissError: () => setError(null),
      uiText,
    }),
    [
      phase,
      language,
      setLanguage,
      messages,
      interimText,
      level,
      localServer,
      position,
      autoSpeak,
      wakeWordEnabled,
      setWakeWordEnabled,
      wakeWordAvailable,
      scheduled,
      error,
      canUseBrowserRecognition,
      startListening,
      stopListening,
      cancelListening,
      submitText,
      processUtterance,
      executeAction,
      speakText,
      stopSpeech,
      sharePosition,
      refreshServer,
      clearConversation,
      uiText,
    ],
  );

  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>;
};

export function useVoiceAssistant(): VoiceAssistantContextValue {
  const context = useContext(VoiceAssistantContext);
  if (!context) throw new Error('useVoiceAssistant doit être utilisé dans <VoiceAssistantProvider>');
  return context;
}

export { describeTask, getLanguageMeta };
