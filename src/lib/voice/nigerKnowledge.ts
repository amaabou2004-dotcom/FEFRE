import type { VoiceLanguage } from './types';

/**
 * ISA — Base de connaissances « Niger » (100 % hors-ligne)
 * ========================================================
 * Tout ce dont l'assistant a besoin quand il n'y a AUCUN réseau : numéros
 * d'urgence, villes, repères de Niamey, distances indicatives, faits pays et
 * réponses trilingues (français / zarma / haoussa).
 *
 * Les coordonnées et distances sont des approximations volontairement
 * prudentes, utilisées pour le repli hors-ligne. Dès qu'un réseau est
 * disponible, l'assistant interroge Nominatim / OSRM (`/api/geo/*`) et remplace
 * ces valeurs par des données réelles. Toute valeur approximative est marquée
 * `approx: true`.
 *
 * Numéros d'urgence officiels au Niger : police 17, sapeurs-pompiers 18,
 * assistance médicale / SAMU 15.
 */

export interface TrilingualText {
  fr: string;
  dje: string;
  ha: string;
}

export interface NigerPlace {
  id: string;
  name: string;
  /** Alias reconnus à l'oral (français, zarma, haoussa, orthographes courantes). */
  aliases: string[];
  city?: string;
  region?: string;
  category:
    | 'city'
    | 'market'
    | 'airport'
    | 'hospital'
    | 'hotel'
    | 'landmark'
    | 'stadium'
    | 'university'
    | 'mosque'
    | 'church'
    | 'station'
    | 'admin';
  lat: number;
  lon: number;
  approx: true;
  /** Distance routière indicative depuis Niamey (km). */
  distanceFromNiameyKm?: number;
  note?: TrilingualText;
}

export interface EmergencyContact {
  id: string;
  number: string;
  dialable: string;
  label: TrilingualText;
  available24h: boolean;
}

