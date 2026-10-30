import type { VoiceIntent, VoiceLanguage } from './types';

/**
 * ISA — Packs de langues
 * ======================
 * Un SEUL fichier à éditer pour améliorer l'assistant : chaque langue y décrit
 * ses mots-clés d'intention et ses réponses prêtes à l'emploi.
 *
 * ⚠️ Les lexiques zarma et haoussa livrés ici sont un socle de démarrage
 *    (salutations, ordres courants, nombres). Ils doivent être relus et
 *    complétés par des locuteurs natifs — c'est exactement le rôle du fichier
 *    `voice-ai/lexiques/README.md`. Ajouter un mot-clé = ajouter une ligne.
 */

export interface LanguageMeta {
  code: VoiceLanguage;
  /** Nom affiché dans l'interface. */
  label: string;
  /** Nom dans la langue elle-même. */
  nativeName: string;
  /** Code BCP-47 utilisé par la reconnaissance vocale du navigateur. */
  bcp47: string;
  /** Le navigateur sait-il, en pratique, transcrire cette langue ? */
  browserSttSupport: 'native' | 'partial' | 'none';
  /** Moteur de synthèse recommandé hors navigateur. */
  serverTtsModel: string;
  /** Langue de repli quand une réponse manque dans cette langue. */
  fallback: VoiceLanguage;
  flag: string;
  /** Prononciation approximative, affichée pour aider l'équipe. */
  hint?: string;
}

export const LANGUAGE_META: Record<VoiceLanguage, LanguageMeta> = {
  fr: {
    code: 'fr',
    label: 'Français',
    nativeName: 'Français',
    bcp47: 'fr-FR',
    browserSttSupport: 'native',
    serverTtsModel: 'fr_FR-siwis-medium',
    fallback: 'fr',
    flag: '🇫🇷',
  },
  dje: {
    code: 'dje',
    label: 'Zarma',
    nativeName: 'Zarmaciine',
    bcp47: 'dje-NE',
    browserSttSupport: 'none',
    // Meta MMS-TTS couvre le zarma (ISO 639-3 « dje ») : voix 100 % locale.
    serverTtsModel: 'mms_tts_dje',
    fallback: 'fr',
    flag: '🇳🇪',
    hint: 'Zarma / Djerma — langue songhay du Niger occidental',
  },
  ha: {
    code: 'ha',
    label: 'Haoussa',
    nativeName: 'Hausa',
    bcp47: 'ha-NG',
    // Chrome/Android exposent parfois « ha », jamais sur tous les appareils.
    browserSttSupport: 'partial',
    serverTtsModel: 'mms_tts_hau',
    fallback: 'fr',
    flag: '🇳🇪',
    hint: 'Hausa — langue la plus parlée au Niger et au Nigeria',
  },
  en: {
    code: 'en',
    label: 'Anglais',
    nativeName: 'English',
    bcp47: 'en-US',
    browserSttSupport: 'native',
    serverTtsModel: 'en_US-lessac-medium',
    fallback: 'fr',
    flag: '🇬🇧',
  },
};

export const VOICE_LANGUAGES: VoiceLanguage[] = ['fr', 'dje', 'ha', 'en'];

/** Langues mises en avant sur l'écran de l'assistant (zarma + haoussa + français). */
export const PRIMARY_VOICE_LANGUAGES: VoiceLanguage[] = ['fr', 'dje', 'ha'];

export function getLanguageMeta(code: string | undefined | null): LanguageMeta {
  const normalized = normalizeLanguageCode(code);
  return LANGUAGE_META[normalized] || LANGUAGE_META.fr;
}

/**
 * Normalise n'importe quel code reçu (navigator.language, Whisper, champ HTML)
 * vers l'un des codes ISA. Reconnaît les variantes courantes du zarma et du
 * haoussa afin que l'assistant ne retombe jamais bêtement sur le français.
 */
