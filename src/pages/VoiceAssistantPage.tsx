import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CloudOff,
  Hand,
  Languages,
  Loader2,
  LocateFixed,
  MapPin,
  Mic,
  MicOff,
  Server,
  Settings2,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { VoiceAssistantProvider, useVoiceAssistant } from '../lib/voice/VoiceAssistantContext';
import { VoiceOrb } from '../components/voice/VoiceOrb';
import { VoiceActionButtons, VoiceCardView, VoiceSuggestions } from '../components/voice/VoiceActionCards';
import { PRIMARY_VOICE_LANGUAGES, getLanguageMeta } from '../lib/voice/languages';
import { describeTask } from '../lib/voice/scheduler';
import { useRouter } from '../lib/router';
import type { VoiceLanguage } from '../lib/voice/types';

/**
 * ISA — Page plein écran de l'assistant vocal
 * ===========================================
 * Route `/assistant-vocal` (alias `/vocal`, `/isa`).
 *
 * Ergonomie « Siri » : un orbe au centre, un état lisible (écoute / réflexion /
 * parole), le texte transcrit en direct, la réponse en gros caractères, puis
 * les boutons d'action (Google Maps, appel, SMS, WhatsApp, alarme…). Un champ
 * texte reste disponible pour les environnements bruyants ou quand le micro
 * n'est pas autorisé — indispensable dans un bus à Niamey.
 */

const EXAMPLE_COMMANDS: Record<VoiceLanguage, string[]> = {
  fr: [
    'Conduis-moi au Grand Marché de Niamey',
    'Où est la pharmacie la plus proche ?',
    'Quelle heure est-il ?',
    'Météo à Niamey',
    'Minuteur 10 minutes',
    'Alarme à 6h30',
    'Appelle le 17',
    'Combien de kilomètres jusqu’à Zinder ?',
    'Quels sont vos services ?',
  ],
  dje: [
    'Ma ay ne koy Grand Marché',
    'Mar no darzanka hayey nangu?',
    'Waati cendi?',
    'Niamey handu',
    'Minuti 10 waati',
    'Alarme suba 6:30',
    'Polisi telefon 17',
    'Zindi moora cendi?',
  ],
  ha: [
    'Kai ni Babbar Kasuwa',
    'Ina kantan magani mafi kusa?',
    'Ƙarfe nawa yanzu?',
    'Yanayin Niamey',
    'Naƙilar mintuna 10',
    'Agogo da 6:30',
    'Kira 17',
    'Yaya nisa zuwa Zinder?',
    'Me kuke yi?',
  ],
  en: [
    'Take me to the Grand Marché in Niamey',
    'Where is the nearest pharmacy?',
    'What time is it?',
    'Weather in Niamey',
    'Timer 10 minutes',
    'Alarm at 6:30',
    'Call 17',
    'How far is Zinder?',
  ],
};

const PhaseLabel: React.FC = () => {
  const { phase, uiText } = useVoiceAssistant();
  const text =
    phase === 'listening'
      ? uiText('listening')
      : phase === 'thinking'
        ? uiText('thinking')
        : phase === 'transcribing'
          ? uiText('thinking')
          : phase === 'speaking'
            ? uiText('speaking')
            : phase === 'error'
              ? uiText('errorGeneric')
              : uiText('tapToSpeak');
  return (
    <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#536582] dark:text-slate-300" aria-live="polite">
      {text}
    </p>
  );
};

