import { LANGUAGE_META, getLanguageMeta, ui } from './languages';
import { detectIntent, detectVoiceLanguage, extractQuery, suggestPlaces, toE164Niger } from './intents';
import {
  EMERGENCY_CONTACTS,
  PLACE_CATEGORY_KEYWORDS,
  matchNigerFact,
  matchNigerPlace,
  trilingual,
} from './nigerKnowledge';
import {
  buildContactCard,
  buildMapActions,
  detectTravelMode,
  googleMapsSearchUrl,
  mailtoUrl,
  smsUrl,
  telUrl,
  whatsappUrl,
} from './mapsLinks';
import type {
  AssistantContext,
  AssistantTurn,
  VoiceAction,
  VoiceCard,
  VoiceIntent,
  VoiceLanguage,
  VoiceSlots,
} from './types';

/**
 * ISA — Cerveau déterministe (hors-ligne)
 * =======================================
 * Transforme une phrase parlée en réponse + actions exécutables, sans aucun
 * appel réseau. C'est lui qui répond quand :
 *   • l'appareil est hors-ligne (brousse, coupure, avion),
 *   • le serveur local de Niamey est utilisé sans Internet,
 *   • l'intention est simple et doit être immédiate (Siri ne réfléchit pas
 *     trois secondes pour donner l'heure).
 *
 * Quand il ne sait pas répondre, il renvoie `intent: 'unknown'` : l'appelant
 * interroge alors un LLM (Gemini ou le modèle local Ollama/llama.cpp).
 */

type Phrase = { fr: string; dje: string; ha: string; en?: string };

function say(language: VoiceLanguage, phrase: Phrase): string {
  if (language === 'dje') return phrase.dje || phrase.fr;
  if (language === 'ha') return phrase.ha || phrase.fr;
  if (language === 'en') return phrase.en || phrase.fr;
  return phrase.fr;
}

const NIAMEY_TZ = 'Africa/Niamey';

export function formatNiameyTime(language: VoiceLanguage, now = new Date()): string {
  const locale = language === 'ha' || language === 'dje' ? 'fr-FR' : language === 'en' ? 'en-GB' : 'fr-FR';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: NIAMEY_TZ,
  }).format(now);
}

export function formatNiameyDate(language: VoiceLanguage, now = new Date()): string {
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';
  const text = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: NIAMEY_TZ,
  }).format(now);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function emptyTurn(language: VoiceLanguage, intent: VoiceIntent): AssistantTurn {
  return {
    reply: '',
    speak: '',
    language,
    intent,
    slots: {},
    actions: [],
    cards: [],
    suggestions: [],
    source: 'local-rule',
    offline: true,
  };
}