export function normalizeLanguageCode(code: string | undefined | null): VoiceLanguage {
  if (!code) return 'fr';
  const value = String(code).toLowerCase().replace(/_/g, '-').trim();
  const base = value.split('-')[0];

  // Zarma / Djerma / Songhay-Zarma
  if (['dje', 'zar', 'zarmaciine', 'zarma', 'djerma', 'zerma', 'songhay', 'songhai', 'dje-ne'].includes(base) || value.startsWith('dje')) {
    return 'dje';
  }
  // Haoussa
  if (['ha', 'hau', 'hausa', 'haoussa', 'ha-gh', 'ha-ne'].includes(base) || value.startsWith('ha-')) {
    return 'ha';
  }
  if (base === 'fr') return 'fr';
  if (base === 'en') return 'en';
  return 'fr';
}

/* ------------------------------------------------------------------ */
/* Interface (libellés d'écran)                                        */
/* ------------------------------------------------------------------ */

export type UiKey =
  | 'assistantName'
  | 'tagline'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'idle'
  | 'tapToSpeak'
  | 'holdToSpeak'
  | 'wakeWordOn'
  | 'wakeWordOff'
  | 'offlineBadge'
  | 'localServerBadge'
  | 'cloudBadge'
  | 'micDenied'
  | 'noSpeech'
  | 'errorGeneric'
  | 'stopSpeaking'
  | 'repeat'
  | 'language'
  | 'you'
  | 'isa'
  | 'suggestions'
  | 'openInMaps'
  | 'startNavigation'
  | 'callNow'
  | 'sendMessage'
  | 'openWhatsapp'
  | 'sendEmail'
  | 'sharePosition'
  | 'positionShared'
  | 'nearbyResults'
  | 'timerStarted'
  | 'timerDone'
  | 'alarmSet'
  | 'reminderSet'
  | 'weatherNow'
  | 'copyText'
  | 'copied'
  | 'history'
  | 'clearHistory'
  | 'noHistory'
  | 'poweredBy'
  | 'installLocalServer'
  | 'tryExamples'
  | 'backToSite';

type UiStrings = Record<UiKey, string>;