const StatusBadge: React.FC = () => {
  const { localServer, uiText } = useVoiceAssistant();
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const state = localServer?.reachable
    ? { label: uiText('localServerBadge'), tone: 'emerald', Icon: Server }
    : online
      ? { label: uiText('cloudBadge'), tone: 'sky', Icon: Wifi }
      : { label: uiText('offlineBadge'), tone: 'amber', Icon: CloudOff };

  const toneClasses =
    state.tone === 'emerald'
      ? 'border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300'
      : state.tone === 'sky'
        ? 'border-sky-300/60 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300'
        : 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#8a6d10] dark:text-[#D4AF37]';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${toneClasses}`}>
      <state.Icon className="h-3.5 w-3.5" />
      {state.label}
      {localServer?.latencyMs ? <span className="font-mono text-[10px] opacity-70">{localServer.latencyMs} ms</span> : null}
    </span>
  );
};

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, uiText } = useVoiceAssistant();
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-2xs dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70">
      <Languages className="mx-1 h-3.5 w-3.5 text-[#536582] dark:text-slate-400" aria-label={uiText('language')} />
      {PRIMARY_VOICE_LANGUAGES.map((code) => {
        const meta = getLanguageMeta(code);
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={`min-h-[34px] rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all ${
              active
                ? 'bg-[#01184C] text-white shadow dark:bg-[#D4AF37] dark:text-[#01184C]'
                : 'text-[#536582] hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#122D68]'
            }`}
          >
            <span aria-hidden="true" className="mr-1">
              {meta.flag}
            </span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
};

const SettingsRow: React.FC = () => {
  const {
    autoSpeak,
    setAutoSpeak,
    wakeWordEnabled,
    setWakeWordEnabled,
    wakeWordAvailable,
    position,
    sharePosition,
    uiText,
    refreshServer,
    localServer,
  } = useVoiceAssistant();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleClass = (active: boolean) =>
    `inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all ${
      active
        ? 'border-emerald-300/70 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300'
        : 'border-slate-200 bg-white text-[#536582] hover:border-[#D4AF37]/60 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-300'
    }`;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => setAutoSpeak(!autoSpeak)} className={toggleClass(autoSpeak)} aria-pressed={autoSpeak}>
          {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {autoSpeak ? 'Voix' : 'Muet'}
        </button>
        <button
          type="button"
          onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
          className={toggleClass(wakeWordEnabled)}
          aria-pressed={wakeWordEnabled}
          disabled={!wakeWordAvailable}
          title={uiText('wakeWordOn')}
        >
          <Hand className="h-3.5 w-3.5" />
          {uiText('wakeWordOn')}
        </button>
        <button type="button" onClick={() => void sharePosition()} className={toggleClass(Boolean(position))}>
          <LocateFixed className="h-3.5 w-3.5" />
          {position ? uiText('positionShared') : uiText('sharePosition')}
        </button>
        <button type="button" onClick={() => setShowAdvanced((value) => !value)} className={toggleClass(showAdvanced)}>
          <Settings2 className="h-3.5 w-3.5" />
          Serveur local
        </button>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-auto mt-3 max-w-xl rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-[#536582] shadow-sm backdrop-blur dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[#0E1D38] dark:text-white">
                  {localServer?.reachable ? localServer.baseUrl : 'Aucun serveur local détecté'}
                </strong>
                <button
                  type="button"
                  onClick={() => void refreshServer()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 font-bold uppercase tracking-wide hover:border-[#D4AF37]/60 dark:border-[#1A3875]/60"
                >
                  <Loader2 className="h-3 w-3" /> Scanner
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                <li>Reconnaissance vocale (Whisper) : {localServer?.stt ? 'oui' : 'non'}</li>
                <li>Voix zarma / haoussa (MMS-TTS) : {localServer?.tts ? 'oui' : 'non'}</li>
                <li>Modèle de langage local (Ollama) : {localServer?.llm ? 'oui' : 'non'}</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                Pour activer le mode 100 % local, lancez le serveur <code className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-[#07193F]">voice-ai</code>{' '}
                sur un poste de Niamey (<code className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-[#07193F]">python -m uvicorn app.main:app --host 0.0.0.0 --port 8787</code>),
                puis ajoutez <code className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-[#07193F]">?isaServer=http://ADRESSE_IP:8787</code> à l’URL du site.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Conversation: React.FC = () => {
  const { messages, language, executeAction, submitText, uiText, phase } = useVoiceAssistant();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-center dark:border-[#1A3875]/60 dark:bg-[#0B214E]/40">
        <p className="text-sm font-semibold text-[#0E1D38] dark:text-white">{uiText('tryExamples')}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {EXAMPLE_COMMANDS[language].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void submitText(example)}
              disabled={phase === 'thinking' || phase === 'transcribing'}
              className="min-h-[36px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition-all hover:border-[#D4AF37]/60 hover:bg-slate-50 disabled:opacity-50 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-200 dark:hover:bg-[#122D68]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`rounded-2xl border px-4 py-3 shadow-sm ${
              isUser
                ? 'ml-auto max-w-[86%] border-[#01184C]/15 bg-[#01184C] text-white dark:border-[#D4AF37]/30 dark:bg-[#0B214E]'
                : 'mr-auto max-w-[94%] border-slate-200 bg-white text-[#0E1D38] dark:border-[#183B7A] dark:bg-[#0A1F4B] dark:text-white'
            }`}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-70">
              <span>{isUser ? uiText('you') : uiText('isa')}</span>
              <span aria-hidden="true">{getLanguageMeta(message.language).flag}</span>
              <span className="font-mono normal-case opacity-60">{message.timestamp}</span>
              {!isUser && message.offline && (
                <span className="rounded-full bg-[#D4AF37]/20 px-1.5 py-0.5 text-[9px] text-[#8a6d10] dark:text-[#D4AF37]">
                  {uiText('offlineBadge')}
                </span>
              )}
            </div>
            <p className={`mt-1 text-sm leading-relaxed ${isUser ? 'text-white' : ''}`}>{message.text}</p>

            {!isUser && message.cards?.length ? (
              <div className="mt-2 space-y-2">
                {message.cards.slice(0, 3).map((card, index) => (
                  <VoiceCardView key={`${message.id}-card-${index}`} card={card} language={message.language} onExecute={executeAction} />
                ))}
              </div>
            ) : null}

            {!isUser && message.actions?.length ? (
              <VoiceActionButtons actions={message.actions} language={message.language} onExecute={executeAction} />
            ) : null}

            {!isUser && message.suggestions?.length ? (
              <VoiceSuggestions suggestions={message.suggestions} onSelect={(text) => void submitText(text)} disabled={phase === 'thinking'} />
            ) : null}
          </motion.div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

const TextComposer: React.FC = () => {
  const { submitText, phase, uiText, language } = useVoiceAssistant();
  const [value, setValue] = useState('');
  const busy = phase === 'thinking' || phase === 'transcribing';

  const send = () => {
    const text = value.trim();
    if (!text) return;
    setValue('');
    void submitText(text);
  };

  const placeholder =
    language === 'ha'
      ? 'Rubuta bukatar ka… (misali: Kai ni Babbar Kasuwa)'
      : language === 'dje'
        ? 'Ni sanni hantum… (waalo: Ma ay ne koy Grand Marché)'
        : 'Écrivez votre demande… (ex. : Conduis-moi au Grand Marché)';

  return (
    <div className="flex w-full items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        aria-label={uiText('tapToSpeak')}
        className="min-h-[46px] w-full flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0E1D38] shadow-2xs outline-none transition-colors placeholder:text-slate-400 focus:border-[#D4AF37] dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-white"
        disabled={busy}
      />
      <button
        type="button"
        onClick={send}
        disabled={busy || !value.trim()}
        className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#01184C] shadow-md transition-all hover:bg-[#E5C358] disabled:opacity-40"
      >
        <Mic className="h-4 w-4" />
        OK
      </button>
    </div>
  );
};

const ScheduledList: React.FC = () => {
  const { scheduled, uiText } = useVoiceAssistant();
  if (!scheduled.length) return null;
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs shadow-sm dark:border-[#1A3875]/60 dark:bg-[#0B214E]/50">
      <p className="font-bold uppercase tracking-wider text-[#536582] dark:text-slate-300">
        {uiText('timerStarted')} · {scheduled.length}
      </p>
      <ul className="mt-1.5 space-y-1">
        {scheduled.slice(0, 4).map((task) => (
          <li key={task.id} className="flex items-center gap-2 text-[#0E1D38] dark:text-white">
            <MapPin className="h-3 w-3 text-[#D4AF37]" />
            <span className="truncate">{describeTask(task)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const VoiceWorkspace: React.FC = () => {
  const {
    phase,
    level,
    interimText,
    startListening,
    stopListening,
    cancelListening,
    uiText,
    language,
    error,
    dismissError,
    clearConversation,
    messages,
    canUseBrowserRecognition,
    localServer,
  } = useVoiceAssistant();
  const { navigate } = useRouter();

  const isListening = phase === 'listening';
  const isBusy = phase === 'thinking' || phase === 'transcribing';
  const needsServer = !canUseBrowserRecognition && !localServer?.reachable;

  const orbLabel = useMemo(() => {
    if (isListening) return uiText('stopSpeaking');
    if (isBusy) return uiText('thinking');
    return uiText('tapToSpeak');
  }, [isBusy, isListening, uiText]);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#F8FAFD] text-[#0E1D38] dark:bg-[#030F26] dark:text-white">
      {/* Décor de fond */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-[#2E6BFF]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#01184C]/10 blur-3xl dark:bg-[#0A2254]/40" />
      </div>

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-[#132C5E]/70 dark:bg-[#041029]/70 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0E1D38] transition-colors hover:border-[#D4AF37]/60 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {uiText('backToSite')}
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-black tracking-tight">{uiText('assistantName')}</p>
            <p className="text-[11px] text-[#536582] dark:text-slate-400">{uiText('tagline')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <StatusBadge />
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#536582] transition-colors hover:border-red-300 hover:text-red-600 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-300"
              aria-label={uiText('clearHistory')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <VoiceOrb
            phase={phase}
            level={level}
            size={typeof window !== 'undefined' && window.innerWidth < 640 ? 170 : 220}
            onClick={async () => {
              if (isListening) await stopListening();
              else await startListening();
            }}
            label={orbLabel}
          />
          <PhaseLabel />

          <p className="min-h-[24px] max-w-md text-center text-base font-semibold text-[#01184C] dark:text-white" aria-live="polite">
            {interimText || (isListening ? '…' : '')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {isBusy ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#536582] dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" /> {uiText('thinking')}
              </span>
            ) : isListening ? (
              <>
                <button
                  type="button"
                  onClick={() => void stopListening()}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl bg-[#D4AF37] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#01184C] shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Square className="h-4 w-4" /> {uiText('stopSpeaking')}
                </button>
                <button
                  type="button"
                  onClick={cancelListening}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#536582] dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-300"
                >
                  <MicOff className="h-4 w-4" /> Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void startListening()}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-[#01184C] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl transition-transform hover:scale-[1.02] dark:bg-[#D4AF37] dark:text-[#01184C]"
              >
                <Mic className="h-5 w-5" /> {uiText('tapToSpeak')}
              </button>
            )}
            {phase === 'speaking' && (
              <button
                type="button"
                onClick={() => cancelListening()}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#536582] dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-300"
              >
                <VolumeX className="h-4 w-4" /> {uiText('stopSpeaking')}
              </button>
            )}
          </div>

          {needsServer && (
            <p className="max-w-lg rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-center text-[11px] leading-relaxed text-[#8a6d10] dark:text-[#D4AF37]">
              {language === 'ha'
                ? 'Hausa da Zarma suna buƙatar sabar cikin gida (Whisper + MMS-TTS). Buɗe sabar voice-ai a Niamey.'
                : language === 'dje'
                  ? 'Zarma nda hausa ga ba Niamey ordinater (Whisper + MMS-TTS). Ma voice-ai tun.'
                  : 'Le zarma et le haoussa exigent le serveur local ISA (Whisper + MMS-TTS). Démarrez « voice-ai » sur un poste de Niamey, puis ajoutez ?isaServer=http://IP:8787 à cette URL.'}
            </p>
          )}

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="max-w-lg rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              >
                {error}{' '}
                <button type="button" onClick={dismissError} className="ml-1 underline">
                  OK
                </button>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <SettingsRow />
        <ScheduledList />
        <Conversation />

        <div className="w-full max-w-2xl pb-6">
          <TextComposer />
          <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-[#536582] dark:text-slate-500">{uiText('poweredBy')}</p>
        </div>
      </main>
    </div>
  );
};

export const VoiceAssistantPage: React.FC = () => (
  <VoiceAssistantProvider>
    <VoiceWorkspace />
  </VoiceAssistantProvider>
);

export default VoiceAssistantPage;
