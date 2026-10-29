import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowLeft,
  Send,
  Bot,
  User,
  RefreshCw,
  FileText,
  PhoneCall,
  ShieldCheck,
  Headphones,
  Database,
  Calculator,
  Mic,
  MicOff,
  Share2,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { FormattedAIMessage } from '../components/FormattedAIMessage';
import { ThemeToggle } from '../components/ThemeToggle';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  intent?: {
    needsQuote?: boolean;
    needsContact?: boolean;
  };
}

// Client-side sanitization to ensure no external AI signatures or disclaimers leak
function cleanMessageText(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:---|___|\*\*\*)\s*(?:Généré par|Propulsé par|Powered by|Modèle|IA|Gemini)[\s\S]*$/gi, '')
    .replace(/\*?\*?(?:Généré par|Propulsé par|Powered by)\s+Gemini[\s\S]*?\*?\*?/gi, '')
    .replace(/\b(?:Google\s+)?Gemini(?:\s+(?:Flash|Pro|Ultra|Live|Nano|Advanced))?\b/gi, 'Conseiller Virtuel')
    .replace(/\b(?:Google\s+AI|OpenAI|ChatGPT|Anthropic|Claude)\b/gi, 'Excellence Services')
    .replace(/modèle\s+de\s+langage\s+(?:de\s+Google|développé\s+par\s+Google)/gi, "système d'orientation")
    .replace(/développé\s+par\s+Google/gi, 'conçu pour Excellence Services')
    .trim();
}

const QUICK_SUGGESTIONS = [
  {
    icon: <Headphones className="w-3.5 h-3.5 text-[#D4AF37]" />,
    label: 'Centre d’appels 24/7',
    query: 'Quelles sont vos solutions de centre de contact et gestion de la relation client ?',
  },
  {
    icon: <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />,
    label: 'Demande de devis',
    query: 'Comment obtenir un devis personnalisé pour externaliser nos opérations ?',
  },
  {
    icon: <Database className="w-3.5 h-3.5 text-[#D4AF37]" />,
    label: 'Intégration CRM',
    query: 'Quelles solutions CRM intégrez-vous (HubSpot, Salesforce, Zoho) ?',
  },
  {
    icon: <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />,
    label: 'Coordonnées & Siège',
    query: 'Quelles sont vos coordonnées officielles, NIF et RCCM à Niamey ?',
  },
];