export const UI_STRINGS: Record<VoiceLanguage, UiStrings> = {
  fr: {
    assistantName: 'ISA',
    tagline: "L'assistant vocal du Niger",
    listening: 'Je vous écoute…',
    thinking: 'Je réfléchis…',
    speaking: 'Je parle…',
    idle: 'Prêt',
    tapToSpeak: 'Touchez pour parler',
    holdToSpeak: 'Maintenez pour parler',
    wakeWordOn: "Mot de réveil « Isa » activé",
    wakeWordOff: 'Mot de réveil désactivé',
    offlineBadge: 'Hors-ligne',
    localServerBadge: 'Serveur local Niamey',
    cloudBadge: 'En ligne',
    micDenied: "Accès au micro refusé. Autorisez le micro dans votre navigateur, puis réessayez.",
    noSpeech: "Je n'ai rien entendu. Réessayez en parlant plus près du micro.",
    errorGeneric: 'Une erreur est survenue. Réessayez ou écrivez votre demande.',
    stopSpeaking: 'Arrêter de parler',
    repeat: 'Répéter',
    language: 'Langue',
    you: 'Vous',
    isa: 'ISA',
    suggestions: 'Essayez aussi',
    openInMaps: 'Ouvrir dans Google Maps',
    startNavigation: 'Lancer la navigation',
    callNow: 'Appeler',
    sendMessage: 'Envoyer un SMS',
    openWhatsapp: 'Ouvrir WhatsApp',
    sendEmail: 'Envoyer un e-mail',
    sharePosition: 'Partager ma position',
    positionShared: 'Position activée',
    nearbyResults: 'Résultats près de vous',
    timerStarted: 'Minuteur démarré',
    timerDone: 'Minuteur terminé',
    alarmSet: 'Alarme réglée',
    reminderSet: 'Rappel créé',
    weatherNow: 'Météo actuelle',
    copyText: 'Copier le texte',
    copied: 'Copié',
    history: 'Historique',
    clearHistory: "Vider l'historique",
    noHistory: 'Aucune conversation pour le moment.',
    poweredBy: 'Propulsé par Excellence Services SARL — Niamey',
    installLocalServer: 'Activer le serveur IA local',
    tryExamples: 'Exemples de commandes',
    backToSite: 'Retour au site',
  },
  dje: {
    assistantName: 'ISA',
    tagline: 'Niger sanni faaba-ize',
    listening: 'Ay ga hã…',
    thinking: 'Ay ga laakal…',
    speaking: 'Ay ga sanni…',
    idle: 'A soola',
    tapToSpeak: 'Ma naagu ma sanni',
    holdToSpeak: 'Ma hay ma sanni',
    wakeWordOn: '« Isa » ma tun soola',
    wakeWordOff: 'Tun-sanni kaa',
    offlineBadge: 'Interneti kulu si no',
    localServerBadge: 'Niamey ordinater ra',
    cloudBadge: 'Interneti boŋ',
    micDenied: 'Mikoro si faaba. Ma mikoro ne cere.',
    noSpeech: 'Ay mana hã fo. Ma sanni ka kay mikoro se.',
    errorGeneric: 'Firka fo te. Ma koyne cebe.',
    stopSpeaking: 'Sanni dabba',
    repeat: 'Ye cebe',
    language: 'Sanni',
    you: 'Ni',
    isa: 'ISA',
    suggestions: 'Ma wo ne ma cebe',
    openInMaps: 'Google Maps ra feeri',
    startNavigation: 'Fondo cebe',
    callNow: 'Telefon da',
    sendMessage: 'Sanni sanba',
    openWhatsapp: 'WhatsApp feeri',
    sendEmail: 'E-mail sanba',
    sharePosition: 'Ay nangu cebe',
    positionShared: 'Nangu du',
    nearbyResults: 'Nanguyey ma gaa',
    timerStarted: 'Waati tun',
    timerDone: 'Waati ben',
    alarmSet: 'Alarme soola',
    reminderSet: 'Hongro soola',
    weatherNow: 'Zaari handu',
    copyText: 'Sanni daaku',
    copied: 'A daaku',
    history: 'Sanni zaama',
    clearHistory: 'Sanni zaama tuusu',
    noHistory: 'Sanni kulu mana ben jina.',
    poweredBy: 'Excellence Services SARL — Niamey',
    installLocalServer: 'Niamey ordinater tun',
    tryExamples: 'Sanni misaaley',
    backToSite: 'Site biya koyne',
  },
  ha: {
    assistantName: 'ISA',
    tagline: 'Mataimaki na Nijar',
    listening: 'Ina sauraro…',
    thinking: 'Ina tunani…',
    speaking: 'Ina magana…',
    idle: 'A shirye',
    tapToSpeak: 'Danna don magana',
    holdToSpeak: 'Rike don magana',
    wakeWordOn: 'Kalmar « Isa » tana aiki',
    wakeWordOff: 'An kashe kalmar farkawa',
    offlineBadge: 'Babu intanet',
    localServerBadge: 'Sabar Niamey',
    cloudBadge: 'A kan intanet',
    micDenied: 'Ba a ba da izinin mikrofo ba. Ka ba da izini sannan ka sake gwadawa.',
    noSpeech: 'Ban ji komai ba. Ka kusanci mikrofo sannan ka sake gwadawa.',
    errorGeneric: 'An sami kuskure. Ka sake gwadawa ko ka rubuta bukatar ka.',
    stopSpeaking: 'Daina magana',
    repeat: 'Maimaita',
    language: 'Harshe',
    you: 'Kai',
    isa: 'ISA',
    suggestions: 'Gwada waɗannan',
    openInMaps: 'Buɗe a Google Maps',
    startNavigation: 'Fara jagora',
    callNow: 'Yi kira',
    sendMessage: 'Aika saƙo',
    openWhatsapp: 'Buɗe WhatsApp',
    sendEmail: 'Aika imel',
    sharePosition: 'Raba wurina',
    positionShared: 'An sami wuri',
    nearbyResults: 'Wuraren da ke kusa',
    timerStarted: 'An fara ƙidayar lokaci',
    timerDone: 'Lokaci ya cika',
    alarmSet: 'An saita agogo',
    reminderSet: 'An saita tunatarwa',
    weatherNow: 'Yanayin yau',
    copyText: 'Kwafi rubutu',
    copied: 'An kwafi',
    history: 'Tarihi',
    clearHistory: 'Share tarihi',
    noHistory: 'Babu wata tattaunawa tukuna.',
    poweredBy: 'Excellence Services SARL — Niamey',
    installLocalServer: 'Kunna sabar cikin gida',
    tryExamples: 'Misalan umarni',
    backToSite: 'Koma shafin',
  },
  en: {
    assistantName: 'ISA',
    tagline: "Niger's voice assistant",
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
    idle: 'Ready',
    tapToSpeak: 'Tap to speak',
    holdToSpeak: 'Hold to speak',
    wakeWordOn: 'Wake word “Isa” enabled',
    wakeWordOff: 'Wake word disabled',
    offlineBadge: 'Offline',
    localServerBadge: 'Niamey local server',
    cloudBadge: 'Online',
    micDenied: 'Microphone access denied. Allow the microphone and try again.',
    noSpeech: "I didn't hear anything. Please try again closer to the microphone.",
    errorGeneric: 'Something went wrong. Please retry or type your request.',
    stopSpeaking: 'Stop speaking',
    repeat: 'Repeat',
    language: 'Language',
    you: 'You',
    isa: 'ISA',
    suggestions: 'Try also',
    openInMaps: 'Open in Google Maps',
    startNavigation: 'Start navigation',
    callNow: 'Call',
    sendMessage: 'Send SMS',
    openWhatsapp: 'Open WhatsApp',
    sendEmail: 'Send email',
    sharePosition: 'Share my location',
    positionShared: 'Location enabled',
    nearbyResults: 'Places near you',
    timerStarted: 'Timer started',
    timerDone: 'Timer finished',
    alarmSet: 'Alarm set',
    reminderSet: 'Reminder created',
    weatherNow: 'Current weather',
    copyText: 'Copy text',
    copied: 'Copied',
    history: 'History',
    clearHistory: 'Clear history',
    noHistory: 'No conversation yet.',
    poweredBy: 'Powered by Excellence Services SARL — Niamey',
    installLocalServer: 'Enable local AI server',
    tryExamples: 'Example commands',
    backToSite: 'Back to site',
  },
};