/** Suggestions de relance, dans la langue de l'utilisateur. */
export function suggestionsFor(intent: VoiceIntent, language: VoiceLanguage): string[] {
  const bank: Record<VoiceIntent, Phrase[]> = {
    greeting: [
      { fr: 'Quelle heure est-il ?', dje: 'Waati cendi?', ha: 'Ƙarfe nawa yanzu?' },
      { fr: 'Conduis-moi au Grand Marché', dje: 'Ma ay ne koy Grand Marché', ha: 'Kai ni Babbar Kasuwa' },
      { fr: 'Météo à Niamey', dje: 'Niamey handu', ha: 'Yanayin Niamey' },
    ],
    thanks: [
      { fr: 'Autre chose ?', dje: 'Hay fo tana?', ha: 'Wani abu?' },
      { fr: 'Appeler Excellence Services', dje: 'Excellence Services telefon', ha: 'Kira Excellence Services' },
    ],
    identity: [
      { fr: 'Que peux-tu faire ?', dje: 'Ni ga hin ma tee may?', ha: 'Me zaka iya yi?' },
      { fr: 'Parle-moi zarma', dje: 'Ma sanni zarma', ha: 'Yi magana da Hausa' },
    ],
    help: [
      { fr: 'Où est la pharmacie la plus proche ?', dje: 'Mar no darzanka hayey nangu?', ha: 'Ina kantan magani mafi kusa?' },
      { fr: 'Minuteur 10 minutes', dje: 'Waati minti 10', ha: 'Naƙilar mintuna 10' },
      { fr: 'Appelle le 17', dje: 'Polisi telefon 17', ha: 'Kira 17' },
    ],
    navigate: [
      { fr: 'C’est loin ?', dje: 'A ga moora?', ha: 'Yaya nisa?' },
      { fr: 'À pied', dje: 'Koy ne banda', ha: 'Tafiya a ƙafa' },
      { fr: 'Ouvrir dans Google Maps', dje: 'Google Maps ra feeri', ha: 'Buɗe a Google Maps' },
    ],
    find_place: [
      { fr: 'Conduis-moi là-bas', dje: 'Ma ay ne koy nangu wo', ha: 'Kai ni can' },
      { fr: 'Chercher une autre ville', dje: 'Kwaara tana ceeci', ha: 'Nemi wani gari' },
    ],
    distance: [
      { fr: 'Lancer la navigation', dje: 'Fondo tun', ha: 'Fara jagora' },
      { fr: 'Où est-ce ?', dje: 'May no wo?', ha: 'Ina wannan?' },
    ],
    call: [
      { fr: 'Envoyer un SMS aussi', dje: 'Sanni mo sanba', ha: 'Aika saƙo ma' },
      { fr: 'Ouvrir WhatsApp', dje: 'WhatsApp feeri', ha: 'Buɗe WhatsApp' },
    ],
    sms: [
      { fr: 'Appeler après', dje: 'Telefon bandaa', ha: 'Yi kira daga baya' },
      { fr: 'Envoyer sur WhatsApp', dje: 'Sanba WhatsApp ra', ha: 'Aika ta WhatsApp' },
    ],
    whatsapp: [
      { fr: 'Appeler directement', dje: 'Telefon kayantey', ha: 'Yi kira kai tsaye' },
    ],
    email: [
      { fr: 'Appeler l’entreprise', dje: 'Goy fu telefon', ha: 'Kira kamfani' },
    ],
    time: [
      { fr: 'Quel jour sommes-nous ?', dje: 'Zaari cendi?', ha: 'Wace rana ce yau?' },
      { fr: 'Météo à Niamey', dje: 'Niamey handu', ha: 'Yanayin Niamey' },
    ],
    date: [
      { fr: 'Quelle heure est-il ?', dje: 'Waati cendi?', ha: 'Ƙarfe nawa?' },
    ],
    weather: [
      { fr: 'Météo à Zinder', dje: 'Zindi handu', ha: 'Yanayin Zinder' },
      { fr: 'Conduis-moi à l’abri', dje: 'Ma ay ne koy nangu kayantey', ha: 'Kai ni wurin ɗaukar maƙwabo' },
    ],
    timer: [
      { fr: 'Annuler le minuteur', dje: 'Waati tuusu', ha: 'Soke ƙidayar' },
      { fr: 'Alarme à 6h00', dje: 'Alarme suba 6', ha: 'Agogo da 6:00' },
    ],
    alarm: [
      { fr: 'Météo demain matin', dje: 'Suba handu', ha: 'Yanayin gobe da safe' },
    ],
    reminder: [
      { fr: 'Voir mes rappels', dje: 'Ay hongrey cebe', ha: 'Nuna tunatarwa' },
    ],
    translate: [
      { fr: 'Traduire en haoussa', dje: 'Barmay hausa ra', ha: 'Fassara zuwa Zarma' },
    ],
    company_services: [
      { fr: 'Demander un devis', dje: 'Nooru hãã ceeci', ha: 'Nemi farashi' },
      { fr: 'Contacter l’entreprise', dje: 'Goy fu da', ha: 'Tuntubi kamfani' },
    ],
    company_quote: [
      { fr: 'Voir la page devis', dje: 'Devis moɲu feeri', ha: 'Buɗe shafin farashi' },
    ],
    company_contact: [
      { fr: 'Appeler maintenant', dje: 'Da sohonno', ha: 'Yi kira yanzu' },
      { fr: 'Écrire sur WhatsApp', dje: 'Hantum WhatsApp ra', ha: 'Rubuta ta WhatsApp' },
    ],
    company_hours: [
      { fr: 'Où sont vos bureaux ?', dje: 'Mar no ni fu?', ha: 'Ina ofisinku?' },
    ],
    company_location: [
      { fr: 'Lancer la navigation', dje: 'Fondo tun', ha: 'Fara jagora' },
    ],
    emergency: [
      { fr: 'Appeler la police (17)', dje: 'Polisi da (17)', ha: 'Kira ‘yan sanda (17)' },
      { fr: 'Appeler les pompiers (18)', dje: 'Danwasu da (18)', ha: 'Kira sojojin wuta (18)' },
      { fr: 'Appeler le SAMU (15)', dje: 'Darzanka da (15)', ha: 'Kira agajin asibiti (15)' },
    ],
    open_site: [
      { fr: 'Page services', dje: 'Goy moɲu', ha: 'Shafin ayyuka' },
      { fr: 'Page contact', dje: 'Da moɲu', ha: 'Shafin tuntuba' },
    ],
    search_web: [
      { fr: 'Ouvrir le résultat', dje: 'Feeri hayey', ha: 'Buɗe sakamako' },
    ],
    play_music: [
      { fr: 'Arrêter la musique', dje: 'Wasan dabba', ha: 'Daina kiɗa' },
    ],
    stop_speaking: [{ fr: 'Je vous écoute', dje: 'Ay ga hã', ha: 'Ina sauraro' }],
    repeat: [{ fr: 'Parlez plus lentement', dje: 'Ma sanni a hãayan', ha: 'Yi magana a hankali' }],
    unknown: [
      { fr: 'Que peux-tu faire ?', dje: 'Ni ga hin ma tee may?', ha: 'Me zaka iya yi?' },
      { fr: 'Où est le Grand Marché ?', dje: 'Mar no Grand Marché?', ha: 'Ina Babbar Kasuwa?' },
      { fr: 'Appeler Excellence Services', dje: 'Excellence Services telefon', ha: 'Kira Excellence Services' },
    ],
  };
  const items = bank[intent] || bank.unknown;
  return items.map((item) => say(language, item));
}

/** Résout le numéro d'un contact connu (entreprise, urgences, favoris). */
function resolveContactNumber(
  contact: string | undefined,
  phoneNumber: string | undefined,
  context: AssistantContext,
): { number?: string; name?: string } {
  if (phoneNumber) return { number: toE164Niger(phoneNumber), name: phoneNumber };
  const value = String(contact || '').toLowerCase().trim();
  if (!value) return {};

  const site = context.siteContext;
  if (site?.phones?.length) {
    for (const phone of site.phones) {
      const label = String(phone.label || '').toLowerCase();
      if (value.includes('excellence') || value.includes('entreprise') || value.includes('société') || value.includes('societe') || value.includes('commercial') || value.includes('bureau')) {
        return { number: `+${phone.raw}`, name: phone.label || site.companyName };
      }
      if (label && (value.includes(label) || label.includes(value))) {
        return { number: `+${phone.raw}`, name: phone.label };
      }
    }
  }

  const emergency = EMERGENCY_CONTACTS.find(
    (item) =>
      value.includes(item.number) ||
      trilingual(item.label, 'fr').toLowerCase().split(' ').some((word) => word.length > 3 && value.includes(word)) ||
      trilingual(item.label, 'ha').toLowerCase().split(' ').some((word) => word.length > 3 && value.includes(word)),
  );
  if (emergency) {
    return { number: emergency.dialable, name: trilingual(emergency.label, 'fr') };
  }

  return { name: contact };
}

