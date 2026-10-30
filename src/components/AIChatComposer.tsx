import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Square } from 'lucide-react';
import type { AILanguage } from '../lib/aiAssistant';

interface AIChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isTyping: boolean;
  onStop: () => void;
  language: AILanguage;
  compact?: boolean;
  autoFocus?: boolean;
  suggestions?: string[];
  onSuggestion?: (suggestion: string) => void;
}

const MAX_LENGTH = 2000;

export const AIChatComposer: React.FC<AIChatComposerProps> = ({
  value,
  onChange,
  onSend,
  isTyping,
  onStop,
  language,
  compact = false,
  autoFocus = false,
  suggestions = [],
  onSuggestion,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const composingRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const isEnglish = language === 'en';

  useEffect(() => {
    setSpeechSupported(Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    return () => recognitionRef.current?.stop?.();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = compact ? 104 : 148;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, compact]);

  useEffect(() => {
    if (!autoFocus) return;
    if (window.matchMedia('(pointer: fine)').matches) {
      const timeout = window.setTimeout(() => textareaRef.current?.focus(), 120);
      return () => window.clearTimeout(timeout);
    }
  }, [autoFocus]);

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isEnglish ? 'en-US' : 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) onChange((value ? `${value} ${transcript}` : transcript).slice(0, MAX_LENGTH));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const submit = () => {
    if (isListening) stopListening();
    onSend();
  };

  return (
    <div>
      {suggestions.length > 0 && !isTyping && (
        <div
          className="mb-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={isEnglish ? 'Suggested questions' : 'Questions suggérées'}
        >
          {suggestions.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestion?.(suggestion)}
              className="inline-flex min-h-[36px] max-w-[17rem] shrink-0 items-center truncate rounded-full border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-2xs transition-all hover:border-[#D4AF37] hover:text-[#01184C] active:scale-95 dark:border-[#1A3875]/70 dark:bg-[#0B214E]/80 dark:text-slate-200 dark:hover:text-white"
              title={suggestion}
            >
              <span className="truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={`flex items-end gap-1.5 rounded-2xl border transition-all focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 ${
          compact
            ? 'border-slate-300 bg-white p-1.5 dark:border-[#1B3B7E] dark:bg-[#091E47]'
            : 'border-slate-300 bg-slate-100 p-1.5 shadow-inner dark:border-[#1A3875]/70 dark:bg-[#091E47]'
        }`}
      >
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isTyping}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40 ${
              isListening
                ? 'animate-pulse bg-rose-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-200 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
            }`}
            aria-label={
              isListening
                ? isEnglish
                  ? 'Stop voice dictation'
                  : 'Arrêter la dictée vocale'
                : isEnglish
                  ? 'Dictate your message'
                  : 'Dicter votre message'
            }
            title={isListening ? (isEnglish ? 'Stop recording' : 'Arrêter l’enregistrement') : isEnglish ? 'Voice dictation' : 'Dictée vocale'}
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>
        )}

        <label className="sr-only" htmlFor={compact ? 'ai-floating-message' : 'ai-page-message'}>
          {isEnglish ? 'Your message to the Virtual Advisor' : 'Votre message au Conseiller Virtuel'}
        </label>
        <textarea
          ref={textareaRef}
          id={compact ? 'ai-floating-message' : 'ai-page-message'}
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, MAX_LENGTH))}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !composingRef.current) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder={
            isListening
              ? isEnglish
                ? 'Listening…'
                : 'À votre écoute…'
              : isEnglish
                ? 'Ask about services, quotes, sectors…'
                : 'Posez votre question (services, devis, secteurs)…'
          }
          className={`min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-snug text-[#0E1D38] outline-none placeholder:text-slate-400 dark:text-white sm:text-sm ${
            compact ? 'max-h-[104px]' : 'max-h-[148px]'
          }`}
          aria-describedby={value.length > 1600 ? 'ai-message-counter' : undefined}
        />

        {isTyping ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-500 active:scale-95"
            aria-label={isEnglish ? 'Stop the reply' : 'Arrêter la réponse'}
            title={isEnglish ? 'Stop' : 'Arrêter'}
          >
            <Square className="h-4 w-4 fill-current" />
            {!compact && <span className="hidden sm:inline">{isEnglish ? 'Stop' : 'Arrêter'}</span>}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            className={`flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] font-bold text-[#01184C] shadow-sm transition-all hover:bg-[#E5C358] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
              compact ? 'w-11 px-0' : 'min-w-11 px-3 sm:px-4 text-sm'
            }`}
            aria-label={isEnglish ? 'Send the message' : 'Envoyer le message'}
            title={isEnglish ? 'Send' : 'Envoyer'}
          >
            {!compact && <span className="hidden sm:inline">{isEnglish ? 'Send' : 'Envoyer'}</span>}
            <Send className="h-4 w-4" />
          </button>
        )}
      </form>

      {value.length > 1600 && (
        <div id="ai-message-counter" className="mt-1 text-right text-[11px] text-slate-500 dark:text-slate-400">
          {value.length}/{MAX_LENGTH}
        </div>
      )}
    </div>
  );
};