export function ui(language: VoiceLanguage, key: UiKey): string {
  const pack = UI_STRINGS[language] || UI_STRINGS.fr;
  return pack[key] || UI_STRINGS.fr[key] || key;
}

/* ------------------------------------------------------------------ */
/* Lexiques d'intentions                                               */
/* ------------------------------------------------------------------ */

/**
 * Chaque intention est associée à des motifs. Un motif est soit une chaîne
 * (recherche de sous-chaîne sur texte normalisé), soit une RegExp.
 * L'ordre du tableau `INTENT_ORDER` décide de la priorité en cas de doublon :
 * une intention placée avant gagne.
 */
export type IntentPattern = string | RegExp;

export const INTENT_LEXICON: Record<VoiceIntent, Record<VoiceLanguage, IntentPattern[]>> = {
  greeting: {
    fr: ['bonjour', 'salut', 'bonsoir', 'coucou', 'ça va', 'ca va', 'hello', 'salam', 'salam aleikoum'],
    dje: ['fofo', 'salaam', 'mate ni go', 'baani samay', 'ni kani', 'sannu'],
    ha: ['sannu', 'salam', 'yaya kake', 'yaya ake', 'ina kwana', 'barka da zuwa', 'sannunka', 'sannunki'],
    en: ['hello', 'hi ', 'good morning', 'good evening', 'how are you'],
  },
  thanks: {
    fr: ['merci', 'merci beaucoup', 'c’est gentil', "c'est gentil"],
    dje: ['fofo', 'ay ga fofo', 'ni fofo', 'albarka'],
    ha: ['na gode', 'nagode', 'godia', 'sai an gode', 'mun gode'],
    en: ['thank you', 'thanks', 'cheers'],
  },
  identity: {
    fr: ['qui es-tu', 'tu es qui', 'ton nom', 'tu t’appelles', "tu t'appelles", 'c’est quoi isa', "c'est quoi isa", 'es-tu une ia'],
    dje: ['ni maa se', 'may no ni', 'ni maa', 'ay ma bay ni'],
    ha: ['wa kai ne', 'me sunanka', 'kai ne wanene', 'sunanka me'],
    en: ['who are you', 'what is your name', 'what are you'],
  },
  help: {
    fr: ['aide', 'aide-moi', 'que peux-tu faire', 'comment tu marches', 'je ne comprends pas', 'commandes'],
    dje: ['faaba', 'ma ay faaba', 'ni ga hin ma tee may', 'ay si faham'],
    ha: ['taimako', 'ka taimake ni', 'me zaka iya yi', 'ban gane ba', 'yaya kake aiki'],
    en: ['help', 'help me', 'what can you do', 'how do you work'],
  },
  navigate: {
    fr: [
      'amène-moi', 'amene-moi', 'conduis-moi', 'emmène-moi', 'emmene-moi', 'mène-moi', 'mene-moi',
      'je veux aller', 'aller à', 'aller au', 'itinéraire', 'itineraire', 'route vers', 'chemin vers',
      'navigate', 'guide-moi', 'guide moi', 'comment aller', 'direction',
    ],
    dje: ['ay ma koy', 'ay koyne', 'ma ay ne koy', 'koy', 'fondo', 'fonda', 'dabari'],
    ha: ['kai ni', 'je ni', 'ina son zuwa', 'zan je', 'hanyar zuwa', 'nuna mini hanya', 'tafiya zuwa', 'jagorance ni'],
    en: ['take me to', 'drive me to', 'navigate to', 'directions to', 'route to', 'how do i get to'],
  },
  find_place: {
    fr: [
      'où se trouve', 'ou se trouve', 'où est', 'ou est', 'cherche', 'trouve', 'montre-moi', 'montre moi',
      'je cherche', 'le plus proche', 'la plus proche', 'près de moi', 'autour de moi', 'à proximité',
      'pharmacie', 'hôpital', 'hopital', 'station', 'essence', 'marché', 'marche', 'banque', 'hôtel', 'hotel',
      'restaurant', 'école', 'ecole', 'mosquée', 'médecin', 'medecin', 'aéroport', 'gendarmerie', 'commissariat',
    ],
    dje: ['mar no', 'may no', 'nangu', 'ceeci', 'du', 'gaa ma', 'hayey', 'kwaara'],
    ha: ['ina', 'nemo', 'nemi', 'ina ake', 'a ina', 'kusa da ni', 'mafi kusa', 'wurin', 'asibiti', 'kantin magani', 'kasuwa', 'banki', 'makaranta', 'masallaci'],
    en: ['where is', 'find', 'search for', 'nearest', 'near me', 'pharmacy', 'hospital', 'gas station', 'market'],
  },
  distance: {
    fr: ['c’est loin', "c'est loin", 'combien de temps', 'distance', 'kilomètres', 'kilometres', 'à quelle distance', 'a quelle distance', 'ça prend combien'],
    dje: ['misa', 'ganda', 'waati cendi', 'fofo no'],
    ha: ['nisa', 'tsawon lokaci', 'nawa ne', 'kilomita', 'yaya nisa', 'lokaci nawa'],
    en: ['how far', 'distance', 'how long does it take', 'miles', 'kilometers'],
  },
  call: {
    fr: ['appelle', 'appeler', 'téléphone', 'telephone', 'passe un appel', 'contacte', 'joindre', 'numéro de', 'numero de'],
    dje: ['telefon', 'ma ay telefon', 'da', 'ma da'],
    ha: ['kira', 'yi kiran', 'yi mini kira', 'sake kiran', 'wayar', 'lambar waya'],
    en: ['call', 'ring', 'dial', 'phone'],
  },
  sms: {
    fr: ['envoie un sms', 'envoyer un sms', 'envoie un message', 'message à', 'message au', 'sms à', 'sms au', 'écris-lui', 'ecris-lui'],
    dje: ['sanni sanba', 'ma sanni sanba', 'sms'],
    ha: ['aika saƙo', 'aika sako', 'saƙo zuwa', 'sako zuwa', 'rubuta saƙo', 'aika sms'],
    en: ['send a text', 'send an sms', 'text message', 'message to'],
  },
  whatsapp: {
    fr: ['whatsapp', 'waatsapp', 'watsap', 'whatssap'],
    dje: ['whatsapp', 'watsap'],
    ha: ['whatsapp', 'watsap'],
    en: ['whatsapp', 'whats app'],
  },
  email: {
    fr: ['e-mail', 'email', 'courriel', 'mail à', 'mail au'],
    dje: ['email', 'e-mail'],
    ha: ['imel', 'email', 'saƙon imel'],
    en: ['email', 'mail to', 'send mail'],
  },
  time: {
    fr: ['quelle heure', 'il est quelle heure', 'l’heure', "l'heure", 'heure actuelle'],
    dje: ['waati cendi', 'waati', 'saati', 'ay ma bay waati'],
    ha: ['karfe nawa', 'ƙarfe nawa', 'karfe nawa yanzu', 'wane lokaci', 'akwai wane lokaci', 'lokaci nawa'],
    en: ['what time', 'current time', 'time is it'],
  },
  date: {
    fr: ['quel jour', 'on est quel jour', 'la date', 'date du jour', 'aujourd’hui nous sommes', "aujourd'hui nous sommes"],
    dje: ['zaari', 'zaari cendi', 'hunkuna'],
    ha: ['wane rana', 'wace rana', 'ranar yau', 'kwanan wata', 'yau wace rana ce'],
    en: ['what day', "today's date", 'what is the date'],
  },
  weather: {
    fr: ['météo', 'meteo', 'quel temps', 'il fait chaud', 'il fait froid', 'température', 'temperature', 'pluie', 'pleuvoir', 'vent'],
    dje: ['handu', 'hari', 'zaari', 'haw', 'beene', 'kaari'],
    ha: ['yanayi', 'sararin samaniya', 'zafi', 'sanyi', 'ruwan sama', 'iska', 'yau zafi', 'yanayin yau'],
    en: ['weather', 'temperature', 'is it hot', 'is it raining', 'forecast'],
  },
  timer: {
    fr: ['minuteur', 'minuterie', 'minuteur de', 'chrono', 'dans X minutes', 'réveille-moi dans', 'compte à rebours', 'compte a rebours'],
    dje: ['waati kayandi', 'waati daŋ'],
    ha: ['naƙila', 'nakila', 'aga', 'saita lokaci', 'bayan mintuna'],
    en: ['timer', 'countdown', 'set a timer', 'in X minutes'],
  },
  alarm: {
    fr: ['alarme', 'réveille-moi à', 'reveille-moi a', 'réveil à', 'reveil a', 'sonne à'],
    dje: ['alarme', 'tun-sanni', 'ay ma tun'],
    ha: ['agogo', 'sa agogo', 'tarda ni', 'tara ni da safe'],
    en: ['alarm', 'wake me at', 'set an alarm'],
  },
  reminder: {
    fr: ['rappel', 'rappelle-moi', 'rappel-moi', 'pense à me dire', 'note pour plus tard', 'n’oublie pas', "n'oublie pas"],
    dje: ['hongro', 'ma ay hongro'],
    ha: ['tunatarwa', 'tunatar da ni', 'kada na manta'],
    en: ['remind me', 'reminder', 'set a reminder'],
  },
  translate: {
    fr: ['traduis', 'traduire', 'traduction', 'comment on dit', 'en zarma', 'en haoussa', 'en français', 'en francais', 'en anglais'],
    dje: ['barmay', 'ma barmay', 'sanni barmay'],
    ha: ['fassara', 'yi fassara', 'yaya ake cewa'],
    en: ['translate', 'translation', 'how do you say'],
  },
  company_services: {
    fr: ['vos services', 'services', 'que faites-vous', 'que faites vous', 'prestations', 'expertise'],
    dje: ['goy', 'goyey', 'ni goyey'],
    ha: ['ayyukanku', 'hizibobi', 'hiziba', 'me kuke yi'],
    en: ['your services', 'what do you do', 'offerings'],
  },
  company_quote: {
    fr: ['devis', 'prix', 'tarif', 'combien ça coûte', 'combien ca coute', 'coût', 'cout', 'proposition'],
    dje: ['nooru', 'farhã', 'kubay'],
    ha: ['farashi', 'kudin aiki', 'nawa ne', 'tambayar farashi'],
    en: ['quote', 'pricing', 'how much', 'estimate'],
  },
  company_contact: {
    fr: ['contact', 'coordonnées', 'coordonnees', 'numéro', 'numero', 'joindre', 'adresse e-mail', 'téléphone de l’entreprise'],
    dje: ['nangu', 'telefon', 'da'],
    ha: ['lambar waya', 'tuntube mu', 'hanyar sadarwa', 'lambar'],
    en: ['contact', 'phone number', 'reach you', 'email address'],
  },
  company_hours: {
    fr: ['horaires', 'heures d’ouverture', "heures d'ouverture", 'ouvert', 'vous ouvrez', 'fermez'],
    dje: ['waati', 'feeri', 'daabu'],
    ha: ['lokacin aiki', 'ina bude', 'lokacin budewa', 'kuna budewa'],
    en: ['opening hours', 'when are you open', 'business hours'],
  },
  company_location: {
    fr: ['vos bureaux', 'votre bureau', 'siège', 'siege', 'où êtes-vous', 'ou etes-vous', 'votre adresse'],
    dje: ['ni fu', 'nangu', 'ni kwaara'],
    ha: ['ofisinku', 'inda kuke', 'adireshinku', 'wurin ku'],
    en: ['your office', 'your location', 'where are you located'],
  },
  emergency: {
    fr: ['urgence', 'au secours', 'police', 'pompier', 'ambulance', 'hôpital d’urgence', 'accident', 'agression', 'samu'],
    dje: ['faaba kayantey', 'daaru', 'gaabi'],
    ha: ['gaggawa', 'jinya', '‘yan sanda', "'yan sanda", 'asibiti na gaggawa', 'hadaɗi', 'hatsari', 'taimaka mini yanzu'],
    en: ['emergency', 'help me now', 'police', 'ambulance', 'accident'],
  },
  open_site: {
    fr: ['ouvre le site', 'va à la page', 'va sur', 'montre la page', 'accueil', 'page services', 'page contact'],
    dje: ['feeri', 'ma feeri'],
    ha: ['bude', 'buɗe shafin', 'nuna mini'],
    en: ['open the site', 'go to page', 'show me the page'],
  },
  search_web: {
    fr: ['cherche sur internet', 'recherche google', 'google', 'sur le web', 'information sur'],
    dje: ['ceeci interneti ra'],
    ha: ['nemo a intanet', 'bincika', 'nema a google'],
    en: ['search the web', 'google', 'look up'],
  },
  play_music: {
    fr: ['musique', 'chanson', 'joue', 'radio', 'mets de la musique'],
    dje: ['wasan', 'koyra'],
    ha: ['kiɗa', 'kida', 'waka', 'ka kunna kida', 'saka waka'],
    en: ['play music', 'play a song', 'radio'],
  },
  stop_speaking: {
    fr: ['tais-toi', 'arrête de parler', 'arrete de parler', 'stop', 'silence', 'assez'],
    dje: ['dabba', 'ay ma tun', 'kaayi'],
    ha: ['shiru', 'daina', 'tsaya', 'isa', 'ka daina magana'],
    en: ['stop', 'be quiet', 'shut up', 'silence'],
  },
  repeat: {
    fr: ['répète', 'repete', 'encore une fois', 'je n’ai pas compris', "je n'ai pas compris"],
    dje: ['ye', 'cebe', 'ay si faham'],
    ha: ['maimaita', 'sake', 'ban ji ba', 'ina ce'],
    en: ['repeat', 'say again', 'pardon'],
  },
  unknown: { fr: [], dje: [], ha: [], en: [] },
};

