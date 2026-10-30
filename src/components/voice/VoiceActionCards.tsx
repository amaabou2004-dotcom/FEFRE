import React from 'react';
import {
  AlarmClock,
  Bell,
  CloudSun,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Timer,
} from 'lucide-react';
import type { VoiceAction, VoiceCard, VoiceLanguage } from '../../lib/voice/types';
import { ui } from '../../lib/voice/languages';
import { googleMapsEmbedUrl } from '../../lib/voice/mapsLinks';

/**
 * ISA — Cartes et boutons d'action
 * ================================
 * Chaque réponse de l'assistant peut produire des actions (appeler, ouvrir
 * Google Maps, lancer la navigation, envoyer un WhatsApp, régler une alarme…).
 * Elles sont rendues en gros boutons tactiles : sur téléphone, c'est le geste
 * utilisateur qui déclenche réellement l'appel ou l'ouverture de l'app, comme
 * l'exigent les navigateurs — et comme le fait Siri avec « Appeler ».
 */

const ACTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  sms: MessageCircle,
  whatsapp: MessageCircle,
  email: Mail,
  open_map: MapPin,
  navigate_to: Navigation,
  show_map: MapPin,
  open_url: ExternalLink,
  timer: Timer,
  alarm: AlarmClock,
  reminder: Bell,
  show_weather: CloudSun,
  copy: Copy,
  navigate_site: Navigation,
};

interface VoiceActionButtonsProps {
  actions?: VoiceAction[];
  language: VoiceLanguage;
  onExecute: (action: VoiceAction) => void;
  compact?: boolean;
}

function actionLabel(action: VoiceAction, language: VoiceLanguage): string {
  switch (action.type) {
    case 'call':
      return `${ui(language, 'callNow')} · ${action.label || action.phoneNumber}`;
    case 'sms':
      return ui(language, 'sendMessage');
    case 'whatsapp':
      return ui(language, 'openWhatsapp');
    case 'email':
      return ui(language, 'sendEmail');
    case 'open_map':
      return ui(language, 'openInMaps');
    case 'navigate_to':
      return ui(language, 'startNavigation');
    case 'show_map':
      return action.label || ui(language, 'openInMaps');
    case 'timer':
      return `${ui(language, 'timerStarted')} · ${Math.round(action.seconds / 60)} min`;
    case 'alarm':
      return `${ui(language, 'alarmSet')} · ${action.clockTime}`;
    case 'reminder':
      return ui(language, 'reminderSet');
    case 'copy':
      return ui(language, 'copyText');
    case 'navigate_site':
      return action.label || 'Ouvrir la page';
    case 'open_url':
      return action.label || 'Ouvrir';
    default:
      return 'Ouvrir';
  }
}

/** Actions réellement utiles à l'utilisateur (on masque les indices serveur). */
export function visibleActions(actions: VoiceAction[] = []): VoiceAction[] {
  const filtered = actions.filter((action) => {
    if (action.type === 'speak' || action.type === 'stop_speaking' || action.type === 'request_permission') return false;
    if ('url' in action && typeof action.url === 'string' && action.url.startsWith('/api/')) return false;
    if (action.type === 'show_map' || action.type === 'show_weather' || action.type === 'show_list') return false;
    return true;
  });
  // Une seule entrée « carte » et une seule « navigation » pour rester lisible.
  const seen = new Set<string>();
  return filtered.filter((action) => {
    const key = `${action.type}:${'url' in action ? action.url : action.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const VoiceActionButtons: React.FC<VoiceActionButtonsProps> = ({ actions, language, onExecute, compact }) => {
  const items = visibleActions(actions);
  if (!items.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
      {items.map((action, index) => {
        const Icon = ACTION_ICON[action.type] || ExternalLink;
        const label = actionLabel(action, language);
        const primary = action.type === 'call' || action.type === 'navigate_to' || index === 0;
        return (
          <button
            key={`${action.type}-${index}`}
            type="button"
            onClick={() => onExecute(action)}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
              primary
                ? 'bg-[#01184C] text-white shadow-md hover:bg-[#0A2254] hover:shadow-lg dark:bg-[#D4AF37] dark:text-[#01184C] dark:hover:bg-[#E5C358]'
                : 'border border-slate-200 bg-white text-[#0E1D38] shadow-2xs hover:border-[#D4AF37]/60 hover:bg-slate-50 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-100 dark:hover:bg-[#122D68]'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[180px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

interface VoiceCardViewProps {
  card: VoiceCard;
  language: VoiceLanguage;
  onExecute: (action: VoiceAction) => void;
}

/** Carte riche : lieu, itinéraire, météo, contact, info. */
export const VoiceCardView: React.FC<VoiceCardViewProps> = ({ card, language, onExecute }) => {
  const isMapCard = card.kind === 'place' || card.kind === 'route';
  const mapQuery = isMapCard ? card.title : undefined;

  return (
    <article className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#183B7A] dark:bg-[#0A1F4B]">
      {isMapCard && mapQuery && (
        <div className="relative h-40 w-full bg-slate-100 dark:bg-[#07193F]">
          <iframe
            title={`Carte ${card.title}`}
            src={googleMapsEmbedUrl(mapQuery)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-[#0E1D38] dark:text-white">{card.title}</h4>
            {card.subtitle && <p className="mt-0.5 text-xs text-[#536582] dark:text-slate-300">{card.subtitle}</p>}
          </div>
          <span className="shrink-0 rounded-full bg-[#D4AF37]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8a6d10] dark:text-[#D4AF37]">
            {card.kind}
          </span>
        </div>

        {card.meta && card.meta.length > 0 && (
          <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-[#132C5E]">
            {card.meta.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-3 text-xs">
                <dt className="shrink-0 text-[#536582] dark:text-slate-400">{item.label}</dt>
                <dd className="truncate text-right font-medium text-[#0E1D38] dark:text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {(card.primaryAction || card.secondaryAction) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {card.primaryAction && (
              <button
                type="button"
                onClick={() => onExecute(card.primaryAction!)}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#D4AF37] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-[#01184C] transition-colors hover:bg-[#E5C358]"
              >
                {card.primaryAction.type === 'navigate_to' || card.primaryAction.type === 'open_map' ? (
                  <Navigation className="h-4 w-4" />
                ) : card.primaryAction.type === 'call' ? (
                  <Phone className="h-4 w-4" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {actionLabel(card.primaryAction, language)}
              </button>
            )}
            {card.secondaryAction && (
              <button
                type="button"
                onClick={() => onExecute(card.secondaryAction!)}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-[#0E1D38] transition-colors hover:border-[#D4AF37]/60 hover:bg-slate-50 dark:border-[#1A3875]/60 dark:text-slate-100 dark:hover:bg-[#122D68]"
              >
                <ExternalLink className="h-4 w-4" />
                {actionLabel(card.secondaryAction, language)}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

interface VoiceSuggestionsProps {
  suggestions?: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export const VoiceSuggestions: React.FC<VoiceSuggestionsProps> = ({ suggestions, onSelect, disabled }) => {
  if (!suggestions?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {suggestions.slice(0, 4).map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="min-h-[34px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-2xs transition-all hover:border-[#D4AF37]/60 hover:bg-slate-50 disabled:opacity-50 dark:border-[#1A3875]/60 dark:bg-[#0B214E]/70 dark:text-slate-200 dark:hover:bg-[#122D68]"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default VoiceActionButtons;