interface AIAssistantPageProps {
  initialPrompt?: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ initialPrompt }) => {
  const { navigate } = useRouter();
  const { settings } = useSiteData();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Bonjour et bienvenue chez Excellence Services SARL.\n\nJe suis votre Conseiller Virtuel. Je suis à votre disposition pour vous orienter sur nos expertises (centres d'appels, CRM, télémarketing, recouvrement amiable ou solutions web) et vous guider vers un chiffrage personnalisé à Niamey.\n\nEn quoi puis-je vous renseigner aujourd'hui ?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);

  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottom = (force: boolean = false) => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, []);

  const handleToggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'user' ? 'Client' : 'Conseiller Virtuel Excellence Services'}:\n${m.text}`)
      .join('\n\n---\n\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    const summary = messages.slice(-3).map((m) => `${m.sender === 'user' ? 'Client' : 'Conseiller'}: ${m.text.slice(0, 100)}...`).join('\n');
    const waText = `Bonjour Excellence Services SARL, j'ai échangé avec votre Conseiller Virtuel sur le site :\n\n${summary}\n\nJe souhaite échanger avec votre direction commerciale à Niamey.`;
    window.open(`https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setTimeout(() => scrollToBottom(true), 40);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();
      let botReply = cleanMessageText(data?.reply || '');

      if (!res.ok || !botReply) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('devis') || lowerText.includes('tarif') || lowerText.includes('prix')) {
          botReply = `Pour recevoir une proposition financière adaptée à vos besoins :\n\n- Remplissez notre **formulaire de devis en ligne**.\n- Ou contactez directement notre direction commerciale au **${settings.phones[0]?.number}**.\n\nNos conseillers vous répondent sous 24h ouvrées.`;
        } else if (lowerText.includes('contact') || lowerText.includes('adresse') || lowerText.includes('niamey') || lowerText.includes('telephone')) {
          botReply = `Excellence Services SARL vous accueille à Niamey, Niger :\n\n- **NIF** : 155632/R\n- **RCCM** : NE/NIM/01/2026/B12/00018\n- **Téléphone & WhatsApp** : ${settings.phones[0]?.number}\n- **Courriel** : ${settings.email}\n- **Horaires** : Lundi au Vendredi, 09h30 à 17h30`;
        } else if (lowerText.includes('crm') || lowerText.includes('hubspot') || lowerText.includes('salesforce')) {
          botReply = "Nous assurons le déploiement et la personnalisation de solutions CRM leaders (**HubSpot, Salesforce, Zoho**) :\n\n- Migration sécurisée de vos fichiers clients\n- Automatisation des interactions et relances\n- Tableaux de bord de suivi de la performance\n- Formation complète de vos équipes";
        } else {
          botReply = "Excellence Services SARL met à votre service son savoir-faire pour valoriser votre relation client. Souhaitez-vous obtenir un devis personnalisé ou échanger avec nos conseillers à Niamey ?";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intent: data?.intent,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Excellence Services SARL vous accompagne à Niamey et dans toute la sous-région. Vous pouvez joindre nos conseillers au ${settings.phones[0]?.number} ou soumettre une demande de devis en ligne.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollToBottom(true), 60);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: "Nouvelle session démarrée. N'hésitez pas à me poser vos questions sur nos prestations de centre d'appels, CRM ou devis.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full max-h-screen overflow-hidden bg-[#F8FAFD] dark:bg-[#030E26] text-[#0E1D38] dark:text-white flex flex-col font-sans antialiased transition-colors duration-300">
      {/* Top Bar: Pure, restrained, elegant */}
      <header className="w-full shrink-0 bg-white/95 dark:bg-[#06163A]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#142B59]/70 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-20 shadow-xs">
        {/* Left: Back button & brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate('/');
              }
            }}
            aria-label="Retour au site"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#01184C] dark:bg-[#0B1E47] dark:hover:bg-[#122B63] dark:text-slate-200 dark:hover:text-white border border-slate-300 dark:border-[#1A3875]/70 transition-colors cursor-pointer shrink-0 flex items-center justify-center active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-[#0D2454] border border-slate-300 dark:border-[#214B96]/60 flex items-center justify-center text-[#01184C] dark:text-[#D4AF37] relative shrink-0">
              <Bot className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute bottom-0 right-0 border-2 border-white dark:border-[#0D2454]" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-[#01184C] dark:text-white tracking-tight truncate">
                  Conseiller Virtuel
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#D4AF37]/20 text-[#01184C] dark:text-[#D4AF37] border border-[#D4AF37]/40 shrink-0">
                  En ligne
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Excellence Services SARL • Niamey
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle className="w-9 h-9" />

          <button
            type="button"
            onClick={handleCopyTranscript}
            title="Copier toute la conversation"
            className="p-2 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-[#01184C] dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            {copiedTranscript ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden md:inline text-xs">{copiedTranscript ? 'Copié !' : 'Copier'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            title="Transmettre l'échange à l'équipe commerciale sur WhatsApp"
            className="p-2 rounded-xl bg-transparent hover:bg-emerald-50 dark:hover:bg-white/5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline text-xs">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Effacer la conversation"
            className="p-2 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-[#01184C] dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/devis')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Devis en ligne</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate('/');
              }
            }}
            aria-label="Fermer"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#01184C] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="text-sm font-semibold">✕</span>
          </button>
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <main
        ref={messagesContainerRef}
        onScroll={checkIfNearBottom}
        id="ai-chat-messages-container"
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-8 overscroll-contain"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5">
          {/* Subtle Welcome Card */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#07193F] dark:to-[#04112E] border border-slate-200 dark:border-[#142E63]/70 shadow-sm transition-colors">
            <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Consultez notre assistant pour découvrir nos prestations de centre d'appels omnicanal, intégration CRM et relation client à Niamey.
            </p>

            <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-white/5">
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(item.query)}
                  disabled={isTyping}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0B214E]/70 dark:hover:bg-[#102B63] border border-slate-300 dark:border-[#1A3875]/50 hover:border-[#D4AF37]/50 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
                >
                  <span className="text-[#01184C] dark:text-[#D4AF37]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`flex items-start gap-2.5 sm:gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-[#081B42] border border-slate-300 dark:border-[#173873]/70 flex items-center justify-center shrink-0 text-[#01184C] dark:text-[#D4AF37] mt-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Rounded bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] md:max-w-[76%] px-4 py-3 sm:px-5 sm:py-3.5 transition-all ${
                      isBot
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-2xl sm:rounded-[22px] rounded-tl-sm shadow-sm dark:bg-gradient-to-br dark:from-[#0A204B] dark:to-[#061536] dark:text-slate-100 dark:border-[#16356E]/60 dark:shadow-[0_4px_16px_rgba(2,10,28,0.45)]'
                        : 'bg-[#01184C] text-white border border-[#01184C] rounded-2xl sm:rounded-[22px] rounded-tr-sm shadow-sm dark:bg-gradient-to-br dark:from-[#173D85] dark:to-[#12306B] dark:border-[#2757B3]/50 dark:shadow-[0_4px_14px_rgba(7,24,65,0.4)]'
                    }`}
                  >
                    <FormattedAIMessage
                      content={msg.text}
                      timestamp={msg.timestamp}
                      isBot={isBot}
                      intent={msg.intent}
                    />
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#01184C] dark:bg-[#153878] border border-[#01184C] dark:border-[#285DB8]/60 flex items-center justify-center shrink-0 text-white dark:text-slate-200 mt-1 shadow-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 sm:gap-3"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-[#081B42] border border-slate-300 dark:border-[#173873]/70 flex items-center justify-center shrink-0 text-[#01184C] dark:text-[#D4AF37] mt-1 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
              </div>
              <div className="bg-white border border-slate-200 dark:bg-gradient-to-br dark:from-[#0A204B] dark:to-[#061536] dark:border-[#16356E]/60 rounded-2xl sm:rounded-[22px] rounded-tl-sm px-4 py-3 flex items-center gap-2.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0.3s]" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-300/80 font-normal">
                  Réponse en cours...
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>

      {/* Modern, uncluttered input station */}
      <footer className="w-full shrink-0 bg-white/95 dark:bg-[#06163A]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#142B59]/70 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20 transition-colors">
        <div className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-2 pb-1">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#091E47] border border-slate-300 dark:border-[#1A3875]/70 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 rounded-2xl p-1.5 transition-all shadow-inner">
            {/* Microphone dictation button */}
            <button
              type="button"
              onClick={handleToggleMic}
              title={isListening ? 'Arrêter l’enregistrement' : 'Dicter votre message vocalement'}
              className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-md'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-[#01184C] dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/5'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              id="ai-page-input-message"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'À votre écoute en français...' : "Posez votre question (services, devis, centre d'appels)..."}
              disabled={isTyping}
              className="flex-1 min-w-0 px-2 py-2 bg-transparent text-[13.5px] sm:text-[14px] text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              id="ai-page-send-button"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Envoyer le message"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-semibold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
            >
              <span className="hidden sm:inline">Envoyer</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">
              Excellence Services SARL • Niamey, Niger
            </span>
            <a
              href={`https://wa.me/${settings.whatsappRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#01184C] dark:text-[#D4AF37] font-medium hover:underline shrink-0"
            >
              <PhoneCall className="w-3 h-3" />
              <span className="hidden sm:inline">WhatsApp direct</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
