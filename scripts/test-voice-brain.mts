/**
 * ISA — Tests du cerveau vocal (règles hors-ligne)
 * ================================================
 * Vérifie ce que l'assistant doit savoir faire SANS réseau ni modèle :
 * détection de langue, intentions, numéros d'urgence, liens Google Maps,
 * minuteurs, lieux du Niger, réponses en zarma et en haoussa.
 *
 * Exécution :  npm run test:voice
 */

import { runLocalBrain, buildUnknownTurn, formatNiameyTime, formatNiameyDate } from '../src/lib/voice/brain';
import { detectIntent, detectVoiceLanguage, extractPhoneNumber, extractDurationMinutes, extractClockTime, toE164Niger } from '../src/lib/voice/intents';
import { matchNigerFact, matchNigerPlace, matchPlaceCategory } from '../src/lib/voice/nigerKnowledge';
import { googleMapsDirectionsUrl, googleMapsEmbedUrl, googleMapsSearchUrl, whatsappUrl, smsUrl, telUrl } from '../src/lib/voice/mapsLinks';
import { normalizeLanguageCode, getLanguageMeta } from '../src/lib/voice/languages';
import { nextOccurrence } from '../src/lib/voice/scheduler';
import type { AssistantContext } from '../src/lib/voice/types';

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` \x1b[90m(${detail})\x1b[0m` : ''}`);
  }
}

const context: AssistantContext = {
  language: 'fr',
  siteContext: {
    companyName: 'EXCELLENCE SERVICES SARL',
    location: 'Niamey, Niger',
    email: 'admin@excellence-services-sarl.com',
    whatsappRaw: '22778798900',
    phones: [{ label: 'Ligne Principale / Commercial', number: '+227 78 79 89 00', raw: '22778798900' }],
    workingHours: 'Lundi – Vendredi : 09h30 – 17h30',
  },
};

console.log('\n\x1b[1m── ISA : détection de langue ────────────────────────────────────────\x1b[0m');
check('français détecté', detectVoiceLanguage("Quelle heure est-il ? Je veux aller au marché") === 'fr');
check('haoussa détecté', detectVoiceLanguage('Sannu, ina son zuwa kasuwa, kai ni') === 'ha');
check('zarma détecté', detectVoiceLanguage('Fofo, mate ni go? Ay ga ba ma koy') === 'dje');
check('anglais détecté', detectVoiceLanguage('Hello, what time is it please?') === 'en');
check('code dje normalisé', normalizeLanguageCode('dje-NE') === 'dje');
check('code zar normalisé', normalizeLanguageCode('zar') === 'dje');
check('code ha normalisé', normalizeLanguageCode('ha-NG') === 'ha');
check('voix zarma = MMS', getLanguageMeta('dje').serverTtsModel === 'mms_tts_dje');
check('voix haoussa = MMS', getLanguageMeta('ha').serverTtsModel === 'mms_tts_hau');

console.log('\n\x1b[1m── ISA : intentions ─────────────────────────────────────────────────\x1b[0m');
check('navigation (fr)', detectIntent('Conduis-moi au Grand Marché de Niamey', 'fr').intent === 'navigate');
check('navigation (haoussa)', detectIntent('Kai ni Babbar Kasuwa', 'ha').intent === 'navigate');
check('navigation (zarma)', detectIntent('Ma ay ne koy Grand Marché', 'dje').intent === 'navigate');
check('recherche de lieu', detectIntent('Où est la pharmacie la plus proche ?', 'fr').intent === 'find_place');
check('catégorie pharmacie', matchPlaceCategory('cherche une pharmacie') === 'pharmacy');
check('catégorie essence (haoussa)', matchPlaceCategory('ina man fetur') === 'fuel');
check('heure (fr)', detectIntent("Quelle heure est-il ?", 'fr').intent === 'time');
check('heure (haoussa)', detectIntent('Ƙarfe nawa yanzu?', 'ha').intent === 'time');
check('heure (zarma)', detectIntent('Waati cendi?', 'dje').intent === 'time');
check('météo', detectIntent('Quel temps fait-il à Niamey ?', 'fr').intent === 'weather');
check('urgence prioritaire', detectIntent("Au secours, c'est une urgence, appelez la police", 'fr').intent === 'emergency');
check('« stop » prioritaire', detectIntent('Arrête de parler s’il te plaît', 'fr').intent === 'stop_speaking');
check('minuteur', detectIntent('Minuteur 10 minutes', 'fr').intent === 'timer');
check('alarme', detectIntent("Réveille-moi à 6h30", 'fr').intent === 'alarm');
check('appel', detectIntent('Appelle le 17 tout de suite', 'fr').intent === 'call');
check('appel (haoussa)', detectIntent('Yi mini kira zuwa asibiti', 'ha').intent === 'call');
check('whatsapp', detectIntent('Envoie ça sur WhatsApp', 'fr').intent === 'whatsapp');
check('devis entreprise', detectIntent('Combien coûte un devis ?', 'fr').intent === 'company_quote');

console.log('\n\x1b[1m── ISA : emplacements (slots) ───────────────────────────────────────\x1b[0m');
const nav = detectIntent('Conduis-moi au Grand Marché de Niamey', 'fr');
check('destination extraite', (nav.slots.destination || '').toLowerCase().includes('grand marché'), nav.slots.destination);
const known = matchNigerPlace('je cherche le grand marche de niamey');
check('lieu connu reconnu', known?.id === 'grand-marche', known?.name);
check('ville reconnue', matchNigerPlace('distance jusqu’à zinder')?.id === 'zinder');
check('numéro nigérien 8 chiffres', extractPhoneNumber('appelle le 90 39 31 32') === '+22790393132', extractPhoneNumber('appelle le 90 39 31 32'));
check('numéro international', extractPhoneNumber('joins-moi au +227 78 79 89 00') === '+22778798900');
check('E.164 Niger', toE164Niger('78798900') === '+22778798900');
check('durée 10 minutes', extractDurationMinutes('minuteur de 10 minutes', 'fr') === 10);
check('durée 2 heures', extractDurationMinutes('dans 2 heures', 'fr') === 120);
check('durée zarma (hinka = 2)', extractDurationMinutes('waati minti hinka', 'dje') === 2);
check('durée haoussa (mintuna 5)', extractDurationMinutes('naƙilar mintuna 5', 'ha') === 5);
check('heure 6h30', extractClockTime('réveille-moi à 6h30', 'fr') === '06:30');
check('heure 07:15', extractClockTime('alarme à 07:15', 'fr') === '07:15');

console.log('\n\x1b[1m── ISA : liens et URL ───────────────────────────────────────────────\x1b[0m');
const dirUrl = googleMapsDirectionsUrl({ destination: 'Grand Marché, Niamey', origin: { lat: 13.5137, lon: 2.1098 }, mode: 'driving' });
check('URL de navigation Google Maps', dirUrl.includes('google.com/maps/dir') && dirUrl.includes('api=1') && dirUrl.includes('travelmode=driving'));
check('origine GPS incluse', dirUrl.includes('13.5137'));
// Le pays est ajouté quand la destination ne le mentionne pas déjà.
const zinderUrl = googleMapsDirectionsUrl({ destination: 'Zinder', mode: 'driving' });
check('pays ajouté automatiquement', zinderUrl.includes('Niger'), zinderUrl);
check('Niamey déjà présent → pas de doublon', !googleMapsSearchUrl('Grand Marché, Niamey').includes('Niamey%2C%20Niger'));
check('carte intégrable sans clé', googleMapsEmbedUrl('Grand Marché Niamey').includes('output=embed'));
check('lien WhatsApp +227', whatsappUrl('78798900', 'Bonjour').startsWith('https://wa.me/22778798900'));
check('lien SMS', smsUrl('+22778798900', 'Test').startsWith('sms:+22778798900'));
check('lien appel', telUrl('+227 78 79 89 00') === 'tel:+22778798900');

console.log('\n\x1b[1m── ISA : cerveau hors-ligne ─────────────────────────────────────────\x1b[0m');
const emergency = runLocalBrain("C'est une urgence, appelle la police", context);
check('urgence → intention', emergency?.intent === 'emergency');
check('urgence → 17, 18, 15 présents', ['17', '18', '15'].every((n) => (emergency?.reply || '').includes(n)), emergency?.reply);
check('urgence → actions d’appel', (emergency?.actions.filter((a) => a.type === 'call').length || 0) === 3);

const heure = runLocalBrain('Quelle heure est-il ?', context);
check('heure → réponse', (heure?.reply || '').includes(formatNiameyTime('fr')));
check('heure → hors-ligne', heure?.offline === true);

const navigation = runLocalBrain('Conduis-moi au Grand Marché de Niamey', context);
check('navigation → intention', navigation?.intent === 'navigate');
check('navigation → carte affichée', Boolean(navigation?.actions.some((a) => a.type === 'show_map')));
check('navigation → bouton de navigation', Boolean(navigation?.actions.some((a) => a.type === 'navigate_to')));
check('navigation → Google Maps ouvert', Boolean(navigation?.actions.some((a) => a.type === 'open_map')));
check('navigation → lieu connu (hors-ligne)', navigation?.offline === true);

const zinder = runLocalBrain('Combien de kilomètres jusqu’à Zinder ?', context);
check('Zinder → distance indicative', (zinder?.reply || '').includes('870'));

const zarmaGreeting = runLocalBrain('Fofo, mate ni go?', context);
check('salutation zarma → greeting', zarmaGreeting?.intent === 'greeting');
check('salutation zarma → langue dje', zarmaGreeting?.language === 'dje');

const hausaNav = runLocalBrain('Kai ni Babbar Kasuwa', context);
check('navigation haoussa → navigate', hausaNav?.intent === 'navigate');
check('navigation haoussa → langue ha', hausaNav?.language === 'ha');
check('navigation haoussa → réponse en haoussa', /taswira|jagora|Babbar Kasuwa/i.test(hausaNav?.reply || ''), hausaNav?.reply);

const timer = runLocalBrain('Minuteur 10 minutes', context);
check('minuteur → action', Boolean(timer?.actions.some((a) => a.type === 'timer' && a.seconds === 600)));

const alarm = runLocalBrain('Alarme à 6h30', context);
check('alarme → 06:30', Boolean(alarm?.actions.some((a) => a.type === 'alarm' && a.clockTime === '06:30')));

const contact = runLocalBrain('Appelle Excellence Services', context);
check('contact entreprise → numéro trouvé', Boolean(contact?.actions.some((a) => a.type === 'call')));
check(
  'contact entreprise → +22778798900',
  contact?.actions.some((a) => a.type === 'call' && a.phoneNumber.includes('22778798900')) === true,
);

const pharmacy = runLocalBrain('Où est la pharmacie la plus proche ?', context);
check('pharmacie → catégorie détectée', pharmacy?.slots.placeCategory === 'pharmacy');
check('pharmacie → carte proposée', Boolean(pharmacy?.actions.length));

const fact = matchNigerFact("Quelle est la capitale du Niger ?");
check('fait pays → capitale', (fact?.answer.fr || '').includes('Niamey'));

const unknown = runLocalBrain('zxqwv plmkj 12345', context);
check('phrase inconnue → relais au LLM', unknown === null);
check('repli final compréhensible', buildUnknownTurn('zxqwv', 'fr').reply.length > 20);

const stop = runLocalBrain('Tais-toi', context);
check('« tais-toi » → coupe la voix', Boolean(stop?.actions.some((a) => a.type === 'stop_speaking')));
check('« tais-toi » → rien à prononcer', stop?.speak === '');

const hours = runLocalBrain('Quels sont vos horaires ?', context);
check('horaires entreprise', (hours?.reply || '').includes('09h30'));

console.log('\n\x1b[1m── ISA : heure et date (fuseau Africa/Niamey) ───────────────────────\x1b[0m');
check('heure au format HH:MM', /^\d{2}:\d{2}$/.test(formatNiameyTime('fr')), formatNiameyTime('fr'));
check('date en français', /[a-zà-ÿ]/i.test(formatNiameyDate('fr')), formatNiameyDate('fr'));
const alarmTime = nextOccurrence('06:00');
check('alarme calculée (valeur finie)', Number.isFinite(alarmTime), String(alarmTime));
check('alarme dans le futur', alarmTime > Date.now(), Number.isFinite(alarmTime) ? new Date(alarmTime).toISOString() : 'NaN');
check('alarme sous 24 h', alarmTime - Date.now() <= 24 * 3600 * 1000 + 60000);
const eveningAlarm = nextOccurrence('23:59');
check('alarme 23:59 valide', Number.isFinite(eveningAlarm) && eveningAlarm > Date.now());

console.log('\n' + '═'.repeat(70));
if (failures.length) {
  console.log(`\x1b[31m  ${failures.length} test(s) en échec\x1b[0m · ${passed} réussi(s)`);
  failures.forEach((failure) => console.log(`    • ${failure}`));
  console.log('═'.repeat(70) + '\n');
  process.exit(1);
}
console.log(`\x1b[32m  ✓ ${passed} tests réussis\x1b[0m — cerveau vocal ISA conforme`);
console.log('═'.repeat(70) + '\n');
process.exit(0);
