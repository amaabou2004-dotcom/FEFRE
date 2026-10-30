import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Calculator,
  Check,
  Copy,
  Database,
  FileText,
  Headphones,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { useAIChat } from '../lib/AIChatContext';
import { useLanguage } from '../hooks/useLanguage';
import { AIChatMessages } from '../components/AIChatMessages';
import { AIChatComposer } from '../components/AIChatComposer';
import { ThemeToggle } from '../components/ThemeToggle';

interface AIAssistantPageProps {
  initialPrompt?: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ initialPrompt }) => {
  const { navigate } = useRouter();
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
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const initialPromptHandledRef = useRef(false);

  const copy = isEnglish
    ? {
        back: 'Back to the website',
        online: 'Online',
        subtitle: 'Excellence Services • Published website information',
        copy: 'Copy conversation',
        copied: 'Copied!',
        whatsappShare: 'Send to the sales team on WhatsApp',
        reset: 'Start a new conversation',
        quote: 'Online quote',
        close: 'Close',
        intro:
          'Ask about the published contact-center, CRM, digital, business-development and customer-experience services. If an answer is not published, the advisor will say so instead of guessing.',
        disclaimer: 'For important commitments, confirm details with a human advisor. Do not share passwords or sensitive data here.',
        whatsappDirect: 'WhatsApp direct',
      }
    : {
        back: 'Retour au site',
        online: 'En ligne',
        subtitle: 'Excellence Services • Informations publiées du site',
        copy: 'Copier la conversation',
        copied: 'Copié !',
        whatsappShare: "Transmettre l'échange à l'équipe commerciale sur WhatsApp",
        reset: 'Démarrer une nouvelle conversation',
        quote: 'Devis en ligne',
        close: 'Fermer',
        intro:
          'Interrogez le conseiller sur les services publiés : centres de contact, CRM, digital, développement commercial et expérience client. Si une réponse n’est pas publiée, il vous l’indiquera au lieu de la deviner.',
        disclaimer: 'Pour tout engagement important, confirmez les détails avec un conseiller humain. Ne partagez ni mot de passe ni données sensibles ici.',
        whatsappDirect: 'WhatsApp direct',
      };

  useEffect(() => {
    if (!initialPrompt || initialPromptHandledRef.current) return;
    initialPromptHandledRef.current = true;
    const alreadyAsked = messages.some((message) => message.sender === 'user' && message.text === initialPrompt);
    if (!alreadyAsked) {
      void sendMessage(initialPrompt, 'page');
    }
    // Only consume the initial prompt once when the page is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/');
  };

  const handleCopyTranscript = async () => {
    const text = messages
      .map(
        (message) =>
          `[${message.timestamp}] ${message.sender === 'user' ? (isEnglish ? 'Client' : 'Client') : isEnglish ? 'Virtual Advisor' : 'Conseiller Virtuel'}:\n${message.text}`,
      )
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedTranscript(true);
      window.setTimeout(() => setCopiedTranscript(false), 2500);
    } catch {
      // Ignore clipboard limitations.
    }
  };

  const handleShareWhatsApp = () => {
    const summary = messages
      .slice(-3)
      .map((message) => `${message.sender === 'user' ? 'Client' : isEnglish ? 'Advisor' : 'Conseiller'}: ${message.text.slice(0, 180)}`)
      .join('\n');
    const text = isEnglish
      ? `Hello Excellence Services SARL, I spoke with your Virtual Advisor on the website:\n\n${summary}\n\nI would like to continue with your team in Niamey.`
      : `Bonjour Excellence Services SARL, j'ai échangé avec votre Conseiller Virtuel sur le site :\n\n${summary}\n\nJe souhaite poursuivre avec votre équipe à Niamey.`;
    window.open(`https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const starterSuggestions = [
    {
      icon: <Headphones className="h-3.5 w-3.5" />,
      label: t('ai.sug1', isEnglish ? 'Contact center' : 'Centre de contact'),
      query: t('ai.sug1_q', isEnglish ? 'What are your contact center and customer relationship solutions?' : 'Quelles sont vos solutions de centre de contact et gestion de la relation client ?'),
    },
    {
      icon: <Calculator className="h-3.5 w-3.5" />,
      label: t('ai.sug2', isEnglish ? 'Request a quote' : 'Demande de devis'),
      query: t('ai.sug2_q', isEnglish ? 'How do I obtain a tailored quote?' : 'Comment obtenir un devis personnalisé ?'),
    },
    {
      icon: <Database className="h-3.5 w-3.5" />,
      label: t('ai.sug3', isEnglish ? 'CRM support' : 'Accompagnement CRM'),
      query: t('ai.sug3_q', isEnglish ? 'What does your CRM support include?' : 'Que comprend votre accompagnement CRM ?'),
    },
    {
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      label: t('ai.sug4', isEnglish ? 'Contact & office' : 'Coordonnées & siège'),
      query: t('ai.sug4_q', isEnglish ? 'What are your official contact details, NIF and RCCM in Niamey?' : 'Quelles sont vos coordonnées officielles, NIF et RCCM à Niamey ?'),
    },
  ];

  const introHeader = !hasUserMessages ? (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-[#142E63]/70 dark:bg-gradient-to-br dark:from-[#07193F] dark:to-[#04112E] sm:p-5" aria-label={isEnglish ? 'Suggested topics' : 'Sujets suggérés'}>
      <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">{copy.intro}</p>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-white/5">
        {starterSuggestions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => void sendMessage(item.query, 'page')}
            disabled={isTyping}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:border-[#D4AF37]/60 hover:bg-slate-200 disabled:opacity-50 active:scale-95 dark:border-[#1A3875]/50 dark:bg-[#0B214E]/70 dark:text-slate-200 dark:hover:bg-[#102B63]"
          >
            <span className="text-[#8A6D1F] dark:text-[#D4AF37]">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  ) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-[#F8FAFD] pt-[env(safe-area-inset-top)] font-sans text-[#0E1D38] antialiased transition-colors duration-300 dark:bg-[#030E26] dark:text-white">
      <header className="z-20 flex w-full shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-2.5 py-2 shadow-xs backdrop-blur-md dark:border-[#142B59]/70 dark:bg-[#06163A]/95 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
          <button
            type="button"
            onClick={goBack}
            aria-label={copy.back}
            title={copy.back}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-[#01184C] shadow-xs transition-colors hover:bg-slate-200 active:scale-95 dark:border-[#1A3875]/70 dark:bg-[#0B1E47] dark:text-slate-200 dark:hover:bg-[#122B63] dark:hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#01184C] dark:border-[#214B96]/60 dark:bg-[#0D2454] dark:text-[#D4AF37] sm:h-10 sm:w-10" aria-hidden="true">
              <Bot className="h-5 w-5" />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 dark:border-[#0D2454]" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-sm font-semibold tracking-tight text-[#01184C] dark:text-white sm:text-base">
                  {t('ai.assistant_title', isEnglish ? 'Virtual Advisor' : 'Conseiller Virtuel')}
                </h1>
                <span className="hidden shrink-0 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2 py-0.5 text-[9px] font-medium text-[#01184C] min-[420px]:inline dark:text-[#D4AF37]">
                  {copy.online}
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ThemeToggle className="h-10 w-10" />

          <button
            type="button"
            onClick={handleCopyTranscript}
            title={copy.copy}
            aria-label={copy.copy}
            className="hidden h-10 items-center gap-1 rounded-xl px-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200 sm:flex"
          >
            {copiedTranscript ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span className="hidden text-xs md:inline">{copiedTranscript ? copy.copied : isEnglish ? 'Copy' : 'Copier'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            title={copy.whatsappShare}
            aria-label={copy.whatsappShare}
            className="hidden h-10 items-center gap-1 rounded-xl px-2 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-white/5 dark:hover:text-emerald-300 sm:flex"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden text-xs md:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={resetChat}
            title={copy.reset}
            aria-label={copy.reset}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/devis')}
            className="hidden min-h-10 items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#01184C] shadow-xs transition-all hover:bg-[#E5C358] md:inline-flex"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{copy.quote}</span>
          </button>

          <button
            type="button"
            onClick={goBack}
            aria-label={copy.close}
            title={copy.close}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <AIChatMessages
        messages={messages}
        isTyping={isTyping}
        language={language}
        header={introHeader}
        onRetry={(messageId) => void retryMessage(messageId, 'page')}
      />

      <footer className="z-20 w-full shrink-0 border-t border-slate-200 bg-white/95 pb-[max(0.65rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-colors dark:border-[#142B59]/70 dark:bg-[#06163A]/95">
        <div className="mx-auto w-full max-w-3xl px-3.5 pt-2.5 sm:px-6">
          <AIChatComposer
            value={inputMessage}
            onChange={setInputMessage}
            onSend={() => void sendMessage(undefined, 'page')}
            isTyping={isTyping}
            onStop={stopGenerating}
            language={language}
            autoFocus
            suggestions={hasUserMessages ? suggestions : []}
            onSuggestion={(suggestion) => void sendMessage(suggestion, 'page')}
          />

          <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            <span className="min-w-0">{copy.disclaimer}</span>
            <a
              href={`https://wa.me/${settings.whatsappRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-medium text-[#01184C] hover:underline dark:text-[#D4AF37]"
            >
              <PhoneCall className="h-3 w-3" />
              <span className="hidden sm:inline">{copy.whatsappDirect}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
