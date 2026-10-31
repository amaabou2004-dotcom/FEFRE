/**
 * ISA — Services géographiques GRATUITS (aucune clé API)
 * ======================================================
 * L'intégration « Google Maps Niger » repose sur deux piliers :
 *
 *  1. Les liens profonds Google Maps (côté navigateur, sans clé) pour afficher
 *     la carte, lancer la navigation et ouvrir l'app Google Maps du téléphone.
 *  2. Des services ouverts, relayés par ce proxy serveur :
 *       • Nominatim (OpenStreetMap) → géocodage d'adresses et de lieux,
 *       • Overpass API             → recherche de proximité (pharmacies,
 *                                    stations-service, hôpitaux…),
 *       • OSRM                     → distances et durées réelles d'itinéraire,
 *       • Open-Meteo               → météo (sans clé, sans inscription).
 *
 * Le proxy existe pour trois raisons : éviter le blocage CORS du navigateur,
 * respecter la politique d'usage de Nominatim (1 requête/s + User-Agent
 * identifiant) et mettre en cache — ce qui réduit fortement la consommation
 * data, précieuse au Niger.
 */

const USER_AGENT = 'ISA-Niger-VoiceAssistant/1.0 (excellence-services-sarl.com; contact: admin@excellence-services-sarl.com)';
const CACHE_TTL_MS = 10 * 60 * 1000;
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

