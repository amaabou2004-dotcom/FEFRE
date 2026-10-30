import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSiteData } from './DataContext';
import { useLanguage } from '../hooks/useLanguage';
import { useRouter } from './router';
import {
  buildAISiteContext,
  getAISuggestions,
  type AIIntent,
  type AILanguage,
  type AISurface,
} from './aiAssistant';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  intent?: AIIntent;
  status?: 'complete' | 'error';
  retryText?: string;
  source?: 'knowledge' | 'ai' | 'fallback' | 'system';
}

interface AIChatContextValue {
  messages: AIChatMessage[];
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isTyping: boolean;
  suggestions: string[];
  language: AILanguage;
  hasUserMessages: boolean;
  sendMessage: (text: string | undefined, surface: AISurface) => Promise<void>;
  retryMessage: (messageId: string, surface: AISurface) => Promise<void>;
  stopGenerating: () => void;
  resetChat: () => void;
}

const AIChatContext = createContext<AIChatContextValue | null>(null);
const STORAGE_KEY = 'excellence-ai-chat-v3';
const REQUEST_TIMEOUT_MS = 35000;
const MAX_MESSAGE_LENGTH = 2000;

function formatTime(language: AILanguage): string {
  return new Date().toLocaleTimeString(language === 'en' ? 'en-GB' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createWelcomeMessage(language: AILanguage): AIChatMessage {
  return {
    id: 'welcome',
    sender: 'bot',
    text:
      language === 'en'
        ? 'Hello and welcome to **Excellence Services SARL**.\n\nI answer from the information published on this website: services, sectors, projects, quotes and contact details. If information is not published, I will say so clearly instead of inventing it.\n\nWhat would you like to know?'
        : "Bonjour et bienvenue chez **Excellence Services SARL**.\n\nJe réponds à partir des informations publiées sur ce site : services, secteurs, réalisations, devis et coordonnées. Si une information n’est pas publiée, je vous l’indiquerai clairement au lieu de l’inventer.\n\nQue souhaitez-vous savoir ?",
    timestamp: formatTime(language),
    status: 'complete',
    source: 'system',
  };
}

function initialSuggestions(language: AILanguage): string[] {
  return language === 'en'
    ? ['What services do you offer?', 'How can I request a quote?', 'Which sectors do you support?', 'What are your official contact details?']
    : ['Quels sont vos services ?', 'Comment obtenir un devis ?', 'Quels secteurs accompagnez-vous ?', 'Quelles sont vos coordonnées officielles ?'];
}

function loadStoredMessages(language: AILanguage): AIChatMessage[] {
  if (typeof window === 'undefined') return [createWelcomeMessage(language)];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [createWelcomeMessage(language)];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [createWelcomeMessage(language)];
    const valid: AIChatMessage[] = parsed
      .filter((message: any) => message && (message.sender === 'user' || message.sender === 'bot') && typeof message.text === 'string')
      .map((message: any) => ({
        id: String(message.id || createId(message.sender)),
        sender: message.sender as 'user' | 'bot',
        text: String(message.text).slice(0, 7000),
        timestamp: String(message.timestamp || formatTime(language)),
        intent: message.intent,
        status: message.status === 'error' ? ('error' as const) : ('complete' as const),
        retryText: typeof message.retryText === 'string' ? message.retryText : undefined,
        source: message.source,
      }))
      .slice(-60);
    return valid.length ? valid : [createWelcomeMessage(language)];
  } catch {
    return [createWelcomeMessage(language)];
  }
}

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useSiteData();
  const { settings, services, sectors, faqs, pages, partners, projects, articles } = data;
  const { isEnglish } = useLanguage();
  const { currentPath } = useRouter();
  const language: AILanguage = isEnglish ? 'en' : 'fr';

  const [messages, setMessagesState] = useState<AIChatMessage[]>(() => loadStoredMessages(language));
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() => initialSuggestions(language));

  const messagesRef = useRef(messages);
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<'timeout' | 'stop' | 'reset' | ''>('');
  const requestIdRef = useRef(0);

  const updateMessages = useCallback((updater: (current: AIChatMessage[]) => AIChatMessage[]) => {
    const next = updater(messagesRef.current).slice(-80);
    messagesRef.current = next;
    setMessagesState(next);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {
      // Session storage may be unavailable in private browsing; chat still works in memory.
    }
  }, [messages]);

  useEffect(() => {
    const current = messagesRef.current;
    const isPristineWelcome = current.length === 1 && current[0].id === 'welcome' && current[0].sender === 'bot';
    if (isPristineWelcome) {
      updateMessages(() => [createWelcomeMessage(language)]);
      setSuggestions(initialSuggestions(language));
    }
  }, [language, updateMessages]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
    },
    [],
  );

  const siteContext = useMemo(
    () =>
      buildAISiteContext(
        { settings, services, sectors, faqs, pages, partners, projects, articles },
        currentPath,
      ),
    [settings, services, sectors, faqs, pages, partners, projects, articles, currentPath],
  );

  const performRequest = useCallback(
    async (
      text: string,
      surface: AISurface,
      options: { historyBase: AIChatMessage[]; appendUser: boolean },
    ) => {
      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      abortReasonRef.current = '';

      const timeoutId = window.setTimeout(() => {
        abortReasonRef.current = 'timeout';
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      if (options.appendUser) {
        updateMessages((current) => [
          ...current,
          {
            id: createId('user'),
            sender: 'user',
            text,
            timestamp: formatTime(language),
            status: 'complete',
          },
        ]);
      }

      setIsTyping(true);
      setSuggestions([]);

      const history = options.historyBase
        .filter((message) => message.id !== 'welcome' && message.status !== 'error')
        .slice(-10)
        .map((message) => ({ sender: message.sender, text: message.text }));

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history,
            language,
            surface,
            siteContext,
          }),
          signal: controller.signal,
        });

        const rawBody = await response.text();
        let responseData: any = {};
        try {
          responseData = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          throw new Error(language === 'en' ? 'Invalid server response.' : 'Réponse du serveur illisible.');
        }

        if (requestId !== requestIdRef.current) return;
        if (!response.ok || typeof responseData.reply !== 'string' || !responseData.reply.trim()) {
          throw new Error(responseData.error || (language === 'en' ? 'The advisor is temporarily unavailable.' : 'Le conseiller est temporairement indisponible.'));
        }

        updateMessages((current) => [
          ...current,
          {
            id: createId('bot'),
            sender: 'bot',
            text: responseData.reply.trim(),
            timestamp: formatTime(language),
            intent: responseData.intent,
            status: 'complete',
            source: responseData.source === 'ai' || responseData.source === 'knowledge' || responseData.source === 'fallback' ? responseData.source : undefined,
          },
        ]);

        const nextSuggestions = Array.isArray(responseData.suggestions)
          ? responseData.suggestions.filter((item: unknown) => typeof item === 'string').slice(0, 3)
          : getAISuggestions('general', language, siteContext);
        setSuggestions(nextSuggestions);
      } catch (error: any) {
        const abortReason = abortReasonRef.current as 'timeout' | 'stop' | 'reset' | '';
        if (requestId !== requestIdRef.current || abortReason === 'reset') return;

        const phone = settings.phones[0]?.number || settings.whatsapp;
        let errorText: string;
        if (abortReason === 'stop') {
          errorText =
            language === 'en'
              ? 'The response was stopped. You can retry or rephrase your question.'
              : 'La réponse a été interrompue. Vous pouvez réessayer ou reformuler votre question.';
        } else if (abortReason === 'timeout') {
          errorText =
            language === 'en'
              ? `The response is taking too long. Please retry, or contact an advisor at ${phone}.`
              : `La réponse prend trop de temps. Veuillez réessayer ou contacter un conseiller au ${phone}.`;
        } else if (error?.message && !/failed to fetch|networkerror/i.test(String(error.message))) {
          errorText = String(error.message);
        } else {
          errorText =
            language === 'en'
              ? `I could not reach the advisor service. Check your connection and retry, or contact the team at ${phone}.`
              : `Je n’ai pas pu joindre le service du conseiller. Vérifiez votre connexion puis réessayez, ou contactez l’équipe au ${phone}.`;
        }

        updateMessages((current) => [
          ...current,
          {
            id: createId('error'),
            sender: 'bot',
            text: errorText,
            timestamp: formatTime(language),
            status: 'error',
            retryText: text,
            source: 'system',
          },
        ]);
        setSuggestions(initialSuggestions(language).slice(0, 3));
      } finally {
        window.clearTimeout(timeoutId);
        if (requestId === requestIdRef.current) {
          setIsTyping(false);
          abortControllerRef.current = null;
          abortReasonRef.current = '';
        }
      }
    },
    [language, settings.phones, settings.whatsapp, siteContext, updateMessages],
  );

  const sendMessage = useCallback(
    async (rawText: string | undefined, surface: AISurface) => {
      const text = (rawText ?? inputMessage).trim();
      if (!text || isTyping) return;

      if (text.length > MAX_MESSAGE_LENGTH) {
        updateMessages((current) => [
          ...current,
          {
            id: createId('error'),
            sender: 'bot',
            text:
              language === 'en'
                ? `Your message exceeds ${MAX_MESSAGE_LENGTH} characters. Please shorten it before sending.`
                : `Votre message dépasse ${MAX_MESSAGE_LENGTH} caractères. Merci de le raccourcir avant l’envoi.`,
            timestamp: formatTime(language),
            status: 'error',
            source: 'system',
          },
        ]);
        return;
      }

      const historyBase = messagesRef.current;
      setInputMessage('');
      await performRequest(text, surface, { historyBase, appendUser: true });
    },
    [inputMessage, isTyping, language, performRequest, updateMessages],
  );

  const retryMessage = useCallback(
    async (messageId: string, surface: AISurface) => {
      if (isTyping) return;
      const current = messagesRef.current;
      const errorIndex = current.findIndex((message) => message.id === messageId && message.status === 'error');
      if (errorIndex < 0) return;
      const retryText = current[errorIndex].retryText;
      if (!retryText) return;

      let previousUserIndex = -1;
      for (let index = errorIndex - 1; index >= 0; index -= 1) {
        if (current[index].sender === 'user') {
          previousUserIndex = index;
          break;
        }
      }

      const withoutError = current.filter((message) => message.id !== messageId);
      updateMessages(() => withoutError);
      const historyBase = previousUserIndex >= 0 ? current.slice(0, previousUserIndex) : withoutError;
      await performRequest(retryText, surface, {
        historyBase,
        appendUser: previousUserIndex < 0,
      });
    },
    [isTyping, performRequest, updateMessages],
  );

  const stopGenerating = useCallback(() => {
    if (!abortControllerRef.current) return;
    abortReasonRef.current = 'stop';
    abortControllerRef.current.abort();
  }, []);

  const resetChat = useCallback(() => {
    requestIdRef.current += 1;
    abortReasonRef.current = 'reset';
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTyping(false);
    setInputMessage('');
    setSuggestions(initialSuggestions(language));
    updateMessages(() => [createWelcomeMessage(language)]);
  }, [language, updateMessages]);

  const value = useMemo<AIChatContextValue>(
    () => ({
      messages,
      inputMessage,
      setInputMessage,
      isTyping,
      suggestions,
      language,
      hasUserMessages: messages.some((message) => message.sender === 'user'),
      sendMessage,
      retryMessage,
      stopGenerating,
      resetChat,
    }),
    [messages, inputMessage, isTyping, suggestions, language, sendMessage, retryMessage, stopGenerating, resetChat],
  );

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
};

export function useAIChat(): AIChatContextValue {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used inside AIChatProvider');
  }
  return context;
}
