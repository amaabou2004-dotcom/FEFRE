import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, Square, Volume2, X } from 'lucide-react';
import { VoiceAssistantProvider, useVoiceAssistant } from '../../lib/voice/VoiceAssistantContext';
import { VoiceOrb } from './VoiceOrb';
import { VoiceActionButtons, VoiceSuggestions } from './VoiceActionCards';
import { getLanguageMeta, ui } from '../../lib/voice/languages';
import { useRouter } from '../../lib/router';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * ISA — Bouton vocal flottant
 * ===========================
 * Disponible sur tout le site (comme le conseiller IA existant) : un petit orbe
 * en bas à droite qui ouvre une fenêtre « Siri ». On y parle, on lit la réponse
 * et on touche les boutons d'action (Google Maps, appel, WhatsApp, alarme…).
 *
 * Un lien « Plein écran » ouvre la page `/assistant-vocal` pour l'usage
 * mains libres (kiosque, téléphone posé sur le bureau).
 */

const FloatingPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    phase,
    level,
    interimText,
    messages,
    language,
    startListening,
    stopListening,
    executeAction,
    submitText,
    uiText,
    error,
    dismissError,
  } = useVoiceAssistant();
  const { navigate } = useRouter();
  const last = messages[messages.length - 1];
  const isListening = phase === 'listening';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 14 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      role="dialog"
      aria-label={ui(language, 'assistantName')}
      className="mb-3 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans shadow-2xl dark:border-[#183B7A] dark:bg-[#041029]"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#132C5E] dark:bg-[#06183E]">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#01184C] text-white dark:bg-[#D4AF37] dark:text-[#01184C]">
            <Mic className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-[#01184C] dark:text-white">{uiText('assistantName')} · {uiText('tagline')}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#536582] dark:text-slate-400">
              {getLanguageMeta(language).flag} {getLanguageMeta(language).nativeName} ·{' '}
              {phase === 'listening' ? uiText('listening') : phase === 'speaking' ? uiText('speaking') : uiText('idle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              navigate('/assistant-vocal');
              onClose();
            }}
            className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#536582] hover:border-[#D4AF37]/60 dark:border-[#1A3875]/60 dark:text-slate-300"
          >
            Plein écran
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#536582] hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-[#122D68]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-4 py-4">
        <VoiceOrb
          phase={phase}
          level={level}
          size={118}
          label={uiText('tapToSpeak')}
          onClick={async () => {
            if (isListening) await stopListening();
            else await startListening();
          }}
        />

        <p className="min-h-[20px] text-center text-sm font-semibold text-[#01184C] dark:text-white" aria-live="polite">
          {interimText || (isListening ? '…' : uiText('tapToSpeak'))}
        </p>

        {error && (
          <p className="w-full rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}{' '}
            <button type="button" onClick={dismissError} className="underline">
              OK
            </button>
          </p>
        )}

        {last && last.role === 'assistant' && (
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-[#132C5E] dark:bg-[#06183E]">
            <p className="text-[13px] leading-relaxed text-[#0E1D38] dark:text-white">{last.text}</p>
            {last.offline && (
              <span className="mt-1 inline-block rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8a6d10] dark:text-[#D4AF37]">
                {uiText('offlineBadge')}
              </span>
            )}
            <VoiceActionButtons actions={last.actions} language={last.language} onExecute={executeAction} compact />
            <VoiceSuggestions suggestions={last.suggestions} onSelect={(text) => void submitText(text)} disabled={phase === 'thinking'} />
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#132C5E] dark:bg-[#06183E]">
        <button
          type="button"
          onClick={async () => {
            if (isListening) await stopListening();
            else await startListening();
          }}
          className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
            isListening
              ? 'bg-[#D4AF37] text-[#01184C]'
              : 'bg-[#01184C] text-white hover:bg-[#0A2254] dark:bg-[#D4AF37] dark:text-[#01184C]'
          }`}
        >
          {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? uiText('stopSpeaking') : uiText('tapToSpeak')}
        </button>
        {phase === 'speaking' && (
          <button
            type="button"
            onClick={() => executeAction({ type: 'stop_speaking' })}
            aria-label={uiText('stopSpeaking')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-[#536582] dark:border-[#1A3875]/60 dark:text-slate-300"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        )}
      </footer>
    </motion.div>
  );
};

const FloatingVoiceInner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentPath } = useRouter();
  const { isEnglish } = useLanguage();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-isa-voice', handler);
    return () => window.removeEventListener('open-isa-voice', handler);
  }, []);

  // Pas de doublon sur la page plein écran ni dans l'admin.
  if (
    currentPath === '/assistant-vocal' ||
    currentPath === '/vocal' ||
    currentPath === '/isa' ||
    currentPath === '/assistant-ia' ||
    currentPath === '/ia' ||
    currentPath.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <VoiceAssistantProvider>
      <div className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+0.75rem)] right-4 z-[46] flex flex-col items-end sm:right-6 lg:bottom-5">
        <AnimatePresence>
          {isOpen && <FloatingPanel onClose={() => setIsOpen(false)} />}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isEnglish ? 'ISA voice assistant' : 'Assistant vocal ISA'}
          whileTap={{ scale: 0.94 }}
          className="group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#01184C] to-[#0A2254] text-[#D4AF37] shadow-2xl ring-1 ring-[#D4AF37]/40 transition-transform hover:scale-105 dark:from-[#D4AF37] dark:to-[#E5C358] dark:text-[#01184C]"
        >
          <Mic className="h-6 w-6" />
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#D4AF37]/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-emerald-400 dark:border-[#030F26]" />
        </motion.button>
      </div>
    </VoiceAssistantProvider>
  );
};

export const VoiceAssistantFloatingButton: React.FC = () => <FloatingVoiceInner />;

export default VoiceAssistantFloatingButton;
