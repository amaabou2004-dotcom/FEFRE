import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bot, FileText, Maximize2, PhoneCall, RefreshCw, X } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useAIChat } from '../lib/AIChatContext';
import { useLanguage } from '../hooks/useLanguage';
import { AIChatMessages } from './AIChatMessages';
import { AIChatComposer } from './AIChatComposer';

export const AIAssistantFloatingButton: React.FC = () => {
  const { navigate, currentPath } = useRouter();
  const { settings } = useSiteData();
  const { t, isEnglish } = useLanguage();
  const {
    messages,
    inputMessage,
    setInputMessage,
    isTyping,
    suggestions,
    language,
    hasUserMessages,
    sendMessage,
    retryMessage,
    stopGenerating,
    resetChat,
  } = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const previousPathRef = useRef(currentPath);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      previousPathRef.current = currentPath;
      return;
    }
    if (previousPathRef.current !== currentPath) {
      setIsOpen(false);
    }
    previousPathRef.current = currentPath;
  }, [currentPath, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (currentPath === '/assistant-ia' || currentPath === '/ia' || currentPath.startsWith('/admin')) {
    return null;
  }

  const miniChips = isEnglish
    ? [
        { label: 'Our services', query: 'What services do you currently publish?' },
        { label: 'Request a quote', query: 'How can I obtain a tailored quote?' },
        { label: 'CRM support', query: 'What does your CRM support include?' },
        { label: 'Contact Niamey', query: 'What are your official contact details and hours in Niamey?' },
      ]
    : [
        { label: 'Nos services', query: 'Quels services publiez-vous actuellement ?' },
        { label: 'Demander un devis', query: 'Comment obtenir un devis personnalisé ?' },
        { label: 'Accompagnement CRM', query: 'Que comprend votre accompagnement CRM ?' },
        { label: 'Contact Niamey', query: 'Quelles sont vos coordonnées et horaires officiels à Niamey ?' },
      ];

  const introHeader = !hasUserMessages ? (
    <div className="flex flex-wrap gap-1.5" aria-label={isEnglish ? 'Suggested questions' : 'Questions suggérées'}>
      {miniChips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => void sendMessage(chip.query, 'floating')}
          disabled={isTyping}
          className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-2xs transition-all hover:border-[#D4AF37]/60 hover:bg-slate-100 hover:text-[#01184C] disabled:opacity-50 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-200 dark:hover:bg-[#122D68] dark:hover:text-white"
        >
          {chip.label}
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <aside
      aria-label={isEnglish ? 'Floating virtual advisor' : 'Assistant virtuel flottant'}
      className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+0.75rem)] left-4 z-[45] sm:left-6 lg:bottom-5"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="false"
            aria-label={t('ai.assistant_title', isEnglish ? 'Virtual Advisor' : 'Conseiller Virtuel')}
            className="mb-3 flex h-[min(600px,calc(100dvh-var(--site-header-height)-var(--mobile-bottom-nav-height)-6.25rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans text-[#0E1D38] shadow-2xl transition-colors duration-200 dark:border-[#183B7A] dark:bg-[#041029] dark:text-white dark:shadow-[0_20px_60px_rgba(1,10,32,0.65)] sm:w-[384px] lg:h-[min(620px,78dvh)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#132C5E] dark:bg-[#06183E]">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#01184C] dark:border-[#2353A8]/70 dark:bg-[#0E2861] dark:text-[#D4AF37]" aria-hidden="true">
                  <Bot className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-emerald-400 dark:border-[#041029]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-[#01184C] dark:text-white">
                      {t('ai.assistant_title', isEnglish ? 'Virtual Advisor' : 'Conseiller Virtuel')}
                    </span>
                    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {isEnglish ? 'Answers based on published information' : 'Réponses basées sur les informations publiées'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={resetChat}
                  title={isEnglish ? 'New conversation' : 'Nouvelle conversation'}
                  aria-label={isEnglish ? 'New conversation' : 'Nouvelle conversation'}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/assistant-ia');
                  }}
                  title={t('ai.fullscreen', isEnglish ? 'Open in fullscreen' : 'Agrandir en plein écran')}
                  aria-label={t('ai.fullscreen', isEnglish ? 'Open in fullscreen' : 'Agrandir en plein écran')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-[#D4AF37]"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title={t('ai.close', isEnglish ? 'Close chat' : 'Fermer le chat')}
                  aria-label={t('ai.close', isEnglish ? 'Close chat' : 'Fermer le chat')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AIChatMessages
              messages={messages}
              isTyping={isTyping}
              language={language}
              compact
              header={introHeader}
              onRetry={(messageId) => void retryMessage(messageId, 'floating')}
            />

            <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] dark:border-[#132C5E] dark:bg-[#06183E]">
              <AIChatComposer
                value={inputMessage}
                onChange={setInputMessage}
                onSend={() => void sendMessage(undefined, 'floating')}
                isTyping={isTyping}
                onStop={stopGenerating}
                language={language}
                compact
                autoFocus={isOpen}
                suggestions={hasUserMessages ? suggestions : []}
                onSuggestion={(suggestion) => void sendMessage(suggestion, 'floating')}
              />

              <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/devis');
                  }}
                  className="inline-flex min-h-[28px] items-center gap-1 font-medium transition-colors hover:text-[#B38F22] dark:hover:text-[#D4AF37]"
                >
                  <FileText className="h-3 w-3 text-[#B38F22] dark:text-[#D4AF37]" />
                  <span>{t('ai.express_quote', isEnglish ? 'Express quote' : 'Devis express')}</span>
                </button>
                <span className="hidden min-[390px]:inline">{isEnglish ? 'No sensitive data' : 'Aucune donnée sensible'}</span>
                <a
                  href={`https://wa.me/${settings.whatsappRaw}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[28px] items-center gap-1 font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  <PhoneCall className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('ai.whatsapp_direct', 'WhatsApp direct')}</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        id="ai-assistant-toggle-button"
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`group flex cursor-pointer items-center gap-2 rounded-full border p-2 text-white shadow-2xl backdrop-blur-md transition-all sm:gap-2.5 sm:px-4 sm:py-3 ${
          isOpen
            ? 'border-[#D4AF37] bg-[#D4AF37] text-[#01184C] shadow-[#D4AF37]/30'
            : 'border-[#D4AF37]/60 bg-[#01184C]/95 hover:border-[#D4AF37] hover:shadow-[#D4AF37]/25'
        }`}
        aria-expanded={isOpen}
        aria-label={isOpen ? t('ai.toggle_close', isEnglish ? 'Close the Virtual Advisor' : "Fermer l'Assistant IA") : t('ai.toggle_open', isEnglish ? 'Open the Virtual Advisor' : "Ouvrir l'Assistant IA")}
        title={isOpen ? t('ai.toggle_close', isEnglish ? 'Close chat window' : 'Fermer la fenêtre du chat') : t('ai.toggle_open', isEnglish ? 'Chat with the Virtual Advisor' : 'Discuter avec le Conseiller Virtuel')}
      >
        <div
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow ${
            isOpen ? 'bg-[#01184C] text-[#D4AF37]' : 'bg-[#D4AF37] text-[#01184C]'
          }`}
          aria-hidden="true"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          {!isOpen && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full border-2 border-[#01184C] bg-emerald-400" />
          )}
        </div>
        <div className="hidden pr-1 text-left sm:block">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-extrabold tracking-wide transition-colors ${isOpen ? 'text-[#01184C]' : 'text-white group-hover:text-[#D4AF37]'}`}>
              {isOpen ? t('common.close', isEnglish ? 'Close chat' : 'Fermer le chat') : t('ai.assistant_title', isEnglish ? 'Virtual Advisor' : 'Conseiller IA')}
            </span>
            {!isOpen && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
          </div>
          <p className={`text-[10px] ${isOpen ? 'text-[#01184C]/80' : 'text-slate-300'}`}>
            {isOpen
              ? isEnglish
                ? 'Click to minimize'
                : 'Cliquez pour réduire'
              : isEnglish
                ? 'Verified answers • Niamey'
                : 'Réponses vérifiées • Niamey'}
          </p>
        </div>
      </motion.button>
    </aside>
  );
};
