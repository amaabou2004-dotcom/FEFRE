import React, { useState, useEffect } from 'react';
import { Copy, Check, Volume2, VolumeX, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';

interface FormattedAIMessageProps {
  content: string;
  timestamp: string;
  isBot: boolean;
  intent?: {
    needsQuote?: boolean;
    needsContact?: boolean;
  };
}

// Client-side sanitization to guarantee no Gemini or external model signature is displayed
function sanitizeText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/(?:---|___|\*\*\*)\s*(?:Généré par|Propulsé par|Powered by|Modèle|IA|Gemini)[\s\S]*$/gi, '')
    .replace(/\*?\*?(?:Généré par|Propulsé par|Powered by)\s+Gemini[\s\S]*?\*?\*?/gi, '')
    .replace(/\b(?:Google\s+)?Gemini(?:\s+(?:Flash|Pro|Ultra|Live|Nano|Advanced))?\b/gi, 'Conseiller Virtuel')
    .replace(/\b(?:Google\s+AI|OpenAI|ChatGPT|Anthropic|Claude)\b/gi, 'Excellence Services')
    .replace(/modèle\s+de\s+langage\s+(?:de\s+Google|développé\s+par\s+Google)/gi, "système d'orientation")
    .replace(/développé\s+par\s+Google/gi, 'conçu pour Excellence Services')
    .trim();
}

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({
  content,
  timestamp,
  isBot,
  intent,
}) => {
  const { navigate } = useRouter();
  const { settings } = useSiteData();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cleanContent = isBot ? sanitizeText(content) : content;

  // Cleanup speech if component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const handleCopy = () => {
    if (!cleanContent) return;
    navigator.clipboard?.writeText(cleanContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting symbols for speech
    const speechText = cleanContent
      .replace(/\*\*/g, '')
      .replace(/[\*\-•]/g, '')
      .replace(/#{1,6}\s/g, '');

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;

    // Pick a high-quality French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(
      (v) => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Thomas') || v.name.includes('Amelie') || v.name.includes('Natural'))
    ) || voices.find((v) => v.lang.startsWith('fr'));

    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // User Message - Clean, refined typography with subtle deep blue bubble
  if (!isBot) {
    return (
      <div className="space-y-1.5">
        <p className="whitespace-pre-wrap break-words text-[14px] sm:text-[15px] font-medium leading-[1.6] text-white selection:bg-white/20">
          {cleanContent}
        </p>
        <div className="text-[10px] text-blue-200/60 text-right font-mono select-none">
          {timestamp}
        </div>
      </div>
    );
  }

  // Detect context if not passed explicitly in props
  const lowerText = cleanContent.toLowerCase();
  const hasDevis = intent?.needsQuote ?? (lowerText.includes('devis') || lowerText.includes('chiffrage') || lowerText.includes('tarif'));
  const hasContact = intent?.needsContact ?? (lowerText.includes('whatsapp') || lowerText.includes('téléphone') || lowerText.includes('contacter'));
  const hasServices = lowerText.includes('centre') || lowerText.includes('crm') || lowerText.includes('recouvrement');

  // AI Message - Épuré, structured markdown without visual clutter
  const lines = cleanContent.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: { type: 'bullet' | 'number'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'bullet') {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2.5 space-y-2 pl-0.5">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[13.5px] sm:text-[14.5px] text-slate-200/95 leading-[1.65]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-2" />
              <span className="flex-1">{renderFormattedInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2.5 space-y-2 pl-0.5">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[13.5px] sm:text-[14.5px] text-slate-200/95 leading-[1.65]">
              <span className="w-4 h-4 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{renderFormattedInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Check for Bullet points: "* ", "- ", "• "
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.*)$/);
    if (bulletMatch) {
      if (currentList && currentList.type !== 'bullet') {
        flushList();
      }
      if (!currentList) {
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Check for Numbered points: "1. ", "2) "
    const numberMatch = trimmed.match(/^\d+[\.\)]\s+(.*)$/);
    if (numberMatch) {
      if (currentList && currentList.type !== 'number') {
        flushList();
      }
      if (!currentList) {
        currentList = { type: 'number', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    flushList();

    // Check for Headings
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={lineIdx} className="text-[14px] sm:text-[15px] font-semibold text-[#D4AF37] mt-3.5 mb-1 tracking-tight">
          {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={lineIdx} className="text-[15px] sm:text-[16px] font-bold text-white mt-4 mb-1.5 tracking-tight">
          {renderFormattedInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      return;
    }

    // Standard paragraph with refined typography and line-height
    blocks.push(
      <p key={lineIdx} className="text-[13.5px] sm:text-[14.5px] text-slate-200/95 leading-[1.68] mb-2 last:mb-0">
        {renderFormattedInline(trimmed)}
      </p>
    );
  });

  flushList();

  return (
    <div className="group relative w-full">
      <div className="text-slate-100/95 selection:bg-[#D4AF37]/30 selection:text-white">
        {blocks}
      </div>

      {/* Contextual Action Buttons */}
      {(hasDevis || hasContact || hasServices) && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-2">
          {hasDevis && (
            <button
              type="button"
              onClick={() => navigate('/devis')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Demander un devis en ligne</span>
            </button>
          )}

          {hasContact && (
            <a
              href={`https://wa.me/${settings.whatsappRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp commercial</span>
            </a>
          )}

          {hasServices && !hasDevis && (
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-medium text-xs transition-all cursor-pointer active:scale-95"
            >
              <span>Découvrir nos 8 pôles</span>
              <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
            </button>
          )}
        </div>
      )}

      {/* Fluid, unobtrusive metadata & audio/copy controls */}
      <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[11px] text-slate-400/80 select-none">
        <span className="font-mono text-[10px] tracking-wide text-slate-400/70">
          {timestamp}
        </span>

        <div className="flex items-center gap-2">
          {/* Vocalize button */}
          {typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                isSpeaking
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-semibold animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 opacity-70 group-hover:opacity-100'
              }`}
              title={isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse (vocalisation)'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{isSpeaking ? 'Arrêter' : 'Écouter'}</span>
            </button>
          )}

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all opacity-70 group-hover:opacity-100 cursor-pointer active:scale-95"
            title="Copier le texte"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-[10px] font-medium">Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to render bold tags **word** with graceful typography
function renderFormattedInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-white">
          {inner}
        </strong>
      );
    }
    return part;
  });
}