/** Priorité de résolution : les premières intentions gagnent en cas de conflit. */
export const INTENT_ORDER: VoiceIntent[] = [
  'stop_speaking',
  'emergency',
  'repeat',
  'greeting',
  'thanks',
  'identity',
  'help',
  'translate',
  'timer',
  'alarm',
  'reminder',
  'time',
  'date',
  'weather',
  'whatsapp',
  'call',
  'sms',
  'email',
  'navigate',
  'distance',
  'find_place',
  'company_quote',
  'company_hours',
  'company_location',
  'company_contact',
  'company_services',
  'play_music',
  'open_site',
  'search_web',
  'unknown',
];

/* ------------------------------------------------------------------ */
/* Nombres en zarma / haoussa (pour minuteurs, heures, quantités)      */
/* ------------------------------------------------------------------ */

export const WORD_NUMBERS: Record<VoiceLanguage, Record<string, number>> = {
  fr: {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
    onze: 11, douze: 12, quinze: 15, vingt: 20, 'trente': 30, 'quarante-cinq': 45, 'quarante cinq': 45,
    'demi': 30, 'demie': 30, quart: 15,
  },
  dje: {
    fo: 1, ida: 1, hinka: 2, ihinza: 3, taaci: 4, gu: 5, iddu: 6, iyye: 7, yaahakku: 8, yegga: 9, way: 10,
    'way-iddu': 16, bire: 20, kabu: 100,
  },
  ha: {
    daya: 1, ɗaya: 1, biyu: 2, uku: 3, hudu: 4, biyar: 5, shida: 6, bakwai: 7, takwas: 8, tara: 9, goma: 10,
    'goma sha biyar': 15, ashirin: 20, talatin: 30, "arba'in": 40, dari: 100,
  },
  en: {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    fifteen: 15, twenty: 20, thirty: 30, 'half an': 30, quarter: 15,
  },
};

/** Unités de temps exprimées en mots, par langue. */
export const TIME_UNITS: Record<VoiceLanguage, Record<string, 'minute' | 'hour' | 'second'>> = {
  fr: { minute: 'minute', minutes: 'minute', min: 'minute', heure: 'hour', heures: 'hour', seconde: 'second', secondes: 'second' },
  dje: { minti: 'minute', mintiya: 'minute', saati: 'hour', saatyey: 'hour', waati: 'minute' },
  ha: { minti: 'minute', mintuna: 'minute', awa: 'hour', awanni: 'hour', "sa'a": 'hour', dakika: 'second' },
  en: { minute: 'minute', minutes: 'minute', min: 'minute', hour: 'hour', hours: 'hour', second: 'second', seconds: 'second' },
};
