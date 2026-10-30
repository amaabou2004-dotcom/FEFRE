import { matchNigerPlace, type NigerPlace } from './nigerKnowledge';
import type { VoiceAction, VoiceCard, VoiceLanguage } from './types';

/**
 * ISA — Liens et actions « Google Maps / OpenStreetMap » SANS clé API
 * ====================================================================
 * Stratégie gratuite retenue pour le Niger :
 *
 *  1. Google Maps en liens profonds (`maps.google.com`, `api=1`) — gratuits,
 *     aucune clé requise, ouvrent l'app Google Maps sur téléphone.
 *  2. Nominatim (OpenStreetMap) pour le géocodage — proxy serveur côté
 *     `/api/geo/search` avec cache, afin de respecter la politique d'usage
 *     (1 req/s, User-Agent valide).
 *  3. OSRM pour les itinéraires/distances réelles — proxy `/api/geo/route`.
 *  4. Overpass pour la recherche de proximité (pharmacies, stations…) —
 *     proxy `/api/geo/nearby`.
 *  5. Repli hors-ligne : la base `nigerKnowledge` (coordonnées approchées).
 *
 * Aucun de ces services n'exige de carte bancaire. Les iframes Google Maps
 * « embed » utilisent aussi le format sans clé (`?q=…&output=embed`).
 */

export type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycling';

export interface LatLng {
  lat: number;
  lon: number;
}

/** Encode proprement une destination pour les URL Google Maps. */
export function encodePlace(value: string): string {
  const text = String(value || '').trim();
  if (!text) return '';
  // Ajoute le pays pour éviter que Google Maps parte sur un homonyme ailleurs.
  const needsCountry = !/niger|niamey|ne\b/i.test(text);
  const query = needsCountry ? `${text}, Niger` : text;
  return encodeURIComponent(query);
}

/** Recherche Google Maps (sans clé). */
export function googleMapsSearchUrl(destination: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodePlace(destination)}`;
}

/** Itinéraire Google Maps (sans clé). */
export function googleMapsDirectionsUrl(params: {
  destination: string;
  origin?: string | LatLng;
  mode?: TravelMode;
}): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  if (params.origin) {
    url.searchParams.set(
      'origin',
      typeof params.origin === 'string' ? params.origin : `${params.origin.lat},${params.origin.lon}`,
    );
  }
  // Des coordonnées brutes passent telles quelles ; un nom de lieu est enrichi
  // du pays pour éviter que Google Maps ne parte sur un homonyme étranger.
  const isCoordinates = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(params.destination);
  url.searchParams.set('destination', isCoordinates ? params.destination.trim() : `${params.destination}, Niger`);
  url.searchParams.set('travelmode', params.mode || 'driving');
  url.searchParams.set('hl', 'fr');
  return url.toString();
}

/** Fiche lieu Google Maps (sans clé). */
export function googleMapsPlaceUrl(destination: string, coords?: LatLng): string {
  if (coords) {
    return `https://www.google.com/maps/place/${encodePlace(destination)}/@${coords.lat},${coords.lon},17z`;
  }
  return `https://www.google.com/maps/place/?api=1&query=${encodePlace(destination)}`;
}