/** Cadre géographique du Niger, pour biaiser les recherches vers le pays. */
const NIGER_VIEWBOX = { left: 0.1, bottom: 11.6, right: 16.0, top: 23.6 };

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function readCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function writeCache(key: string, value: unknown, ttl = CACHE_TTL_MS): void {
  if (cache.size > 600) {
    // Nettoyage simple : on supprime les entrées expirées puis les plus anciennes.
    const now = Date.now();
    for (const [key2, entry] of cache.entries()) {
      if (entry.expiresAt < now) cache.delete(key2);
    }
    if (cache.size > 600) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

/* ------------------------------------------------------------------ */
/* File d'attente Nominatim (1 requête/seconde, politique OSM)          */
/* ------------------------------------------------------------------ */

let lastNominatimCall = 0;
const MIN_INTERVAL_MS = 1100;

async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const wait = Math.max(0, lastNominatimCall + MIN_INTERVAL_MS - now);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimCall = Date.now();
  return fn();
}

async function fetchJsonExternal(url: string, init?: RequestInit, timeoutMs = 9000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Géocodage (Nominatim)                                               */
/* ------------------------------------------------------------------ */

export interface GeoResult {
  name: string;
  displayName?: string;
  lat: number;
  lon: number;
  type?: string;
  city?: string;
  source: 'osm';
}

export async function searchGeo(params: {
  q: string;
  lat?: number;
  lon?: number;
  limit?: number;
}): Promise<GeoResult[]> {
  const query = String(params.q || '').trim();
  if (!query) return [];

  const cacheKey = `geo:${query.toLowerCase()}:${params.lat ?? ''}:${params.lon ?? ''}:${params.limit ?? 5}`;
  const cached = readCache<GeoResult[]>(cacheKey);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', /niger/i.test(query) ? query : `${query}, Niger`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', String(Math.min(10, params.limit || 5)));
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'fr,en');
  url.searchParams.set('countrycodes', 'ne');
  url.searchParams.set('viewbox', `${NIGER_VIEWBOX.left},${NIGER_VIEWBOX.top},${NIGER_VIEWBOX.right},${NIGER_VIEWBOX.bottom}`);
  url.searchParams.set('bounded', '0');
  if (params.lat !== undefined && params.lon !== undefined) {
    // Tri par proximité : Nominatim accepte un point de référence via `viewbox`.
    const delta = 0.35;
    url.searchParams.set('viewbox', `${params.lon - delta},${params.lat + delta},${params.lon + delta},${params.lat - delta}`);
  }

  try {
    const payload = await throttled(() => fetchJsonExternal(url.toString()));
    if (!Array.isArray(payload)) return [];
    const results: GeoResult[] = payload
      .map((item: any) => ({
        name: String(item?.name || item?.display_name?.split(',')[0] || query),
        displayName: item?.display_name ? String(item.display_name) : undefined,
        lat: Number(item?.lat),
        lon: Number(item?.lon),
        type: item?.type || item?.class,
        city: item?.address?.city || item?.address?.town || item?.address?.village || item?.address?.municipality,
        source: 'osm' as const,
      }))
      .filter((item: GeoResult) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
      .slice(0, params.limit || 5);
    if (results.length) writeCache(cacheKey, results);
    return results;
  } catch (error) {
    console.warn('[ISA geo] Nominatim indisponible :', (error as Error)?.message || error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Recherche de proximité (Overpass)                                   */
/* ------------------------------------------------------------------ */

const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

const CATEGORY_TAGS: Record<string, string> = {
  pharmacy: 'amenity=pharmacy',
  hospital: 'amenity=hospital',
  clinic: 'amenity=clinic',
  fuel: 'amenity=fuel',
  market: 'amenity=marketplace',
  bank: 'amenity=bank',
  atm: 'amenity=atm',
  school: 'amenity=school',
  restaurant: 'amenity=restaurant',
  hotel: 'tourism=hotel',
  mosque: 'amenity=place_of_worship',
  police: 'amenity=police',
  bus: 'amenity=bus_station',
  water: 'amenity=drinking_water',
};

export async function searchNearby(params: {
  category: string;
  lat?: number;
  lon?: number;
  radius?: number;
  limit?: number;
}): Promise<GeoResult[]> {
  const tag = CATEGORY_TAGS[params.category];
  if (!tag) return [];
  if (params.lat === undefined || params.lon === undefined) return [];

  const radius = Math.min(25000, Math.max(500, params.radius || 4000));
  const limit = Math.min(20, params.limit || 6);
  const cacheKey = `near:${params.category}:${params.lat.toFixed(3)}:${params.lon.toFixed(3)}:${radius}:${limit}`;
  const cached = readCache<GeoResult[]>(cacheKey);
  if (cached) return cached;

  const [key, value] = tag.split('=');
  const query = `[out:json][timeout:20];
(
  nwr["${key}"="${value}"](around:${radius},${params.lat},${params.lon});
);
out center tags ${limit};`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const elements = Array.isArray(payload?.elements) ? payload.elements : [];
      const results: GeoResult[] = elements
        .map((element: any) => {
          const tags = element?.tags || {};
          const lat = Number(element?.lat ?? element?.center?.lat);
          const lon = Number(element?.lon ?? element?.center?.lon);
          return {
            name: String(tags?.name || tags?.['name:fr'] || tags?.operator || params.category),
            displayName: [tags?.['addr:street'], tags?.['addr:city'] || 'Niamey', 'Niger'].filter(Boolean).join(', '),
            lat,
            lon,
            type: tags?.[key],
            city: tags?.['addr:city'],
            source: 'osm' as const,
          };
        })
        .filter((item: GeoResult) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
        .slice(0, limit);
      if (results.length) writeCache(cacheKey, results, 20 * 60 * 1000);
      return results;
    } catch {
      // On essaie le miroir suivant.
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Itinéraire (OSRM)                                                   */
/* ------------------------------------------------------------------ */

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  steps: string[];
  source: 'osrm';
}

export async function getRoute(params: {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  mode?: 'driving' | 'walking' | 'bicycling';
}): Promise<RouteResult | null> {
  const profile = params.mode === 'walking' ? 'foot' : params.mode === 'bicycling' ? 'bike' : 'driving';
  const cacheKey = `route:${profile}:${params.from.lat.toFixed(4)},${params.from.lon.toFixed(4)}:${params.to.lat.toFixed(4)},${params.to.lon.toFixed(4)}`;
  const cached = readCache<RouteResult | null>(cacheKey);
  if (cached) return cached;

  const url = `https://router.project-osrm.org/route/v1/${profile}/${params.from.lon},${params.from.lat};${params.to.lon},${params.to.lat}?overview=false&steps=true&annotations=distance`;

  try {
    const payload = await fetchJsonExternal(url, undefined, 12000);
    const route = payload?.routes?.[0];
    if (!route) return null;
    const steps: string[] = [];
    (route?.legs?.[0]?.steps || []).slice(0, 12).forEach((step: any) => {
      const instruction = String(step?.maneuver?.type || '').replace(/-/g, ' ');
      const road = step?.name ? ` sur ${step.name}` : '';
      const distanceKm = Number(step?.distance || 0) / 1000;
      steps.push(`${instruction}${road} (${distanceKm.toFixed(1)} km)`);
    });
    const result: RouteResult = {
      distanceMeters: Number(route.distance || 0),
      durationSeconds: Number(route.duration || 0),
      steps,
      source: 'osrm',
    };
    writeCache(cacheKey, result, 30 * 60 * 1000);
    return result;
  } catch (error) {
    console.warn('[ISA geo] OSRM indisponible :', (error as Error)?.message || error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Météo (Open-Meteo, sans clé)                                        */
/* ------------------------------------------------------------------ */

const WEATHER_CODES: Record<number, string> = {
  0: 'Ciel dégagé',
  1: 'Plutôt dégagé',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine modérée',
  55: 'Bruine dense',
  61: 'Pluie légère',
  63: 'Pluie modérée',
  65: 'Forte pluie',
  71: 'Neige légère',
  80: 'Averses légères',
  81: 'Averses modérées',
  82: 'Averses violentes',
  95: 'Orage',
  96: 'Orage avec grêle',
  99: 'Orage violent avec grêle',
};

export interface WeatherResult {
  city: string;
  temperatureC: number;
  condition: string;
  humidity?: number;
  windKmh?: number;
  forecast?: Array<{ day: string; minC: number; maxC: number; condition: string }>;
  source: 'open-meteo';
}

export async function getWeather(city = 'Niamey'): Promise<WeatherResult | null> {
  const target = String(city || 'Niamey').trim() || 'Niamey';
  const cacheKey = `weather:${target.toLowerCase()}`;
  const cached = readCache<WeatherResult | null>(cacheKey);
  if (cached) return cached;

  try {
    // 1) Géocodage Open-Meteo (évite de solliciter Nominatim).
    const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geoUrl.searchParams.set('name', target);
    geoUrl.searchParams.set('count', '1');
    geoUrl.searchParams.set('language', 'fr');
    geoUrl.searchParams.set('countryCode', 'NE');
    const geo = await fetchJsonExternal(geoUrl.toString());
    const place = geo?.results?.[0];
    const lat = Number(place?.latitude);
    const lon = Number(place?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    // 2) Prévisions.
    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', String(lat));
    forecastUrl.searchParams.set('longitude', String(lon));
    forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
    forecastUrl.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max,weather_code');
    forecastUrl.searchParams.set('forecast_days', '3');
    forecastUrl.searchParams.set('timezone', 'Africa/Niamey');
    const forecast = await fetchJsonExternal(forecastUrl.toString());

    const current = forecast?.current || {};
    const daily = forecast?.daily || {};
    const days: WeatherResult['forecast'] = [];
    for (let index = 0; index < Math.min(3, (daily?.time || []).length); index += 1) {
      days.push({
        day: String(daily.time[index]),
        minC: Number(daily.temperature_2m_min?.[index]),
        maxC: Number(daily.temperature_2m_max?.[index]),
        condition: WEATHER_CODES[Number(daily.weather_code?.[index])] || '—',
      });
    }

    const result: WeatherResult = {
      city: String(place?.name || target),
      temperatureC: Number(current.temperature_2m),
      condition: WEATHER_CODES[Number(current.weather_code)] || '—',
      humidity: current.relative_humidity_2m !== undefined ? Number(current.relative_humidity_2m) : undefined,
      windKmh: current.wind_speed_10m !== undefined ? Number(current.wind_speed_10m) : undefined,
      forecast: days,
      source: 'open-meteo',
    };
    if (Number.isFinite(result.temperatureC)) writeCache(cacheKey, result, WEATHER_CACHE_TTL_MS);
    return result;
  } catch (error) {
    console.warn('[ISA geo] Open-Meteo indisponible :', (error as Error)?.message || error);
    return null;
  }
}

/** Phrase météo prête à être prononcée, en trois langues. */
export function describeWeather(weather: WeatherResult | null, language: 'fr' | 'dje' | 'ha' | 'en'): string {
  if (!weather) {
    if (language === 'ha') return 'Ban iya samun yanayi a halin yanzu. Ka gwada daga baya.';
    if (language === 'dje') return 'Ay mana hin ma handu du sohonno. Ma koyne cebe.';
    if (language === 'en') return 'I could not fetch the weather right now. Please try again later.';
    return 'Je ne peux pas récupérer la météo pour le moment. Réessayez dans un instant.';
  }
  const temp = Math.round(weather.temperatureC);
  if (language === 'ha') {
    return `Yanayin ${weather.city}: ${weather.condition.toLowerCase()}, zafin ${temp}°C. Iska ${Math.round(weather.windKmh || 0)} km/h.`;
  }
  if (language === 'dje') {
    return `${weather.city} handu: ${weather.condition.toLowerCase()}, kaari ${temp}°C. Haw ${Math.round(weather.windKmh || 0)} km/h.`;
  }
  if (language === 'en') {
    return `Weather in ${weather.city}: ${weather.condition.toLowerCase()}, ${temp}°C. Wind ${Math.round(weather.windKmh || 0)} km/h.`;
  }
  return `Météo à ${weather.city} : ${weather.condition.toLowerCase()}, ${temp} °C. Vent ${Math.round(weather.windKmh || 0)} km/h.`;
}