/**
 * Point d'entrée principal : comprend une phrase et produit la réponse ISA.
 * Retourne `null` quand aucune règle locale ne sait traiter la demande.
 */
export function runLocalBrain(utterance: string, context: AssistantContext): AssistantTurn | null {
  const text = String(utterance || '').trim();
  if (!text) return null;

  const language: VoiceLanguage = detectVoiceLanguage(text, context.language);
  const { intent, slots, confidence } = detectIntent(text, language);
  if (intent === 'unknown' || confidence < 0.3) return null;

  const turn = emptyTurn(language, intent);
  turn.slots = slots;
  turn.confidence = confidence;
  turn.suggestions = suggestionsFor(intent, language);

  const site = context.siteContext;
  const origin = context.position ? { lat: context.position.lat, lon: context.position.lon } : undefined;

  switch (intent) {
    case 'greeting': {
      const hour = Number(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', timeZone: NIAMEY_TZ }).format(new Date()));
      const period =
        hour < 12
          ? { fr: 'Bonjour', dje: 'Fofo, suba tonton', ha: 'Barka da safe' }
          : hour < 18
            ? { fr: 'Bonjour', dje: 'Fofo, zaari tonton', ha: 'Barka da rana' }
            : { fr: 'Bonsoir', dje: 'Fofo, hane tonton', ha: 'Barka da yamma' };
      turn.reply = `${say(language, period)} ! ${say(language, {
        fr: 'Je suis ISA, votre assistant vocal du Niger. Que puis-je faire ?',
        dje: 'Ay maa ti ISA, ni faaba-ize Niger ra. Ay ma tee may ni se?',
        ha: 'Ni ne ISA, mataimakinka na Nijar. Me kake so in yi maka?',
        en: "I'm ISA, your voice assistant for Niger. What can I do?",
      })}`;
      turn.speak = turn.reply;
      return turn;
    }

    case 'thanks': {
      turn.reply = say(language, {
        fr: 'Avec plaisir. Je reste à votre écoute.',
        dje: 'Ay farhã. Ay go ne hãyan ra.',
        ha: 'Na gode. Ina nan ina sauraro.',
        en: 'My pleasure. I am still listening.',
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'identity': {
      turn.reply = say(language, {
        fr: "Je suis ISA, l'assistant vocal du Niger créé par Excellence Services SARL à Niamey. Je parle français, zarma et haoussa. Je peux vous guider sur la carte, passer des appels, envoyer des messages, régler des alarmes et répondre à vos questions sur le Niger — même sans Internet.",
        dje: 'Ay maa ti ISA, Niger sanni faaba-ize. Excellence Services SARL Niamey n a tee. Ay ga sanni faransi, zarma nda hausa. Ay ga hin ma ni fondo cebe, telefon da, sanni sanba, nda Niger laakaley yaŋ cebe, interneti si no mo.',
        ha: 'Ni ne ISA, mataimaki na Nijar wanda Excellence Services SARL Niamey ta ƙirƙira. Ina magana da Faransanci, Zarma da Hausa. Zan iya jagorantar ku a taswira, yin kira, aika saƙo, saita agogo, da amsa tambayoyi game da Nijar — ko babu intanet.',
        en: "I'm ISA, Niger's voice assistant built by Excellence Services SARL in Niamey. I speak French, Zarma and Hausa: maps, calls, messages, alarms and answers about Niger — even offline.",
      });
      turn.speak = turn.reply;
      turn.cards.push({
        kind: 'info',
        title: 'ISA',
        subtitle: trilingual({ fr: 'Assistant vocal du Niger', dje: 'Niger sanni faaba-ize', ha: 'Mataimakin Nijar' }, language),
        meta: [
          { label: ui(language, 'language'), value: ['Français', 'Zarma (Zarmaciine)', 'Hausa'].join(' · ') },
          { label: 'TTS local', value: `${LANGUAGE_META.dje.serverTtsModel}, ${LANGUAGE_META.ha.serverTtsModel}` },
        ],
      });
      return turn;
    }

    case 'help': {
      turn.reply = say(language, {
        fr: 'Dites par exemple : « Conduis-moi au Grand Marché », « Où est la pharmacie la plus proche ? », « Quelle heure est-il ? », « Météo à Niamey », « Minuteur 10 minutes », « Alarme à 6h30 », « Appelle le 17 », « Envoie un SMS à… », « Traduis en haoussa », ou « Quels sont vos services ? ».',
        dje: 'Ma sanni waalo: « Ma ay ne koy Grand Marché », « Mar no darzanka hayey nangu? », « Waati cendi? », « Minuti 10 waati », « Alarme suba 6:30 », « Polisi telefon 17 », « Sanni sanba… », wala « Ni goyey se? ».',
        ha: 'Ka ce misali: « Kai ni Babbar Kasuwa », « Ina kantan magani mafi kusa? », « Ƙarfe nawa yanzu? », « Yanayin Niamey », « Naƙilar mintuna 10 », « Agogo da 6:30 », « Kira 17 », « Aika saƙo zuwa… », « Fassara zuwa Zarma », ko « Me kuke yi? ».',
        en: 'Try: “Take me to the Grand Marché”, “Where is the nearest pharmacy?”, “What time is it?”, “Weather in Niamey”, “Timer 10 minutes”, “Alarm at 6:30”, “Call 17”, “Text …”, “Translate into Hausa”, or “What are your services?”.',
      });
      turn.speak = turn.reply;
      turn.cards.push({
        kind: 'info',
        title: ui(language, 'tryExamples'),
        subtitle: 'Siri-like · Zarma · Hausa · Français',
        meta: [
          { label: '🗺️ Maps', value: 'navigate, find, distance' },
          { label: '📞 Phone', value: 'call, SMS, WhatsApp, email' },
          { label: '⏰ Time', value: 'time, date, timer, alarm, reminder' },
          { label: '🌦️ Weather', value: 'Niamey, Zinder, Agadez…' },
          { label: '🌍 Offline', value: 'Niger knowledge base' },
        ],
      });
      return turn;
    }

    case 'stop_speaking': {
      turn.reply = say(language, { fr: 'D’accord, je me tais.', dje: 'Ayyo, ay ga cindi.', ha: 'To, na shiru.', en: 'Okay, I will stop.' });
      turn.speak = '';
      turn.actions.push({ type: 'stop_speaking' });
      return turn;
    }

    case 'repeat': {
      turn.reply = say(language, { fr: 'Je répète.', dje: 'Ay ga ye.', ha: 'Zan maimaita.', en: 'Repeating.' });
      turn.speak = turn.reply;
      return turn;
    }

    case 'time': {
      const time = formatNiameyTime(language);
      turn.reply = say(language, {
        fr: `Il est ${time} à Niamey.`,
        dje: `Waati ti ${time} Niamey ra.`,
        ha: `Yanzu ƙarfe ${time} a Niamey.`,
        en: `It is ${time} in Niamey.`,
      });
      turn.speak = turn.reply;
      turn.cards.push({ kind: 'info', title: `${time}`, subtitle: 'Africa/Niamey · GMT+1' });
      return turn;
    }

    case 'date': {
      const date = formatNiameyDate(language);
      turn.reply = say(language, {
        fr: `Nous sommes le ${date}.`,
        dje: `Hunkuna ti ${date}.`,
        ha: `Yau ranar ${date} ce.`,
        en: `Today is ${date}.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'emergency': {
      turn.reply = say(language, {
        fr: 'Urgence au Niger : police 17, sapeurs-pompiers 18, assistance médicale 15. Je peux appeler tout de suite.',
        dje: 'Niger faaba lambayaŋ: polisi 17, danwasu 18, darzanka 15. Ay ga hin ma da sohonno.',
        ha: 'Lambobin agaji a Nijar: ‘yan sanda 17, sojojin wuta 18, agajin asibiti 15. Zan iya kira yanzu.',
        en: 'Niger emergencies: police 17, fire 18, medical 15. I can call right away.',
      });
      turn.speak = turn.reply;
      EMERGENCY_CONTACTS.forEach((item) => {
        turn.actions.push({ type: 'call', phoneNumber: item.dialable, label: trilingual(item.label, language) });
        turn.cards.push({
          kind: 'contact',
          title: `${trilingual(item.label, language)} · ${item.number}`,
          subtitle: item.available24h ? '24h/24 · 7j/7' : undefined,
          primaryAction: { type: 'call', phoneNumber: item.dialable, label: trilingual(item.label, language) },
        });
      });
      turn.suggestions = suggestionsFor('emergency', language);
      return turn;
    }

    case 'navigate':
    case 'distance':
    case 'find_place': {
      const destination = slots.destination || (slots.query ? slots.query : undefined);
      const category = slots.placeCategory ? PLACE_CATEGORY_KEYWORDS[slots.placeCategory] : undefined;
      const mode = detectTravelMode(text);

      if (category && !destination) {
        const label = trilingual(category.label, language);
        turn.reply = say(language, {
          fr: `Je cherche ${label} près de vous. Ouvrez la carte pour voir les résultats les plus proches.`,
          dje: `Ay ga ceeci ${label} ni gaa. Karte feeri ma dii.`,
          ha: `Ina neman ${label} kusa da kai. Buɗe taswira don ganin sakamako.`,
          en: `Searching for ${label} near you. Open the map to see the closest results.`,
        });
        turn.speak = turn.reply;
        const query = `${trilingual(category.label, 'fr')} Niamey Niger`;
        turn.actions.push(
          { type: 'open_url', url: `/api/geo/nearby?category=${slots.placeCategory}&radius=5000&format=json`, label: 'API proximité (OSM)', external: false },
          { type: 'show_map', query, label: trilingual(category.label, language), zoom: 14 },
          { type: 'open_map', url: googleMapsSearchUrl(query), label: trilingual(category.label, language) },
        );
        turn.cards.push({
          kind: 'place',
          title: trilingual(category.label, language),
          subtitle: say(language, { fr: 'Recherche autour de votre position', dje: 'Ni nangu gaa ceeci', ha: 'Neman kusa da wurin ka', en: 'Searching around you' }),
          primaryAction: { type: 'open_map', url: googleMapsSearchUrl(query), label: trilingual(category.label, language) },
        });
        turn.offline = false;
        turn.source = 'local-rule';
        return turn;
      }

      if (!destination) {
        turn.reply = say(language, {
          fr: 'Dites-moi où vous voulez aller, par exemple « Conduis-moi au Grand Marché ».',
          dje: 'Ma ay ce may ne ni ga ba ma koy. Waalo: « Ma ay ne koy Grand Marché ».',
          ha: 'Ka faɗa mini ina kake son zuwa, misali: « Kai ni Babbar Kasuwa ».',
          en: 'Tell me where to go, for example “Take me to the Grand Marché”.',
        });
        turn.speak = turn.reply;
        return turn;
      }

      const knownPlace = matchNigerPlace(destination);
      const { actions, card } = buildMapActions({ destination, origin, mode, language });
      turn.actions.push(...actions);
      if (card) turn.cards.push(card);

      const travelWord =
        mode === 'walking'
          ? { fr: 'à pied', dje: 'ne banda', ha: 'a ƙafa', en: 'walking' }
          : mode === 'transit'
            ? { fr: 'en transport', dje: 'motokar ra', ha: 'da mota', en: 'by transit' }
            : { fr: 'en voiture', dje: 'motokar ra', ha: 'da mota', en: 'by car' };

      if (knownPlace?.distanceFromNiameyKm && knownPlace.distanceFromNiameyKm > 0 && !origin) {
        turn.reply = say(language, {
          fr: `Itinéraire vers ${knownPlace.name}, ${travelWord.fr}. Depuis Niamey, comptez environ ${knownPlace.distanceFromNiameyKm} km — je calcule la durée exacte dès qu'un réseau est disponible.`,
          dje: `Fondo ${knownPlace.name} se, ${travelWord.dje}. Niamey ra, a ga moora km ${knownPlace.distanceFromNiameyKm} ra.`,
          ha: `Hanya zuwa ${knownPlace.name}, ${travelWord.ha}. Daga Niamey, kimanin kilomita ${knownPlace.distanceFromNiameyKm}.`,
          en: `Route to ${knownPlace.name}, ${travelWord.en}. From Niamey, about ${knownPlace.distanceFromNiameyKm} km.`,
        });
      } else if (origin) {
        turn.reply = say(language, {
          fr: `Je lance la navigation vers ${destination}, ${travelWord.fr}.`,
          dje: `Ay ga fondo tun ${destination} se, ${travelWord.dje}.`,
          ha: `Na fara jagora zuwa ${destination}, ${travelWord.ha}.`,
          en: `Starting navigation to ${destination}, ${travelWord.en}.`,
        });
      } else {
        turn.reply = say(language, {
          fr: `Voici ${destination} sur la carte. Je peux lancer la navigation.`,
          dje: `${destination} ga kart ra. Ay ga hin ma fondo tun.`,
          ha: `Ga ${destination} a taswira. Zan iya fara jagora.`,
          en: `Here is ${destination} on the map. I can start navigation.`,
        });
      }
      turn.speak = turn.reply;

      if (knownPlace?.note) {
        turn.cards[0] = { ...turn.cards[0], subtitle: trilingual(knownPlace.note, language) } as VoiceCard;
      }
      // Hors-ligne seulement si le lieu est connu de la base Niger.
      turn.offline = Boolean(knownPlace);
      if (!knownPlace) turn.actions.push({ type: 'open_url', url: `/api/geo/search?q=${encodeURIComponent(destination)}`, label: 'Géocodage OSM', external: false });
      return turn;
    }

    case 'call': {
      const resolved = resolveContactNumber(slots.contact, slots.phoneNumber, context);
      if (!resolved.number) {
        turn.reply = say(language, {
          fr: 'Qui dois-je appeler ? Donnez-moi un nom ou un numéro.',
          dje: 'May se ay ga telefon? Ma maa wala lamba ay se ce.',
          ha: 'Wa zan kira? Ka ba ni suna ko lamba.',
          en: 'Who should I call? Give me a name or a number.',
        });
        turn.speak = turn.reply;
        return turn;
      }
      const { actions, card } = buildContactCard({
        name: resolved.name || resolved.number,
        phoneNumber: resolved.number,
        language,
      });
      turn.actions.push(...actions);
      if (card) turn.cards.push(card);
      turn.reply = say(language, {
        fr: `J'appelle ${resolved.name || resolved.number}.`,
        dje: `Ay ga ${resolved.name || resolved.number} telefon.`,
        ha: `Ina kiran ${resolved.name || resolved.number}.`,
        en: `Calling ${resolved.name || resolved.number}.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'sms':
    case 'whatsapp': {
      const resolved = resolveContactNumber(slots.contact, slots.phoneNumber, context);
      if (!resolved.number) {
        turn.reply = say(language, {
          fr: 'À qui dois-je envoyer le message ?',
          dje: 'May se ay ga sanni sanba?',
          ha: 'Wa zan aika saƙo?',
          en: 'Who should I message?',
        });
        turn.speak = turn.reply;
        return turn;
      }
      const builder = intent === 'whatsapp' ? whatsappUrl : smsUrl;
      turn.actions.push({
        type: intent === 'whatsapp' ? 'whatsapp' : 'sms',
        phoneNumber: resolved.number,
        body: slots.message,
      });
      turn.actions.push({ type: 'open_url', url: builder(resolved.number, slots.message), label: resolved.name || resolved.number, external: true });
      turn.cards.push({
        kind: 'contact',
        title: resolved.name || resolved.number,
        subtitle: slots.message || say(language, { fr: 'Message à compléter', dje: 'Sanni ka tonton', ha: 'Saƙo da za a kammala', en: 'Message to complete' }),
        primaryAction: {
          type: intent === 'whatsapp' ? 'whatsapp' : 'sms',
          phoneNumber: resolved.number,
          body: slots.message,
        },
      });
      turn.reply = say(language, {
        fr: intent === 'whatsapp' ? `J'ouvre WhatsApp pour ${resolved.name || resolved.number}.` : `J'ouvre le SMS pour ${resolved.name || resolved.number}.`,
        dje: `Ay ga ${intent === 'whatsapp' ? 'WhatsApp' : 'SMS'} feeri ${resolved.name || resolved.number} se.`,
        ha: intent === 'whatsapp' ? `Na buɗe WhatsApp don ${resolved.name || resolved.number}.` : `Na buɗe saƙo don ${resolved.name || resolved.number}.`,
        en: intent === 'whatsapp' ? `Opening WhatsApp for ${resolved.name || resolved.number}.` : `Opening the message for ${resolved.name || resolved.number}.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'email': {
      const address = site?.email || 'admin@excellence-services-sarl.com';
      turn.actions.push({ type: 'email', address, subject: undefined, body: slots.message });
      turn.actions.push({ type: 'open_url', url: mailtoUrl(address, undefined, slots.message), label: address, external: true });
      turn.reply = say(language, {
        fr: `J'ouvre un e-mail vers ${address}.`,
        dje: `Ay ga email feeri ${address} se.`,
        ha: `Na buɗe imel zuwa ${address}.`,
        en: `Opening an email to ${address}.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'timer': {
      const minutes = slots.minutes || 5;
      const seconds = Math.max(30, minutes * 60);
      turn.actions.push({ type: 'timer', seconds, label: `${minutes} min` });
      turn.reply = say(language, {
        fr: `Minuteur de ${minutes} minutes lancé.`,
        dje: `Waati minti ${minutes} tun.`,
        ha: `Na fara ƙidayar mintuna ${minutes}.`,
        en: `Timer set for ${minutes} minutes.`,
      });
      turn.speak = turn.reply;
      turn.cards.push({ kind: 'timer', title: `${minutes} min`, subtitle: ui(language, 'timerStarted') });
      return turn;
    }

    case 'alarm': {
      const clockTime = slots.clockTime || (slots.minutes ? '' : '06:00');
      turn.actions.push({ type: 'alarm', clockTime: clockTime || '06:00', label: 'ISA alarme' });
      turn.reply = clockTime
        ? say(language, {
            fr: `Alarme réglée à ${clockTime}.`,
            dje: `Alarme soola ${clockTime}.`,
            ha: `An saita agogo da ${clockTime}.`,
            en: `Alarm set for ${clockTime}.`,
          })
        : say(language, {
            fr: 'À quelle heure dois-je vous réveiller ?',
            dje: 'Waati cendi ay ma ni tun?',
            ha: 'A wane lokaci in farka ka?',
            en: 'At what time should I wake you?',
          });
      turn.speak = turn.reply;
      return turn;
    }

    case 'reminder': {
      turn.actions.push({ type: 'reminder', text: slots.message || text, clockTime: slots.clockTime, minutes: slots.minutes });
      turn.reply = say(language, {
        fr: 'Rappel créé. Je vous préviendrai.',
        dje: 'Hongro soola. Ay ga ni ce.',
        ha: 'An saita tunatarwa. Zan sanar da ka.',
        en: 'Reminder created. I will let you know.',
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'weather': {
      const city = slots.destination || 'Niamey';
      turn.actions.push({ type: 'show_weather', city });
      turn.actions.push({
        type: 'open_url',
        url: `/api/geo/weather?city=${encodeURIComponent(city)}`,
        label: 'Open-Meteo (sans clé)',
        external: false,
      });
      turn.reply = say(language, {
        fr: `Je récupère la météo de ${city}.`,
        dje: `Ay ga ${city} handu ceeci.`,
        ha: `Ina kawo yanayin ${city}.`,
        en: `Fetching the weather for ${city}.`,
      });
      turn.speak = turn.reply;
      turn.offline = false;
      return turn;
    }

    case 'translate': {
      const target = slots.targetLanguage || (language === 'fr' ? 'ha' : 'fr');
      turn.actions.push({ type: 'open_url', url: `/api/voice/translate?target=${target}&text=${encodeURIComponent(text.slice(0, 200))}`, label: 'Traduction', external: false });
      turn.reply = say(language, {
        fr: `Je peux traduire vers le ${getLanguageMeta(target).label}. Donnez-moi la phrase à traduire.`,
        dje: `Ay ga hin ma barmay ${getLanguageMeta(target).label} ra. Ma sanni ay se ce.`,
        ha: `Zan iya fassara zuwa ${getLanguageMeta(target).label}. Ka ba ni jumlar.`,
        en: `I can translate into ${getLanguageMeta(target).label}. Give me the sentence.`,
      });
      turn.speak = turn.reply;
      turn.offline = false;
      return turn;
    }

    case 'company_services': {
      turn.actions.push({ type: 'navigate_site', path: '/services', label: 'Services' });
      turn.reply = say(language, {
        fr: 'Excellence Services SARL accompagne les entreprises et institutions au Niger : relation client et centres de contact, transformation digitale, logistique, formation, e-commerce et conseil. Je peux ouvrir la page des services.',
        dje: 'Excellence Services SARL ga goy nisongo nda laamurey se Niger ra: boro daabari, interneti goy, fondo goy, karandi, feeri nda laakal. Ay ga hin ma goy moɲu feeri.',
        ha: 'Excellence Services SARL tana taimaka kamfanoni a Nijar: hulɗar abokin ciniki, canjin dijital, dabaru, horo, kasuwanci da shawara. Zan iya buɗe shafin ayyuka.',
        en: 'Excellence Services SARL supports companies in Niger: customer relations, digital transformation, logistics, training, e-commerce and advisory. I can open the services page.',
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'company_quote': {
      turn.actions.push({ type: 'navigate_site', path: '/devis', label: 'Devis' });
      turn.reply = say(language, {
        fr: 'Pour un devis, remplissez le formulaire de devis ou appelez-nous : la réponse est traitée par un conseiller à Niamey.',
        dje: 'Nooru hãã se, devis moɲu toonandi wala ay telefon. Boro fo Niamey ga zaabi ce.',
        ha: 'Don samun farashi, cika fom ɗin buƙata ko ka kira mu: wani mai ba da shawara a Niamey zai amsa.',
        en: 'For a quote, fill in the request form or call us: an advisor in Niamey handles the reply.',
      });
      turn.speak = turn.reply;
      if (site?.phones?.[0]) {
        turn.actions.push({ type: 'call', phoneNumber: `+${site.phones[0].raw}`, label: site.phones[0].label });
      }
      return turn;
    }

    case 'company_contact': {
      const phones = site?.phones?.length ? site.phones : [];
      turn.reply = phones.length
        ? say(language, {
            fr: `Vous pouvez joindre ${site?.companyName || 'Excellence Services'} au ${phones[0].number}. E-mail : ${site?.email || 'admin@excellence-services-sarl.com'}.`,
            dje: `War ga hin ma ${site?.companyName || 'Excellence Services'} da ${phones[0].number}. E-mail: ${site?.email || 'admin@excellence-services-sarl.com'}.`,
            ha: `Za ku iya tuntubar ${site?.companyName || 'Excellence Services'} a ${phones[0].number}. Imel: ${site?.email || 'admin@excellence-services-sarl.com'}.`,
            en: `You can reach ${site?.companyName || 'Excellence Services'} on ${phones[0].number}. Email: ${site?.email || 'admin@excellence-services-sarl.com'}.`,
          })
        : say(language, {
            fr: 'La page contact regroupe nos numéros, l’e-mail et le formulaire.',
            dje: 'Da moɲu ra lambayaŋ kulu ga no.',
            ha: 'Shafin tuntuba yana da dukkan lambobi da imel.',
            en: 'The contact page lists all our numbers and email.',
          });
      turn.speak = turn.reply;
      turn.actions.push({ type: 'navigate_site', path: '/contact', label: 'Contact' });
      phones.forEach((phone) => {
        turn.actions.push({ type: 'call', phoneNumber: `+${phone.raw}`, label: phone.label });
        turn.cards.push({
          kind: 'contact',
          title: phone.label,
          subtitle: phone.number,
          primaryAction: { type: 'call', phoneNumber: `+${phone.raw}`, label: phone.label },
          secondaryAction: { type: 'whatsapp', phoneNumber: `+${phone.raw}` },
        });
      });
      if (site?.whatsappRaw) {
        turn.actions.push({ type: 'whatsapp', phoneNumber: `+${site.whatsappRaw}` });
      }
      return turn;
    }

    case 'company_hours': {
      const hours = site?.workingHours || 'Lundi – Vendredi : 09h30 – 17h30';
      turn.reply = say(language, {
        fr: `Nos horaires : ${hours}.`,
        dje: `Iri waati: ${hours}.`,
        ha: `Lokacin mu na aiki: ${hours}.`,
        en: `Our hours: ${hours}.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'company_location': {
      const location = site?.location || 'Niamey, Niger';
      const { actions, card } = buildMapActions({ destination: location, origin, language });
      turn.actions.push(...actions);
      if (card) turn.cards.push(card);
      turn.actions.push({ type: 'navigate_site', path: '/contact', label: 'Contact' });
      turn.reply = say(language, {
        fr: `Nos bureaux sont à ${location}. Je peux vous y conduire.`,
        dje: `Iri fu ga ${location} ra. Ay ga hin ma ni koy ne.`,
        ha: `Ofisoshinmu suna ${location}. Zan iya kai ku.`,
        en: `Our offices are in ${location}. I can take you there.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'open_site': {
      const target = detectSiteRoute(text, context.currentPage);
      turn.actions.push({ type: 'navigate_site', path: target.path, label: target.label });
      turn.reply = say(language, {
        fr: `J'ouvre ${target.label}.`,
        dje: `Ay ga ${target.label} feeri.`,
        ha: `Na buɗe ${target.label}.`,
        en: `Opening ${target.label}.`,
      });
      turn.speak = turn.reply;
      return turn;
    }

    case 'search_web': {
      const query = slots.query || extractQuery(text);
      turn.actions.push({ type: 'open_url', url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, label: query, external: true });
      turn.reply = say(language, {
        fr: `Je cherche « ${query} » sur Internet.`,
        dje: `Ay ga « ${query} » ceeci interneti ra.`,
        ha: `Ina neman « ${query} » a intanet.`,
        en: `Searching the web for “${query}”.`,
      });
      turn.speak = turn.reply;
      turn.offline = false;
      return turn;
    }

    case 'play_music': {
      turn.actions.push({ type: 'open_url', url: 'https://music.youtube.com/search?q=musique+niger', label: 'Musique du Niger', external: true });
      turn.reply = say(language, {
        fr: 'Je peux ouvrir une recherche de musique nigérienne. Le lecteur audio reste à configurer sur votre appareil.',
        dje: 'Ay ga hin ma Niger wasan ceeci feeri.',
        ha: 'Zan iya buɗe binciken kiɗan Nijar. Na’urar kunna tana bukatar saiti a wayar ka.',
        en: 'I can open a search for Nigerien music. The audio player still needs configuring on your device.',
      });
      turn.speak = turn.reply;
      turn.offline = false;
      return turn;
    }

    default: {
      // Fait pays connu (capitale, monnaie, climat…) : réponse 100 % hors-ligne.
      const fact = matchNigerFact(text);
      if (fact) {
        turn.intent = 'find_place';
        turn.reply = trilingual(fact.answer, language);
        turn.speak = turn.reply;
        turn.source = 'local-knowledge';
        turn.offline = true;
        turn.cards.push({ kind: 'info', title: 'Niger', subtitle: trilingual(fact.answer, language).slice(0, 120) });
        return turn;
      }

      const nearPlaces = suggestPlaces(text, 3);
      if (nearPlaces.length) {
        const top = nearPlaces[0];
        const { actions, card } = buildMapActions({ destination: top.name, origin, language });
        turn.intent = 'find_place';
        turn.actions.push(...actions);
        if (card) turn.cards.push(card);
        turn.reply = say(language, {
          fr: `Vous voulez dire ${top.name} ? Je l'affiche sur la carte.`,
          dje: `${top.name} no ni ga ba? Ay ga a cebe kart ra.`,
          ha: `Kana nufin ${top.name}? Zan nuna a taswira.`,
          en: `Did you mean ${top.name}? Showing it on the map.`,
        });
        turn.speak = turn.reply;
        turn.offline = true;
        turn.source = 'local-knowledge';
        return turn;
      }
      return null;
    }
  }
}

/** Correspondance phrase → route du site. */
function detectSiteRoute(text: string, currentPage?: string): { path: string; label: string } {
  const value = String(text || '').toLowerCase();
  const routes: Array<{ path: string; label: string; keywords: string[] }> = [
    { path: '/', label: 'Accueil', keywords: ['accueil', 'home', 'fu', 'shafi'] },
    { path: '/services', label: 'Services', keywords: ['service', 'prestation', 'goy', 'hiziba', 'ayyuka'] },
    { path: '/secteurs', label: 'Secteurs', keywords: ['secteur', 'sector', 'laabu', 'yanki'] },
    { path: '/realisations', label: 'Réalisations', keywords: ['réalisation', 'realisation', 'projet', 'goy benantey'] },
    { path: '/actualites', label: 'Actualités', keywords: ['actualité', 'actualite', 'news', 'labaru'] },
    { path: '/devis', label: 'Devis', keywords: ['devis', 'quote', 'prix', 'farashi'] },
    { path: '/contact', label: 'Contact', keywords: ['contact', 'joindre', 'da', 'tuntuba'] },
    { path: '/a-propos', label: 'À propos', keywords: ['à propos', 'a propos', 'about', 'entreprise'] },
    { path: '/assistant-ia', label: 'Assistant IA', keywords: ['assistant', 'chatbot', 'ia'] },
    { path: '/assistant-vocal', label: 'Assistant vocal', keywords: ['vocal', 'voix', 'sanni', 'murya'] },
  ];
  const match = routes.find((route) => route.keywords.some((keyword) => value.includes(keyword)));
  if (match) return match;
  return { path: currentPage || '/', label: 'Accueil' };
}

/**
 * Construit le prompt système utilisé quand on interroge un LLM (Gemini en
 * ligne, ou le modèle local sur le serveur de Niamey). Il verrouille la langue
 * de réponse et interdit d'inventer des coordonnées.
 */
export function buildVoiceSystemPrompt(context: AssistantContext, utteranceLanguage: VoiceLanguage): string {
  const site = context.siteContext;
  const languageName = getLanguageMeta(utteranceLanguage).label;
  const currentDate = formatNiameyDate('fr');
  return [
    'Tu es ISA, l’assistant vocal du Niger, créé par Excellence Services SARL à Niamey.',
    `Réponds UNIQUEMENT en ${languageName}, avec des phrases courtes et parlées (2 à 3 phrases maximum), comme un assistant vocal de type Siri.`,
    `Date et heure de référence : ${currentDate}, fuseau Africa/Niamey (GMT+1).`,
    'Tu comprends le français, le zarma (Zarmaciine, Niger occidental) et le haoussa. Si la phrase mélange plusieurs langues, réponds dans la langue dominante.',
    'En zarma et en haoussa, utilise des mots simples et courants ; n’invente jamais de mots.',
    site?.companyName
      ? `Entreprise : ${site.companyName}, ${site.location || 'Niamey, Niger'}. Email : ${site.email || 'non publié'}. Horaires : ${site.workingHours || 'non publiés'}.`
      : 'Entreprise : Excellence Services SARL, Niamey, Niger.',
    'Interdiction absolue d’inventer un numéro de téléphone, une adresse, un prix ou un horaire non fourni. Si tu ne sais pas, dis-le clairement et propose d’appeler un conseiller.',
    'Pour les lieux au Niger, sois prudent : donne le nom exact du quartier ou de la ville si tu le connais, sinon demande une précision.',
    'Reste utile, respectueux et concret. Ne parle pas de politique ni de personnes publiques.',
    'Ne produis aucun formatage Markdown : texte brut uniquement, car il sera lu à voix haute.',
  ].join('\n');
}

/** Format compact de l'historique pour le LLM. */
export function buildVoiceHistory(context: AssistantContext): Array<{ role: 'user' | 'model'; text: string }> {
  return (context.history || []).slice(-8).map((item) => ({
    role: item.role === 'user' ? ('user' as const) : ('model' as const),
    text: String(item.text || '').slice(0, 1200),
  }));
}

/** Extrait les actions « à exécuter » d'un tour (pour le client). */
export function executableActions(turn: AssistantTurn): VoiceAction[] {
  return turn.actions.filter((action) => !('url' in action && typeof action.url === 'string' && action.url.startsWith('/api/')));
}

/** Actions réservées au serveur (API internes) — non exécutées par le navigateur. */
export function serverHints(turn: AssistantTurn): VoiceAction[] {
  return turn.actions.filter((action) => 'url' in action && typeof action.url === 'string' && action.url.startsWith('/api/'));
}

/** Réponse de dernier recours quand rien n'a fonctionné. */
export function buildUnknownTurn(utterance: string, language: VoiceLanguage): AssistantTurn {
  const turn = emptyTurn(language, 'unknown');
  turn.slots = { query: extractQuery(utterance) || utterance };
  turn.suggestions = suggestionsFor('unknown', language);
  turn.reply = say(language, {
    fr: 'Je n’ai pas compris. Vous pouvez reformuler, ou essayer : « Conduis-moi au Grand Marché », « Où est la pharmacie la plus proche ? », « Quelle heure est-il ? ».',
    dje: 'Ay si faham. Ma sanni cebe, wala ma ne: « Ma ay ne koy Grand Marché », « Mar no darzanka hayey nangu? », « Waati cendi? ».',
    ha: 'Ban gane ba. Ka sake bayani, ko ka gwada: « Kai ni Babbar Kasuwa », « Ina kantan magani mafi kusa? », « Ƙarfe nawa yanzu? ».',
    en: 'I did not understand. Please rephrase, or try: “Take me to the Grand Marché”, “Where is the nearest pharmacy?”, “What time is it?”.',
  });
  turn.speak = turn.reply;
  turn.source = 'fallback';
  turn.offline = true;
  return turn;
}