/** Carte intégrable dans une iframe (sans clé). */
export function googleMapsEmbedUrl(query: string, coords?: LatLng, zoom = 14): string {
  if (coords) {
    return `https://www.google.com/maps?q=${coords.lat},${coords.lon}&z=${zoom}&hl=fr&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodePlace(query)}&hl=fr&output=embed`;
}

/** Lien « appeler » universel (mobile + bureau). */
export function telUrl(phoneNumber: string): string {
  const digits = String(phoneNumber || '').replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

/** Lien SMS pré-rempli. */
export function smsUrl(phoneNumber: string, body?: string): string {
  const digits = String(phoneNumber || '').replace(/[^\d+]/g, '');
  const base = `sms:${digits}`;
  return body ? `${base}?&body=${encodeURIComponent(body)}` : base;
}

/** Lien WhatsApp (wa.me) avec indicatif Niger par défaut. */
export function whatsappUrl(phoneNumber: string, body?: string): string {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  const normalized = digits.length === 8 ? `227${digits}` : digits;
  const base = `https://wa.me/${normalized}`;
  return body ? `${base}?text=${encodeURIComponent(body)}` : base;
}

/** Lien e-mail pré-rempli. */
export function mailtoUrl(address: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  return `mailto:${address}${query ? `?${query}` : ''}`;
}

/**
 * Coordonnées de repli hors-ligne : si le lieu est connu dans la base Niger,
 * on renvoie ses coordonnées approchées. Sinon, `undefined` et l'appel réseau
 * (Nominatim) prend le relais.
 */
export function offlineCoordsFor(destination: string): LatLng | undefined {
  const place = matchNigerPlace(destination);
  return place ? { lat: place.lat, lon: place.lon } : undefined;
}

/** Construit l'action « carte » la plus utile selon le contexte. */
export function buildMapActions(params: {
  destination?: string;
  origin?: LatLng;
  mode?: TravelMode;
  language: VoiceLanguage;
  coords?: LatLng;
}): { actions: VoiceAction[]; card?: VoiceCard } {
  const destination = params.destination?.trim();
  if (!destination) return { actions: [] };

  const coords = params.coords || offlineCoordsFor(destination);
  const place = matchNigerPlace(destination);
  const searchUrl = googleMapsSearchUrl(destination);
  const directionsUrl = googleMapsDirectionsUrl({
    destination: coords ? `${coords.lat},${coords.lon}` : destination,
    origin: params.origin ? `${params.origin.lat},${params.origin.lon}` : undefined,
    mode: params.mode || 'driving',
  });

  const actions: VoiceAction[] = [
    {
      type: 'show_map',
      query: destination,
      lat: coords?.lat,
      lon: coords?.lon,
      label: place?.name || destination,
      zoom: place?.category === 'city' ? 12 : 16,
    },
    { type: 'navigate_to', origin: params.origin ? `${params.origin.lat},${params.origin.lon}` : undefined, destination, mode: params.mode || 'driving', url: directionsUrl },
    { type: 'open_map', url: searchUrl, label: place?.name || destination },
  ];

  const card: VoiceCard = {
    kind: params.origin ? 'route' : 'place',
    title: place?.name || destination,
    subtitle: place?.city || place?.region || 'Niger',
    primaryAction: { type: 'navigate_to', destination, mode: params.mode || 'driving', url: directionsUrl },
    secondaryAction: { type: 'open_map', url: searchUrl, label: destination },
    meta: [
      ...(place?.distanceFromNiameyKm && place.distanceFromNiameyKm > 0
        ? [{ label: 'Distance depuis Niamey', value: `≈ ${place.distanceFromNiameyKm} km (indicatif)` }]
        : []),
      ...(coords ? [{ label: 'Coordonnées (approchées, hors-ligne)', value: `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` }] : []),
    ],
  };

  return { actions, card };
}

/**
 * Normalise un mode de transport exprimé à l'oral (« à pied », « en taxi »,
 * « tafiya »…). Retourne le mode Google Maps correspondant.
 */
export function detectTravelMode(text: string): TravelMode {
  const value = String(text || '').toLowerCase();
  if (/(à pied|a pied|marche|walk|walking|tafiya|koy ne)/.test(value)) return 'walking';
  if (/(bus|taxi|transport|commun|transit|saa|mota)/.test(value)) return 'transit';
  if (/(vélo|velo|bicycle|bike|karkara)/.test(value)) return 'bicycling';
  return 'driving';
}

/** Carte de contact pour les appels/SMS/WhatsApp. */
export function buildContactCard(params: {
  name: string;
  phoneNumber?: string;
  label?: string;
  language: VoiceLanguage;
}): { actions: VoiceAction[]; card?: VoiceCard } {
  const actions: VoiceAction[] = [];
  if (params.phoneNumber) {
    actions.push({ type: 'call', phoneNumber: params.phoneNumber, label: params.name });
    actions.push({ type: 'sms', phoneNumber: params.phoneNumber, body: params.label });
    actions.push({ type: 'whatsapp', phoneNumber: params.phoneNumber, body: params.label });
  }
  const card: VoiceCard | undefined = params.phoneNumber
    ? {
        kind: 'contact',
        title: params.name,
        subtitle: params.phoneNumber,
        primaryAction: { type: 'call', phoneNumber: params.phoneNumber, label: params.name },
        secondaryAction: { type: 'whatsapp', phoneNumber: params.phoneNumber, body: params.label },
        meta: params.label ? [{ label: 'Message', value: params.label }] : undefined,
      }
    : undefined;
  return { actions, card };
}

/** Formate une distance/une durée pour la parole (français simple). */
export function formatDistance(meters: number, language: VoiceLanguage): string {
  if (!Number.isFinite(meters)) return '';
  if (meters < 950) {
    const rounded = Math.round(meters / 10) * 10;
    if (language === 'ha') return `mita ${rounded}`;
    if (language === 'dje') return `meeter ${rounded}`;
    return `${rounded} mètres`;
  }
  const km = meters / 1000;
  const text = km < 10 ? km.toFixed(1).replace('.', ',') : String(Math.round(km));
  if (language === 'ha') return `kilomita ${text}`;
  if (language === 'dje') return `kilomeeter ${text}`;
  return `${text} km`;
}

export function formatDuration(seconds: number, language: VoiceLanguage): string {
  if (!Number.isFinite(seconds)) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    if (language === 'ha') return `mintuna ${minutes}`;
    if (language === 'dje') return `minti ${minutes}`;
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (language === 'ha') return rest ? `awa ${hours} da mintuna ${rest}` : `awa ${hours}`;
  if (language === 'dje') return rest ? `saati ${hours} nda minti ${rest}` : `saati ${hours}`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}