/* ------------------------------------------------------------------ */
/* Numéros d'urgence                                                   */
/* ------------------------------------------------------------------ */

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'police',
    number: '17',
    dialable: '17',
    available24h: true,
    label: {
      fr: 'Police de secours',
      dje: 'Polisi faaba',
      ha: '‘Yan sanda na agaji',
    },
  },
  {
    id: 'fire',
    number: '18',
    dialable: '18',
    available24h: true,
    label: {
      fr: 'Sapeurs-pompiers',
      dje: 'Danwasu tayey',
      ha: 'Sojojin wuta (sapeurs-pompiers)',
    },
  },
  {
    id: 'medical',
    number: '15',
    dialable: '15',
    available24h: true,
    label: {
      fr: 'Assistance médicale (SAMU)',
      dje: 'Darzanka faaba',
      ha: 'Agajin gaggawa na asibiti (SAMU)',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Villes du Niger                                                     */
/* ------------------------------------------------------------------ */

export const NIGER_CITIES: NigerPlace[] = [
  { id: 'niamey', name: 'Niamey', aliases: ['niamey', 'nyamey', 'laamorde'], city: 'Niamey', region: 'Niamey', category: 'city', lat: 13.5137, lon: 2.1098, approx: true, distanceFromNiameyKm: 0 },
  { id: 'zinder', name: 'Zinder', aliases: ['zinder', 'damagaram'], region: 'Zinder', category: 'city', lat: 13.8069, lon: 8.9881, approx: true, distanceFromNiameyKm: 870 },
  { id: 'maradi', name: 'Maradi', aliases: ['maradi'], region: 'Maradi', category: 'city', lat: 13.5, lon: 7.1017, approx: true, distanceFromNiameyKm: 640 },
  { id: 'tahoua', name: 'Tahoua', aliases: ['tahoua', 'tawa'], region: 'Tahoua', category: 'city', lat: 14.8888, lon: 5.2692, approx: true, distanceFromNiameyKm: 550 },
  { id: 'agadez', name: 'Agadez', aliases: ['agadez', 'agades'], region: 'Agadez', category: 'city', lat: 16.9737, lon: 7.9863, approx: true, distanceFromNiameyKm: 930 },
  { id: 'dosso', name: 'Dosso', aliases: ['dosso'], region: 'Dosso', category: 'city', lat: 13.049, lon: 3.1937, approx: true, distanceFromNiameyKm: 155 },
  { id: 'tillaberi', name: 'Tillabéri', aliases: ['tillaberi', 'tillabéry', 'tillabery'], region: 'Tillabéri', category: 'city', lat: 14.2117, lon: 1.4531, approx: true, distanceFromNiameyKm: 110 },
  { id: 'diffa', name: 'Diffa', aliases: ['diffa'], region: 'Diffa', category: 'city', lat: 13.3154, lon: 12.6089, approx: true, distanceFromNiameyKm: 1400 },
  { id: 'ngigmi', name: "N'Guigmi", aliases: ['ngigmi', "n'guigmi", 'nguigmi'], region: 'Diffa', category: 'city', lat: 14.2533, lon: 13.1117, approx: true, distanceFromNiameyKm: 1550 },
  { id: 'birni-nkonni', name: "Birni N'Konni", aliases: ['birni nkonni', "birni n'konni", 'konni', 'birni'], region: 'Tahoua', category: 'city', lat: 13.7969, lon: 5.251, approx: true, distanceFromNiameyKm: 400 },
  { id: 'gaya', name: 'Gaya', aliases: ['gaya'], region: 'Dosso', category: 'city', lat: 11.8833, lon: 3.4333, approx: true, distanceFromNiameyKm: 330 },
  { id: 'arlit', name: 'Arlit', aliases: ['arlit'], region: 'Agadez', category: 'city', lat: 18.7369, lon: 7.3853, approx: true, distanceFromNiameyKm: 1200 },
  { id: 'tera', name: 'Téra', aliases: ['tera', 'téra'], region: 'Tillabéri', category: 'city', lat: 14.0078, lon: 0.7531, approx: true, distanceFromNiameyKm: 175 },
  { id: 'ouallam', name: 'Ouallam', aliases: ['ouallam', 'walam'], region: 'Tillabéri', category: 'city', lat: 14.3167, lon: 2.0833, approx: true, distanceFromNiameyKm: 200 },
  { id: 'filingue', name: 'Filingué', aliases: ['filingue', 'filingue'], region: 'Tillabéri', category: 'city', lat: 14.3521, lon: 3.3168, approx: true, distanceFromNiameyKm: 185 },
  { id: 'dogondoutchi', name: 'Dogondoutchi', aliases: ['dogondoutchi', 'dogon doutchi'], region: 'Dosso', category: 'city', lat: 13.64, lon: 4.03, approx: true, distanceFromNiameyKm: 380 },
  { id: 'madaoua', name: 'Madaoua', aliases: ['madaoua'], region: 'Tahoua', category: 'city', lat: 14.0764, lon: 5.9597, approx: true, distanceFromNiameyKm: 430 },
  { id: 'dakoro', name: 'Dakoro', aliases: ['dakoro'], region: 'Maradi', category: 'city', lat: 14.5139, lon: 6.7611, approx: true, distanceFromNiameyKm: 560 },
  { id: 'tessaoua', name: 'Tessaoua', aliases: ['tessaoua'], region: 'Maradi', category: 'city', lat: 13.7542, lon: 7.9875, approx: true, distanceFromNiameyKm: 700 },
  { id: 'magaria', name: 'Magaria', aliases: ['magaria'], region: 'Zinder', category: 'city', lat: 12.9964, lon: 8.9099, approx: true, distanceFromNiameyKm: 950 },
  { id: 'matameye', name: 'Matamèye', aliases: ['matameye', 'matamèye'], region: 'Zinder', category: 'city', lat: 13.4239, lon: 8.4775, approx: true, distanceFromNiameyKm: 900 },
  { id: 'tanout', name: 'Tanout', aliases: ['tanout'], region: 'Zinder', category: 'city', lat: 14.9709, lon: 8.8879, approx: true, distanceFromNiameyKm: 950 },
  { id: 'ayorou', name: 'Ayorou', aliases: ['ayorou'], region: 'Tillabéri', category: 'city', lat: 14.7333, lon: 0.9167, approx: true, distanceFromNiameyKm: 210 },
  { id: 'keita', name: 'Keita', aliases: ['keita'], region: 'Tahoua', category: 'city', lat: 14.7551, lon: 5.7749, approx: true, distanceFromNiameyKm: 600 },
  { id: 'birni-gaoure', name: "Birni N'Gaouré", aliases: ['birni ngaoure', "birni n'gaouré", 'birni n gaoure'], region: 'Dosso', category: 'city', lat: 12.9756, lon: 3.4769, approx: true, distanceFromNiameyKm: 230 },
  { id: 'guerey', name: 'Guérey', aliases: ['guerey', 'guéry'], region: 'Tillabéri', category: 'city', lat: 13.9833, lon: 1.6167, approx: true, distanceFromNiameyKm: 120 },
  { id: 'loga', name: 'Loga', aliases: ['loga'], region: 'Dosso', category: 'city', lat: 13.2994, lon: 4.0164, approx: true, distanceFromNiameyKm: 300 },
  { id: 'tibiri', name: 'Tibiri', aliases: ['tibiri', 'tibiré'], region: 'Dosso', category: 'city', lat: 13.0833, lon: 4.05, approx: true, distanceFromNiameyKm: 320 },
  { id: 'mayahi', name: 'Mayahi', aliases: ['mayahi'], region: 'Maradi', category: 'city', lat: 13.9589, lon: 7.6681, approx: true, distanceFromNiameyKm: 660 },
  { id: 'guidan-roumdji', name: 'Guidan Roumdji', aliases: ['guidan roumdji', 'guidan'], region: 'Maradi', category: 'city', lat: 13.9753, lon: 6.6917, approx: true, distanceFromNiameyKm: 620 },
  { id: 'aguie', name: 'Aguie', aliases: ['aguie', 'aguié'], region: 'Maradi', category: 'city', lat: 13.9783, lon: 7.7808, approx: true, distanceFromNiameyKm: 670 },
  { id: 'maine-soroa', name: 'Mainé-Soroa', aliases: ['maine soroa', 'mainé-soroa', 'soroa'], region: 'Diffa', category: 'city', lat: 13.2117, lon: 11.9939, approx: true, distanceFromNiameyKm: 1300 },
  { id: 'goudoumaria', name: 'Goudoumaria', aliases: ['goudoumaria'], region: 'Diffa', category: 'city', lat: 13.4, lon: 11.2833, approx: true, distanceFromNiameyKm: 1250 },
  { id: 'n-gourti', name: "N'Gourti", aliases: ['n gourti', "n'gourti", 'ngourti'], region: 'Diffa', category: 'city', lat: 13.9833, lon: 12.8167, approx: true, distanceFromNiameyKm: 1450 },
];

/* ------------------------------------------------------------------ */
/* Repères de Niamey                                                   */
/* ------------------------------------------------------------------ */

export const NIAMEY_LANDMARKS: NigerPlace[] = [
  {
    id: 'grand-marche', name: 'Grand Marché de Niamey', aliases: ['grand marche', 'grand marché', 'marché central', 'marche central', 'petit marche', 'petit marché'],
    city: 'Niamey', category: 'market', lat: 13.517, lon: 2.108, approx: true,
    note: { fr: 'Le plus grand marché de la capitale.', dje: 'Kwaara feeri beeri.', ha: 'Babbar kasuwar birni.' },
  },
  {
    id: 'marche-katako', name: 'Marché Katako', aliases: ['katako', 'marche katako', 'marché katako'],
    city: 'Niamey', category: 'market', lat: 13.509, lon: 2.123, approx: true,
  },
  {
    id: 'marche-dole', name: 'Marché Dolé', aliases: ['dole', 'marche dole', 'marché dolé'],
    city: 'Niamey', category: 'market', lat: 13.501, lon: 2.106, approx: true,
  },
  {
    id: 'marche-yantala', name: 'Marché de Yantala', aliases: ['yantala', 'marche yantala', 'marché yantala'],
    city: 'Niamey', category: 'market', lat: 13.524, lon: 2.074, approx: true,
  },
  {
    id: 'airport-nim', name: 'Aéroport International Diori Hamani', aliases: ['aéroport', 'aeroport', 'airport', 'diori hamani', 'nim', 'aéroport de niamey', 'aeroport niamey', 'fil jirgi'],
    city: 'Niamey', category: 'airport', lat: 13.4816, lon: 2.1836, approx: true,
    note: { fr: 'Aéroport international de Niamey (code IATA : NIM).', dje: 'Niamey farru nangu.', ha: 'Filin jirgin sama na Niamey (NIM).' },
  },
  {
    id: 'stade-seyni-kountche', name: 'Stade Général Seyni Kountché', aliases: ['stade', 'stade national', 'stade seyni kountche', 'filin wasa'],
    city: 'Niamey', category: 'stadium', lat: 13.5277, lon: 2.0986, approx: true,
  },
  {
    id: 'palais-29-juillet', name: 'Palais du 29 Juillet', aliases: ['palais du 29 juillet', 'palais 29', 'palais des congres', 'palais des congrès'],
    city: 'Niamey', category: 'landmark', lat: 13.515, lon: 2.1, approx: true,
  },
  {
    id: 'musee-boubou-hama', name: 'Musée National Boubou Hama', aliases: ['musée', 'musee', 'musée national', 'musee national', 'boubou hama'],
    city: 'Niamey', category: 'landmark', lat: 13.5206, lon: 2.1128, approx: true,
    note: { fr: 'Musée national, parc animalier et centre culturel.', dje: 'Kwaara laabo hongray nangu.', ha: 'Gidan kayan tarihi na ƙasa.' },
  },
  {
    id: 'pont-des-martyrs', name: 'Pont des Martyrs (Pont Kennedy)', aliases: ['pont des martyrs', 'pont kennedy', 'pont', 'gadara'],
    city: 'Niamey', category: 'landmark', lat: 13.527, lon: 2.096, approx: true,
    note: { fr: 'Traverse le fleuve Niger vers le nord de la ville.', dje: 'Isa ra kaa.', ha: 'Ya ketare kogin Kwara.' },
  },
  {
    id: 'pont-amitie', name: "Pont de l'Amitié Chine-Niger", aliases: ['pont amitie', 'pont de l amitié', 'pont chine niger', 'pont chinois'],
    city: 'Niamey', category: 'landmark', lat: 13.5, lon: 2.13, approx: true,
  },
  {
    id: 'hopital-lamorde', name: 'Hôpital National Lamordé', aliases: ['lamorde', 'lamordé', 'hôpital lamorde', 'hopital lamorde', 'asibitin lamorde'],
    city: 'Niamey', category: 'hospital', lat: 13.508, lon: 2.12, approx: true,
  },
  {
    id: 'hopital-general-niamey', name: 'Hôpital Général de Référence de Niamey', aliases: ['hôpital général', 'hopital general', 'hgrn', 'asibiti'],
    city: 'Niamey', category: 'hospital', lat: 13.512, lon: 2.103, approx: true,
  },
  {
    id: 'hopital-national-niamey', name: 'Hôpital National de Niamey', aliases: ['hôpital national', 'hopital national', 'hnn'],
    city: 'Niamey', category: 'hospital', lat: 13.5155, lon: 2.105, approx: true,
  },
  {
    id: 'universite-abdou-moumouni', name: 'Université Abdou Moumouni', aliases: ['université', 'universite', 'uam', 'abdou moumouni', 'campus', 'jami a'],
    city: 'Niamey', category: 'university', lat: 13.495, lon: 2.115, approx: true,
  },
  {
    id: 'grande-mosquee', name: 'Grande Mosquée de Niamey', aliases: ['grande mosquée', 'grande mosquee', 'mosquée', 'mosquee', 'masallaci'],
    city: 'Niamey', category: 'mosque', lat: 13.5155, lon: 2.111, approx: true,
  },
  {
    id: 'cathedrale-niamey', name: 'Cathédrale de Niamey', aliases: ['cathédrale', 'cathedrale', 'église', 'eglise', 'coci'],
    city: 'Niamey', category: 'church', lat: 13.5175, lon: 2.1125, approx: true,
  },
  {
    id: 'noom-hotel', name: 'Noom Hotel Niamey', aliases: ['noom', 'noom hotel', 'hôtel noom', 'hotel noom'],
    city: 'Niamey', category: 'hotel', lat: 13.514, lon: 2.103, approx: true,
  },
  {
    id: 'hotel-gaweye', name: 'Hôtel Gaweye', aliases: ['gaweye', 'hôtel gaweye', 'hotel gaweye'],
    city: 'Niamey', category: 'hotel', lat: 13.5165, lon: 2.1065, approx: true,
  },
  {
    id: 'grand-hotel-niamey', name: 'Grand Hôtel de Niamey', aliases: ['grand hôtel', 'grand hotel', 'grand hotel niamey'],
    city: 'Niamey', category: 'hotel', lat: 13.5185, lon: 2.1075, approx: true,
  },
  {
    id: 'hippodrome', name: 'Hippodrome de Niamey', aliases: ['hippodrome', 'courses', 'doki'],
    city: 'Niamey', category: 'landmark', lat: 13.505, lon: 2.1205, approx: true,
  },
  {
    id: 'corniche', name: 'Corniche du fleuve Niger', aliases: ['corniche', 'fleuve', 'fleuve niger', 'berge', 'kogi'],
    city: 'Niamey', category: 'landmark', lat: 13.5205, lon: 2.1, approx: true,
    note: { fr: 'Promenade au bord du fleuve Niger.', dje: 'Isa ganda fondo.', ha: 'Wurin yawo gefen kogin Kwara.' },
  },
  {
    id: 'place-plateau', name: 'Plateau (centre administratif)', aliases: ['plateau', 'centre ville', 'centre-ville', 'quartier plateau'],
    city: 'Niamey', category: 'admin', lat: 13.5185, lon: 2.1045, approx: true,
  },
  {
    id: 'quartier-terminus', name: 'Quartier Terminus', aliases: ['terminus', 'quartier terminus'],
    city: 'Niamey', category: 'landmark', lat: 13.503, lon: 2.113, approx: true,
  },
  {
    id: 'quartier-kalley', name: 'Quartier Kalley', aliases: ['kalley', 'kalé', 'quartier kalley'],
    city: 'Niamey', category: 'landmark', lat: 13.521, lon: 2.086, approx: true,
  },
  {
    id: 'quartier-koira-kano', name: 'Koira Kano', aliases: ['koira kano', 'koyra kano', 'koira'],
    city: 'Niamey', category: 'landmark', lat: 13.526, lon: 2.086, approx: true,
  },
  {
    id: 'quartier-banizoumbou', name: 'Banizoumbou', aliases: ['banizoumbou', 'banizoumbou 1', 'banizoumbou 2'],
    city: 'Niamey', category: 'landmark', lat: 13.5235, lon: 2.068, approx: true,
  },
  {
    id: 'quartier-zongo', name: 'Zongo', aliases: ['zongo', 'quartier zongo'],
    city: 'Niamey', category: 'landmark', lat: 13.5125, lon: 2.0955, approx: true,
  },
  {
    id: 'quartier-lazaret', name: 'Lazaret', aliases: ['lazaret'],
    city: 'Niamey', category: 'landmark', lat: 13.4955, lon: 2.1065, approx: true,
  },
  {
    id: 'quartier-rivera', name: 'Rive Droite / Riyad', aliases: ['rive droite', 'riyad', 'riyadh', 'niamey rive droite'],
    city: 'Niamey', category: 'landmark', lat: 13.535, lon: 2.098, approx: true,
  },
];

export const NIGER_PLACES: NigerPlace[] = [...NIGER_CITIES, ...NIAMEY_LANDMARKS];

/** Mots-clés de catégories pour la recherche de proximité. */
export const PLACE_CATEGORY_KEYWORDS: Record<string, { overpass: string; label: TrilingualText }> = {
  pharmacy: {
    overpass: 'amenity=pharmacy',
    label: { fr: 'pharmacie', dje: 'darzanka hayey nangu', ha: 'kantin magani' },
  },
  hospital: {
    overpass: 'amenity=hospital',
    label: { fr: 'hôpital', dje: 'darzanka fu', ha: 'asibiti' },
  },
  clinic: {
    overpass: 'amenity=clinic',
    label: { fr: 'centre de santé', dje: 'baani fu', ha: 'asibitin ƙaramar hukuma' },
  },
  fuel: {
    overpass: 'amenity=fuel',
    label: { fr: 'station-service', dje: 'esansu nangu', ha: 'tatattarar man fetur' },
  },
  market: {
    overpass: 'amenity=marketplace',
    label: { fr: 'marché', dje: 'feeri nangu', ha: 'kasuwa' },
  },
  bank: {
    overpass: 'amenity=bank',
    label: { fr: 'banque', dje: 'nooru fu', ha: 'banki' },
  },
  atm: {
    overpass: 'amenity=atm',
    label: { fr: 'distributeur de billets', dje: 'nooru ceeci nangu', ha: 'ATM' },
  },
  school: {
    overpass: 'amenity=school',
    label: { fr: 'école', dje: 'karandi fu', ha: 'makaranta' },
  },
  restaurant: {
    overpass: 'amenity=restaurant',
    label: { fr: 'restaurant', dje: 'haŋ cin nangu', ha: 'gidan abinci' },
  },
  hotel: {
    overpass: 'tourism=hotel',
    label: { fr: 'hôtel', dje: 'kungu fu', ha: 'otal' },
  },
  mosque: {
    overpass: 'amenity=place_of_worship',
    label: { fr: 'mosquée', dje: 'alwala fu', ha: 'masallaci' },
  },
  police: {
    overpass: 'amenity=police',
    label: { fr: 'commissariat de police', dje: 'polisi nangu', ha: '‘yan sanda' },
  },
  bus: {
    overpass: 'amenity=bus_station',
    label: { fr: 'gare routière', dje: 'motokar nangu', ha: 'tashar motoci' },
  },
  water: {
    overpass: 'amenity=drinking_water',
    label: { fr: 'point d’eau', dje: 'hari nangu', ha: 'wurin sha ruwa' },
  },
};

/* ------------------------------------------------------------------ */
/* Faits pays                                                          */
/* ------------------------------------------------------------------ */

export const NIGER_FACTS: Array<{ id: string; keywords: string[]; answer: TrilingualText }> = [
  {
    id: 'capital',
    keywords: ['capitale', 'capital', 'babban birni', 'kwaara beeri', 'ville principale'],
    answer: {
      fr: 'La capitale du Niger est Niamey, au bord du fleuve Niger.',
      dje: 'Niger kwaara beeri ti Niamey, isa banda.',
      ha: 'Babban birnin Nijar shine Niamey, a gefen kogin Kwara.',
    },
  },
  {
    id: 'languages',
    keywords: ['langue', 'langues', 'parle', 'harshe', 'harsuna', 'sanni', 'zarma', 'haoussa', 'peul', 'tamasheq'],
    answer: {
      fr: 'Au Niger, le français est la langue officielle. Les langues nationales les plus parlées sont le haoussa, le zarma-songhay, le peul, le tamasheq, l’arabe, le kanuri, le gourmanchéma et le tubu.',
      dje: 'Niger ra, faransi ti laabo sanni. Boro sanni beeriyaŋ ti hausa, zarma, fulan, tamaceq, arabe.',
      ha: 'A Nijar, Faransanci shine harshen hukuma. Manyan harsunan ƙasa sune Hausa, Zarma, Fulfulde, Tamasheq, Larabci, Kanuri da Gourmanchéma.',
    },
  },
  {
    id: 'currency',
    keywords: ['monnaie', 'argent', 'fcfa', 'franc cfa', 'devise', 'kudi', 'nooru', 'cefa'],
    answer: {
      fr: 'La monnaie du Niger est le franc CFA (XOF), commun à huit pays d’Afrique de l’Ouest.',
      dje: 'Niger nooru ti Franc CFA.',
      ha: 'Kuɗin Nijar shine Faran CFA (XOF).',
    },
  },
  {
    id: 'population',
    keywords: ['population', 'habitants', 'combien de personnes', 'mutane', 'boro hinna', 'yawan jama\'a'],
    answer: {
      fr: 'Le Niger compte environ 27 millions d’habitants, avec une population très jeune et en forte croissance.',
      dje: 'Niger ra boro hinna ga koy miliyoŋ 27 ra.',
      ha: 'Nijar tana da kimanin mutane miliyan 27, yawancinsu matasa ne.',
    },
  },
  {
    id: 'area',
    keywords: ['superficie', 'taille', 'km2', 'kilomètres carrés', 'fadin ƙasa', 'laabo beeri'],
    answer: {
      fr: 'Le Niger couvre environ 1 267 000 km² : c’est le plus grand pays d’Afrique de l’Ouest.',
      dje: 'Niger laabo ga beeri, a ga goro km² 1 267 000 ra.',
      ha: 'Nijar tana da fadin kimanin kilomita 1,267,000: ita ce mafi girma a Yammacin Afirka.',
    },
  },
  {
    id: 'regions',
    keywords: ['région', 'régions', 'region', 'yankuna', 'laabey', 'département'],
    answer: {
      fr: 'Le Niger est organisé en 7 régions (Agadez, Diffa, Dosso, Maradi, Tahoua, Tillabéri, Zinder) plus la communauté urbaine de Niamey.',
      dje: 'Niger ga nda laabu hinka kaŋ: Agadez, Diffa, Dosso, Maradi, Tahoua, Tillabéri, Zindi, nda Niamey.',
      ha: 'Nijar tana da yankuna bakwai: Agadez, Diffa, Dosso, Maradi, Tahoua, Tillabéri da Zinder, tare da birnin Niamey.',
    },
  },
  {
    id: 'river',
    keywords: ['fleuve', 'niger river', 'isa', 'kogi', 'rio'],
    answer: {
      fr: 'Le fleuve Niger traverse l’ouest du pays sur environ 600 km, en passant par Niamey, Tillabéri et Gaya.',
      dje: 'Isa beeri ga koy Niamey, Tillabéri, nda Gaya ra.',
      ha: 'Kogin Kwara ya ratsa yammacin ƙasar, ya wuce Niamey, Tillabéri da Gaya.',
    },
  },
  {
    id: 'time_zone',
    keywords: ['fuseau', 'heure locale', 'décalage', 'time zone', 'gmt', 'utc'],
    answer: {
      fr: 'Le Niger est à l’heure GMT+1 (Africa/Niamey) toute l’année, sans changement d’heure.',
      dje: 'Niger waati ti GMT+1, hunkuna kulu.',
      ha: 'Nijar tana kan lokacin GMT+1 (Africa/Niamey) a ko’ina cikin shekara.',
    },
  },
  {
    id: 'dialing',
    keywords: ['indicatif', '+227', '227', 'code pays', 'numéro pays', 'lambar ƙasa'],
    answer: {
      fr: 'L’indicatif téléphonique du Niger est +227.',
      dje: 'Niger telefon laabu lamba ti +227.',
      ha: 'Lambar wayar ƙasar Nijar ita ce +227.',
    },
  },
  {
    id: 'climate',
    keywords: ['climat', 'saison', 'pluie', 'sèche', 'hivernage', 'yanayi', 'damina', 'rabi'],
    answer: {
      fr: 'Le Niger a un climat sahélien : une saison des pluies (juin à septembre) et une longue saison sèche. Il fait très chaud de mars à mai.',
      dje: 'Niger handu ra hari ga ka zaari hinka june hinka september.',
      ha: 'Nijar tana da yanayin Sahel: lokacin damina daga Yuni zuwa Satumba, sannan lokacin rani mai zafi sosai daga Maris zuwa Mayu.',
    },
  },
  {
    id: 'driving',
    keywords: ['conduite', 'rouler', 'droite', 'gauche', 'code de la route', 'tuƙi'],
    answer: {
      fr: 'Au Niger, on conduit à droite, comme en France. Le réseau 230 V / 50 Hz utilise des prises de type C et E.',
      dje: 'Niger ra, fondoo ga koy neema banda.',
      ha: 'A Nijar ana tuƙi a dama. Wutar lantarki 230V/50Hz, na’urar C/E.',
    },
  },
  {
    id: 'independence',
    keywords: ['indépendance', 'independence', '3 août 1960', '1960'],
    answer: {
      fr: 'Le Niger a accédé à l’indépendance le 3 août 1960.',
      dje: 'Niger du a boŋ-še zaari 3 ut 1960.',
      ha: 'Nijar ta sami ’yancin kanta a ranar 3 ga watan Agusta, 1960.',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Recherche dans la base hors-ligne                                   */
/* ------------------------------------------------------------------ */

export function normalizeSearchText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    // Lettres africaines crochetées (haoussa ɓ ɗ ƙ, zarma ŋ ʒ) → latin de base.
    .replace(/[ɓɗƙƴɲŋɛɔəʒčšž]/g, (char) =>
      ({ ɓ: 'b', ɗ: 'd', ƙ: 'k', ƴ: 'y', ɲ: 'n', ŋ: 'n', ɛ: 'e', ɔ: 'o', ə: 'e', ʒ: 'j', č: 'c', š: 's', ž: 'z' })[char] || char,
    )
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cherche un lieu connu (ville ou repère) dans un texte parlé. */
export function matchNigerPlace(text: string): NigerPlace | undefined {
  const haystack = normalizeSearchText(text);
  if (!haystack) return undefined;

  let best: NigerPlace | undefined;
  let bestScore = 0;

  for (const place of NIGER_PLACES) {
    const candidates = [normalizeSearchText(place.name), ...place.aliases.map(normalizeSearchText)].filter(Boolean);
    for (const candidate of candidates) {
      if (!candidate || candidate.length < 3) continue;
      if (haystack.includes(candidate)) {
        // Les noms longs et spécifiques l'emportent (« grand marche » > « marche »).
        const score = candidate.length * (place.category === 'city' ? 1 : 1.15);
        if (score > bestScore) {
          bestScore = score;
          best = place;
        }
      }
    }
  }
  return best;
}

/** Cherche une catégorie de lieu (« pharmacie », « station essence »…). */
export function matchPlaceCategory(text: string): string | undefined {
  const haystack = normalizeSearchText(text);
  const table: Array<[string, string[]]> = [
    ['pharmacy', ['pharmacie', 'pharmacies', 'darzanka', 'kantin magani', 'magunguna']],
    ['hospital', ['hopital', 'hopitaux', 'asibiti', 'darzanka fu', 'lamorde']],
    ['clinic', ['centre de sante', 'case de sante', 'dispensaire', 'csi', 'asibiti karami']],
    ['fuel', ['essence', 'carburant', 'station service', 'station essence', 'gasoil', 'man fetur', 'esansu']],
    ['market', ['marche', 'kasuwa', 'feeri', 'marche de gros']],
    ['bank', ['banque', 'banki', 'nooru fu', 'agence bancaire']],
    ['atm', ['distributeur', 'guichet', 'atm', 'gba', 'dabitar']],
    ['school', ['ecole', 'etablissement', 'lycee', 'makaranta', 'karandi fu', 'college']],
    ['restaurant', ['restaurant', 'maquis', 'resto', 'gidan abinci', 'hanga cin']],
    ['hotel', ['hotel', 'hebergement', 'auberge', 'otal', 'kungu fu']],
    ['mosque', ['mosquee', 'masallaci', 'priere', 'alwala fu']],
    ['police', ['police', 'commissariat', 'gendarmerie', 'yan sanda', 'polisi']],
    ['bus', ['gare routiere', 'gare', 'station de bus', 'tashar motoci', 'autogare']],
    ['water', ['point d eau', 'chateau d eau', 'forage', 'wurin sha ruwa', 'hari nangu']],
  ];

  for (const [key, keywords] of table) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return key;
  }
  return undefined;
}

/** Cherche une réponse factuelle hors-ligne (capitale, monnaie, climat…). */
export function matchNigerFact(text: string): { id: string; answer: TrilingualText } | undefined {
  const haystack = normalizeSearchText(text);
  if (!haystack) return undefined;
  for (const fact of NIGER_FACTS) {
    if (fact.keywords.some((keyword) => haystack.includes(normalizeSearchText(keyword)))) {
      return { id: fact.id, answer: fact.answer };
    }
  }
  return undefined;
}

export function trilingual(text: TrilingualText, language: VoiceLanguage): string {
  if (language === 'dje') return text.dje || text.fr;
  if (language === 'ha') return text.ha || text.fr;
  return text.fr;
}
