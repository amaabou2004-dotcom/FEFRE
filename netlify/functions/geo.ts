import { searchGeo, searchNearby, getRoute, getWeather } from '../../server/geoService';

/**
 * ISA — Fonction Netlify : services géographiques gratuits (sans clé API).
 *
 * Un seul point d'entrée, quatre usages :
 *   /api/geo/search?q=Grand+Marché            → Nominatim (OpenStreetMap)
 *   /api/geo/nearby?category=pharmacy&lat&lon → Overpass API
 *   /api/geo/route?from=lat,lon&to=lat,lon    → OSRM
 *   /api/geo/weather?city=Niamey              → Open-Meteo
 *
 * Le routage se fait via `netlify.toml` (réécritures `/api/*`).
 */

function jsonResponse(status: number, body: Record<string, unknown>, cache: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  });
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  // Le chemin réel reçu peut être /.netlify/functions/geo/search… ou
  // /api/geo/search… selon la réécriture ; on regarde la fin du chemin.
  const segments = url.pathname.split('/').filter(Boolean);
  const action = segments[segments.length - 1] || '';
  const params = url.searchParams;

  try {
    if (action === 'search') {
      const results = await searchGeo({
        q: params.get('q') || '',
        lat: params.get('lat') ? Number(params.get('lat')) : undefined,
        lon: params.get('lon') ? Number(params.get('lon')) : undefined,
        limit: params.get('limit') ? Number(params.get('limit')) : 5,
      });
      return jsonResponse(200, { query: params.get('q') || '', results }, 'public, max-age=600');
    }

    if (action === 'nearby') {
      const results = await searchNearby({
        category: params.get('category') || '',
        lat: params.get('lat') !== null ? Number(params.get('lat')) : undefined,
        lon: params.get('lon') !== null ? Number(params.get('lon')) : undefined,
        radius: params.get('radius') ? Number(params.get('radius')) : 4000,
        limit: params.get('limit') ? Number(params.get('limit')) : 6,
      });
      return jsonResponse(200, { category: params.get('category') || '', results }, 'public, max-age=600');
    }

    if (action === 'route') {
      const [fromLat, fromLon] = String(params.get('from') || '')
        .split(',')
        .map(Number);
      const [toLat, toLon] = String(params.get('to') || '')
        .split(',')
        .map(Number);
      if (![fromLat, fromLon, toLat, toLon].every((value) => Number.isFinite(value))) {
        return jsonResponse(400, { error: 'Paramètres from/to invalides (format lat,lon).' }, 'no-store');
      }
      const route = await getRoute({
        from: { lat: fromLat, lon: fromLon },
        to: { lat: toLat, lon: toLon },
        mode: (params.get('mode') || 'driving') as 'driving' | 'walking' | 'bicycling',
      });
      if (!route) return jsonResponse(502, { error: 'Itinéraire indisponible.' }, 'no-store');
      return jsonResponse(200, route as unknown as Record<string, unknown>, 'public, max-age=1800');
    }

    if (action === 'weather') {
      const weather = await getWeather(params.get('city') || 'Niamey');
      if (!weather) return jsonResponse(502, { error: 'Météo indisponible.' }, 'no-store');
      return jsonResponse(200, weather as unknown as Record<string, unknown>, 'public, max-age=900');
    }

    return jsonResponse(404, { error: 'Service géographique inconnu.' }, 'no-store');
  } catch (error) {
    console.error('[ISA geo] Erreur Netlify', error);
    return jsonResponse(500, { error: 'Erreur interne du service géographique.' }, 'no-store');
  }
};
