import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  MessageSquare,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSiteData } from '../lib/DataContext';
import { sanitizeAIResponse, type AIIntent, type AILanguage } from '../lib/aiAssistant';

interface FormattedAIMessageProps {
  content: string;
  timestamp: string;
  isBot: boolean;
  intent?: Partial<AIIntent>;
  language?: AILanguage;
  compact?: boolean;
  status?: 'complete' | 'error';
  source?: 'knowledge' | 'ai' | 'fallback' | 'system';
  showControls?: boolean;
  onRetry?: () => void;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*#_>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({
  content,
  timestamp,
  isBot,
  intent,
  language = 'fr',
  compact = false,
  status = 'complete',
  showControls = true,
  onRetry,
}) => {
  const { navigate } = useRouter();
  const { settings } = useSiteData();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const speakingRef = useRef(false);
  const cleanContent = isBot ? sanitizeAIResponse(content) : content;
  const isEnglish = language === 'en';
  const textSizeClass = compact ? 'text-[14px] leading-[1.62]' : 'text-[14.5px] leading-[1.68] sm:text-[15px]';

  useEffect(
    () => () => {
      if (speakingRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const handleCopy = async () => {
    if (!cleanContent) return;
    try {
      await navigator.clipboard?.writeText(cleanContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable in some embedded browsers.
    }
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(cleanContent));
    utterance.lang = isEnglish ? 'en-US' : 'fr-FR';
    utterance.rate = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const prefix = isEnglish ? 'en' : 'fr';
    const matchingVoice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix) && /google|natural|thomas|amelie|samantha/i.test(voice.name)) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onend = () => {
      speakingRef.current = false;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setIsSpeaking(false);
    };

    speakingRef.current = true;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isBot) {
    return (
      <div className="min-w-0 space-y-1.5">
        <p className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${textSizeClass} font-medium text-white selection:bg-white/20`}>
          {cleanContent}
        </p>
        <div className="select-none text-right font-mono text-[10px] text-blue-100/70">{timestamp}</div>
      </div>
    );
  }

  const bodyClass = status === 'error' ? 'text-red-900 dark:text-red-100' : 'text-slate-800 dark:text-slate-100';
  const strongClass = status === 'error' ? 'text-red-950 dark:text-white' : 'text-[#01184C] dark:text-white';
  const headingClass = status === 'error' ? 'text-red-900 dark:text-red-100' : 'text-[#01184C] dark:text-[#E6C86E]';
  const linkClass =
    status === 'error'
      ? 'font-semibold text-red-800 underline decoration-red-300 underline-offset-2 hover:text-red-950 dark:text-red-200 dark:hover:text-white'
      : 'font-semibold text-[#8A6D1F] underline decoration-[#D4AF37]/50 underline-offset-2 transition-colors hover:text-[#01184C] hover:decoration-[#D4AF37] dark:text-[#E6C86E] dark:hover:text-white';
  const mutedClass = status === 'error' ? 'text-red-700/80 dark:text-red-200/70' : 'text-slate-500 dark:text-slate-400';
  const codeClass =
    status === 'error'
      ? 'bg-red-100 text-red-950 dark:bg-white/10 dark:text-red-50'
      : 'bg-slate-100 text-[#01184C] dark:bg-white/10 dark:text-slate-50';

  const officialPhoneNumbers = [
    settings.whatsapp,
    ...settings.phones.map((phone) => phone.number),
  ].filter(Boolean);
  const phonePattern = officialPhoneNumbers.length
    ? new RegExp(`(${officialPhoneNumbers.map(escapeRegex).join('|')})`, 'g')
    : null;

  const renderPlainText = (text: string, keyPrefix: string, insideLink = false): React.ReactNode => {
    if (!phonePattern || insideLink) return text;
    const parts = text.split(phonePattern);
    if (parts.length === 1) return text;
    return parts.map((part, index) => {
      if (!officialPhoneNumbers.includes(part)) return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
      const raw = settings.phones.find((phone) => phone.number === part)?.raw || part.replace(/\D/g, '');
      return (
        <a key={`${keyPrefix}-${index}`} href={`tel:+${raw.replace(/\D/g, '')}`} className={linkClass}>
          {part}
        </a>
      );
    });
  };

  const renderInline = (text: string, keyPrefix: string, depth = 0, insideLink = false): React.ReactNode => {
    const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+]\(.+?\)|https?:\/\/[^\s<]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\*[^*\n]+\*|_[^_\n]+_)/g;
    const parts = text.split(tokenPattern).filter((part) => part !== undefined);

    return parts.map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={key} className={`font-semibold ${strongClass}`}>
            {depth < 2 ? renderInline(inner, key, depth + 1, insideLink) : inner}
          </strong>
        );
      }

      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={key} className={`rounded-md px-1.5 py-0.5 font-mono text-[0.86em] ${codeClass}`}>
            {part.slice(1, -1)}
          </code>
        );
      }

      const linkMatch = part.match(/^\[([^\]]+)]\(([^)\s]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const isInternal = href.startsWith('/') && !href.startsWith('//');
        const isSafe = isInternal || /^(https?:\/\/|mailto:|tel:)/i.test(href);
        if (!isSafe) return <React.Fragment key={key}>{label}</React.Fragment>;
        return (
          <a
            key={key}
            href={href}
            onClick={
              isInternal
                ? (event) => {
                    event.preventDefault();
                    navigate(href);
                  }
                : undefined
            }
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={linkClass}
          >
            {depth < 2 ? renderInline(label, key, depth + 1, true) : label}
          </a>
        );
      }

      if (/^https?:\/\//i.test(part)) {
        if (insideLink) return <React.Fragment key={key}>{part}</React.Fragment>;
        const trailing = part.match(/[.,;:!?)]$/)?.[0] || '';
        const url = trailing ? part.slice(0, -1) : part;
        return (
          <React.Fragment key={key}>
            <a href={url} target="_blank" rel="noopener noreferrer" className={`${linkClass} break-all`}>
              {url}
            </a>
            {trailing}
          </React.Fragment>
        );
      }

      if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(part)) {
        if (insideLink) return <React.Fragment key={key}>{part}</React.Fragment>;
        return (
          <a key={key} href={`mailto:${part}`} className={`${linkClass} break-all`}>
            {part}
          </a>
        );
      }

      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }

      return <React.Fragment key={key}>{renderPlainText(part, key, insideLink)}</React.Fragment>;
    });
  };

  const blocks: React.ReactNode[] = [];
  const lines = cleanContent.split('\n');
  let paragraphLines: string[] = [];
  let currentList: { type: 'bullet' | 'number'; items: string[]; start: number } | null = null;
  let blockIndex = 0;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const key = `p-${blockIndex++}`;
    blocks.push(
      <p key={key} className={`${textSizeClass} ${bodyClass} mb-2.5 last:mb-0`}>
        {renderInline(paragraphLines.join(' '), key)}
      </p>,
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (!currentList) return;
    const key = `list-${blockIndex++}`;
    if (currentList.type === 'bullet') {
      blocks.push(
        <ul key={key} className="my-2.5 space-y-2">
          {currentList.items.map((item, index) => (
            <li key={index} className={`flex items-start gap-2.5 ${textSizeClass} ${bodyClass}`}>
              <span className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B38F22] dark:bg-[#D4AF37]" />
              <span className="min-w-0 flex-1">{renderInline(item, `${key}-${index}`)}</span>
            </li>
          ))}
        </ul>,
      );
    } else {
      blocks.push(
        <ol key={key} className="my-2.5 space-y-2" start={currentList.start}>
          {currentList.items.map((item, index) => (
            <li key={index} className={`flex items-start gap-2.5 ${textSizeClass} ${bodyClass}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[10px] font-bold text-[#7A5F16] dark:text-[#E6C86E]">
                {currentList!.start + index}
              </span>
              <span className="min-w-0 flex-1">{renderInline(item, `${key}-${index}`)}</span>
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      flushAll();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      const key = `code-${blockIndex++}`;
      blocks.push(
        <pre key={key} className={`my-3 overflow-x-auto rounded-xl p-3 font-mono text-xs leading-relaxed ${codeClass}`}>
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    const nextLine = lines[index + 1]?.trim() || '';
    const isTableStart = trimmed.includes('|') && /^\|?\s*:?-{3,}/.test(nextLine) && nextLine.includes('|');
    if (isTableStart) {
      flushAll();
      const parseRow = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      const headers = parseRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(parseRow(lines[index]));
        index += 1;
      }
      index -= 1;
      const key = `table-${blockIndex++}`;
      blocks.push(
        <div key={key} className="my-3 max-w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
          <table className={`min-w-[420px] w-full border-collapse text-left text-[13px] leading-relaxed ${bodyClass}`}>
            <thead className="bg-slate-100 dark:bg-white/10">
              <tr>
                {headers.map((header, cellIndex) => (
                  <th key={cellIndex} className="px-3 py-2 font-semibold">
                    {renderInline(header, `${key}-h-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-200 dark:border-white/10">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top">
                      {renderInline(cell, `${key}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[*•-]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (currentList?.type === 'number') flushList();
      if (!currentList) currentList = { type: 'bullet', items: [], start: 1 };
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    const numberMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numberMatch) {
      flushParagraph();
      if (currentList?.type === 'bullet') flushList();
      if (!currentList) currentList = { type: 'number', items: [], start: Number(numberMatch[1]) || 1 };
      currentList.items.push(numberMatch[2]);
      continue;
    }

    flushList();

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const key = `heading-${blockIndex++}`;
      const level = headingMatch[1].length;
      const className = `${level <= 2 ? 'text-[16px]' : 'text-[15px]'} mt-4 mb-1.5 font-bold tracking-tight ${headingClass}`;
      blocks.push(
        level <= 2 ? (
          <h3 key={key} className={className}>{renderInline(headingMatch[2], key)}</h3>
        ) : (
          <h4 key={key} className={className}>{renderInline(headingMatch[2], key)}</h4>
        ),
      );
      continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push(<hr key={`hr-${blockIndex++}`} className="my-4 border-slate-200 dark:border-white/10" />);
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      const key = `quote-${blockIndex++}`;
      blocks.push(
        <blockquote key={key} className={`my-3 border-l-4 border-[#D4AF37] pl-3 italic ${textSizeClass} ${bodyClass}`}>
          {renderInline(trimmed.replace(/^>\s?/, ''), key)}
        </blockquote>,
      );
      continue;
    }

    paragraphLines.push(trimmed);
  }

  flushAll();

  const hasQuote = Boolean(intent?.needsQuote);
  const hasContact = Boolean(intent?.needsContact);
  const hasServices = Boolean(intent?.needsServices) && intent?.topic !== 'service-detail' && !hasQuote;
  const shouldCollapse = compact && cleanContent.length > 1300 && status !== 'error';

  return (
    <div className="group relative w-full min-w-0 [overflow-wrap:anywhere]">
      {status === 'error' && (
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{isEnglish ? 'Response not received' : 'Réponse non reçue'}</span>
        </div>
      )}

      <div className={shouldCollapse && !isExpanded ? 'relative max-h-[19rem] overflow-hidden' : undefined}>
        <div className={`${bodyClass} selection:bg-[#D4AF37]/35 selection:text-inherit`}>{blocks}</div>
        {shouldCollapse && !isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#081B42] dark:via-[#081B42]/80" />
        )}
      </div>

      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="mt-2 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#8A6D1F] transition-colors hover:bg-[#D4AF37]/10 hover:text-[#01184C] dark:text-[#E6C86E] dark:hover:text-white"
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{isExpanded ? (isEnglish ? 'Show less' : 'Afficher moins') : isEnglish ? 'Read more' : 'Lire la suite'}</span>
        </button>
      )}

      {(hasQuote || hasContact || hasServices) && status !== 'error' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
          {hasQuote && (
            <button
              type="button"
              onClick={() => navigate('/devis')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#01184C] shadow-xs transition-all hover:bg-[#E5C358] active:scale-95"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{isEnglish ? 'Request a quote online' : 'Demander un devis en ligne'}</span>
            </button>
          )}

          {hasContact && (
            <a
              href={`https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(settings.defaultWhatsAppMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-95"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{isEnglish ? 'WhatsApp an advisor' : 'WhatsApp conseiller'}</span>
            </a>
          )}

          {hasServices && (
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-[#01184C] transition-all hover:bg-slate-200 active:scale-95 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
            >
              <span>{isEnglish ? 'View our services' : 'Découvrir nos services'}</span>
              <ArrowRight className="h-3 w-3 text-[#B38F22] dark:text-[#D4AF37]" />
            </button>
          )}
        </div>
      )}

      <div className={`mt-2.5 flex min-h-[32px] items-center justify-between gap-2 text-[11px] ${mutedClass}`}>
        <span className="font-mono text-[10px] tracking-wide">{timestamp}</span>

        <div className="flex items-center gap-1.5">
          {status === 'error' && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-red-500 active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isEnglish ? 'Retry' : 'Réessayer'}</span>
            </button>
          )}

          {status !== 'error' && showControls && typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1.5 transition-all active:scale-95 ${
                isSpeaking
                  ? 'bg-[#D4AF37]/20 font-semibold text-[#7A5F16] dark:text-[#E6C86E]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-[#01184C] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
              }`}
              aria-label={isSpeaking ? (isEnglish ? 'Stop listening' : 'Arrêter la lecture') : isEnglish ? 'Listen to the reply' : 'Écouter la réponse'}
              title={isSpeaking ? (isEnglish ? 'Stop' : 'Arrêter') : isEnglish ? 'Listen' : 'Écouter'}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span className="hidden min-[380px]:inline text-[10px]">{isSpeaking ? (isEnglish ? 'Stop' : 'Arrêter') : isEnglish ? 'Listen' : 'Écouter'}</span>
            </button>
          )}

          {status !== 'error' && showControls && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-[#01184C] active:scale-95 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
              aria-label={isEnglish ? 'Copy the reply' : 'Copier la réponse'}
              title={isEnglish ? 'Copy' : 'Copier'}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="hidden min-[380px]:inline text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{isEnglish ? 'Copied' : 'Copié'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden min-[380px]:inline text-[10px]">{isEnglish ? 'Copy' : 'Copier'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
