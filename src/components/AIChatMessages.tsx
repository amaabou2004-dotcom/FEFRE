import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Sparkles, User } from 'lucide-react';
import { FormattedAIMessage } from './FormattedAIMessage';
import type { AIChatMessage } from '../lib/AIChatContext';
import type { AILanguage } from '../lib/aiAssistant';

interface AIChatMessagesProps {
  messages: AIChatMessage[];
  isTyping: boolean;
  language: AILanguage;
  compact?: boolean;
  header?: React.ReactNode;
  onRetry: (messageId: string) => void;
}

export const AIChatMessages: React.FC<AIChatMessagesProps> = ({
  messages,
  isTyping,
  language,
  compact = false,
  header,
  onRetry,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const firstRenderRef = useRef(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const isEnglish = language === 'en';

  const updateNearBottom = () => {
    const container = containerRef.current;
    if (!container) return;
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    nearBottomRef.current = distance < 120;
    if (nearBottomRef.current) setShowNewMessageButton(false);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    nearBottomRef.current = true;
    setShowNewMessageButton(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const lastMessage = messages[messages.length - 1];
      if (firstRenderRef.current) {
        scrollToBottom('auto');
        firstRenderRef.current = false;
        return;
      }
      if (nearBottomRef.current || lastMessage?.sender === 'user') {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        scrollToBottom(reduceMotion ? 'auto' : 'smooth');
      } else if (lastMessage?.sender === 'bot') {
        setShowNewMessageButton(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, isTyping]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={updateNearBottom}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={isEnglish ? 'Conversation with the Virtual Advisor' : 'Conversation avec le Conseiller Virtuel'}
        className={`h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth ${
          compact ? 'bg-slate-50/60 px-3 py-3 dark:bg-transparent' : 'px-3.5 py-4 sm:px-6 sm:py-6 md:px-8'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        <div className={compact ? 'space-y-3' : 'mx-auto w-full max-w-3xl space-y-4 sm:space-y-5'}>
          {header}

          {messages.map((message) => {
            const isBot = message.sender === 'bot';
            const isError = message.status === 'error';
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`flex min-w-0 items-start ${compact ? 'gap-0' : 'gap-2.5 sm:gap-3'} ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {!compact && isBot && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#01184C] shadow-xs dark:border-[#173873]/70 dark:bg-[#081B42] dark:text-[#D4AF37] sm:h-8 sm:w-8" aria-hidden="true">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`min-w-0 transition-colors ${
                    compact
                      ? 'max-w-[92%] px-3.5 py-2.5'
                      : 'max-w-[90%] px-4 py-3 min-[420px]:max-w-[86%] sm:max-w-[80%] sm:px-5 sm:py-3.5 md:max-w-[76%]'
                  } ${
                    isError
                      ? 'rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 text-red-950 shadow-sm dark:border-red-500/30 dark:bg-[#2A1018] dark:text-red-50'
                      : isBot
                        ? 'rounded-2xl rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-[#16356E]/60 dark:bg-gradient-to-br dark:from-[#0A204B] dark:to-[#061536] dark:text-slate-100'
                        : 'rounded-2xl rounded-tr-sm border border-[#01184C] bg-[#01184C] text-white shadow-sm dark:border-[#2757B3]/50 dark:bg-gradient-to-br dark:from-[#173D85] dark:to-[#12306B]'
                  }`}
                >
                  <FormattedAIMessage
                    content={message.text}
                    timestamp={message.timestamp}
                    isBot={isBot}
                    intent={message.intent}
                    language={language}
                    compact={compact}
                    status={message.status}
                    source={message.source}
                    showControls={message.id !== 'welcome'}
                    onRetry={isError ? () => onRetry(message.id) : undefined}
                  />
                </div>

                {!compact && !isBot && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#01184C] bg-[#01184C] text-white shadow-xs dark:border-[#285DB8]/60 dark:bg-[#153878] dark:text-slate-200 sm:h-8 sm:w-8" aria-hidden="true">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start ${compact ? 'gap-0' : 'gap-2.5 sm:gap-3'}`}
              aria-live="polite"
            >
              {!compact && (
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#01184C] shadow-xs dark:border-[#173873]/70 dark:bg-[#081B42] dark:text-[#D4AF37] sm:h-8 sm:w-8" aria-hidden="true">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-[#B38F22] dark:text-[#D4AF37]" />
                </div>
              )}
              <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[#16356E]/60 dark:bg-gradient-to-br dark:from-[#0A204B] dark:to-[#061536]">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:0.3s]" />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {isEnglish ? 'Checking the published information…' : 'Vérification des informations publiées…'}
                </span>
              </div>
            </motion.div>
          )}

          <div className="h-1" aria-hidden="true" />
        </div>
      </div>

      {showNewMessageButton && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-3 left-1/2 z-10 inline-flex min-h-[38px] -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#01184C] px-3.5 py-2 text-xs font-bold text-white shadow-xl ring-1 ring-[#D4AF37]/60 transition-transform hover:scale-[1.03] active:scale-95"
        >
          <ArrowDown className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>{isEnglish ? 'New reply' : 'Nouvelle réponse'}</span>
        </button>
      )}
    </div>
  );
};
