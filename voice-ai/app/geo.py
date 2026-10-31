"""
ISA — Services géographiques gratuits (proxy local)
==================================================
Mêmes services que le proxy Node du site, mais exécutés depuis le serveur de
Niamey : utile quand le site est servi en local ou quand on veut centraliser le
cache sur une seule machine du bureau.

  • Nominatim  (OpenStreetMap) : géocodage d'adresses et de lieux
  • Overpass   : recherche de proximité (pharmacies, stations, hôpitaux…)
  • OSRM       : distances et durées réelles
  • Open-Meteo : météo, sans clé ni inscription

Respect des politiques d'usage : User-Agent identifiable, 1 requête/seconde
pour Nominatim, cache local généreux (la data coûte cher au Niger).
"""

from __future__ import annotations

import json
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Tuple

from .config import SETTINGS
from .knowledge import CATEGORY_TAGS, find_place

_CACHE: Dict[str, Tuple[float, object]] = {}
_CACHE_LOCK = threading.Lock()
_last_nominatim = 0.0
_THROTTLE_LOCK = threading.Lock()


def _cache_get(key: str):
    with _CACHE_LOCK:
        entry = _CACHE.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if expires_at < time.time():
            _CACHE.pop(key, None)
            return None
        return value


def _cache_set(key: str, value: object, ttl: Optional[int] = None) -> None:
    with _CACHE_LOCK:
        if len(_CACHE) > 800:
            now = time.time()
            for stale in [k for k, (exp, _) in _CACHE.items() if exp < now]:
                _CACHE.pop(stale, None)
        _CACHE[key] = (time.time() + (ttl or SETTINGS.geo_cache_seconds), value)


def _fetch_json(url: str, timeout: int = 12, data: Optional[bytes] = None, headers: Optional[Dict[str, str]] = None):
    request_headers = {
        "User-Agent": SETTINGS.geo_user_agent,
        "Accept": "application/json",
    }
    if headers:
        request_headers.update(headers)
    request = urllib.request.Request(url, data=data, headers=request_headers, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
        print(f"[ISA geo] Échec {url[:80]} : {error}")
        return None


def _throttle_nominatim() -> None:
    """Nominatim exige au plus 1 requête par seconde."""
    global _last_nominatim
    with _THROTTLE_LOCK:
        wait = 1.1 - (time.time() - _last_nominatim)
        if wait > 0:
            time.sleep(wait)
        _last_nominatim = time.time()


def search(query: str, lat: Optional[float] = None, lon: Optional[float] = None, limit: int = 5) -> List[Dict[str, object]]:
    """Géocodage : texte → coordonnées (Nominatim, biaisé vers le Niger)."""
    if not SETTINGS.geo_enabled or not query.strip():
        return []

    cache_key = f"geo:{query.lower()}:{lat}:{lon}:{limit}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    # Repli hors-ligne immédiat : le lieu est-il déjà connu ?
    known = find_place(query)
    offline: List[Dict[str, object]] = []
    if known:
        offline.append(
            {
                "name": str(known.get("name")),
                "lat": float(known.get("lat", 0)),  # type: ignore[arg-type]
                "lon": float(known.get("lon", 0)),  # type: ignore[arg-type]
                "type": "offline",
                "source": "offline",
            }
        )

    text = query if "niger" in query.lower() else f"{query}, Niger"
    params = {
        "q": text,
        "format": "jsonv2",
        "limit": str(min(10, limit)),
        "addressdetails": "1",
        "accept-language": "fr,en",
        "countrycodes": "ne",
    }
    if lat is not None and lon is not None:
        delta = 0.35
        params["viewbox"] = f"{lon - delta},{lat + delta},{lon + delta},{lat - delta}"
    else:
        params["viewbox"] = "0.1,23.6,16.0,11.6"

    _throttle_nominatim()
    payload = _fetch_json(f"{SETTINGS.nominatim_url.rstrip('/')}/search?{urllib.parse.urlencode(params)}")

    results: List[Dict[str, object]] = []
    if isinstance(payload, list):
        for item in payload[:limit]:
            try:
                address = item.get("address") or {}
                results.append(
                    {
                        "name": str(item.get("name") or str(item.get("display_name", "")).split(",")[0]),
                        "displayName": item.get("display_name"),
                        "lat": float(item.get("lat")),
                        "lon": float(item.get("lon")),
                        "type": item.get("type") or item.get("class"),
                        "city": address.get("city") or address.get("town") or address.get("village"),
                        "source": "osm",
                    }
                )
            except (TypeError, ValueError):
                continue

    if results:
        _cache_set(cache_key, results)
        return results
    return offline


def nearby(category: str, lat: float, lon: float, radius: int = 4000, limit: int = 6) -> List[Dict[str, object]]:
    """Recherche de proximité via Overpass (OpenStreetMap)."""
    if not SETTINGS.geo_enabled:
        return []
    tag = CATEGORY_TAGS.get(category)
    if not tag:
        return []

    cache_key = f"near:{category}:{round(lat, 3)}:{round(lon, 3)}:{radius}:{limit}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    key, value = tag.split("=", 1)
    query = f"""[out:json][timeout:20];
(
  nwr["{key}"="{value}"](around:{radius},{lat},{lon});
);
out center tags {limit};"""

    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    for endpoint in SETTINGS.overpass_urls:
        payload = _fetch_json(
            endpoint,
            timeout=25,
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if not isinstance(payload, dict):
            continue
        elements = payload.get("elements") or []
        results: List[Dict[str, object]] = []
        for element in elements[:limit]:
            tags = element.get("tags") or {}
            element_lat = element.get("lat") or (element.get("center") or {}).get("lat")
            element_lon = element.get("lon") or (element.get("center") or {}).get("lon")
            if element_lat is None or element_lon is None:
                continue
            results.append(
                {
                    "name": str(tags.get("name") or tags.get("name:fr") or tags.get("operator") or category),
                    "displayName": ", ".join([str(x) for x in [tags.get("addr:street"), tags.get("addr:city") or "Niamey", "Niger"] if x]),
                    "lat": float(element_lat),
                    "lon": float(element_lon),
                    "type": tags.get(key),
                    "phone": tags.get("phone") or tags.get("contact:phone"),
                    "opening_hours": tags.get("opening_hours"),
                    "source": "osm",
                }
            )
        if results:
            _cache_set(cache_key, results, ttl=1200)
            return results
    return []


WEATHER_CODES: Dict[int, str] = {
    0: "Ciel dégagé",
    1: "Plutôt dégagé",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Forte pluie",
    80: "Averses légères",
    81: "Averses modérées",
    82: "Averses violentes",
    95: "Orage",
    96: "Orage avec grêle",
    99: "Orage violent avec grêle",
}


def weather(city: str = "Niamey") -> Optional[Dict[str, object]]:
    """Météo Open-Meteo (sans clé) avec géocodage intégré."""
    if not SETTINGS.geo_enabled:
        return None

    cache_key = f"weather:{city.lower()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    geo_params = urllib.parse.urlencode({"name": city, "count": "1", "language": "fr", "countryCode": "NE"})
    geo = _fetch_json(f"{SETTINGS.open_meteo_geocode}?{geo_params}", timeout=10)
    if not isinstance(geo, dict):
        # Repli : coordonnées connues hors-ligne.
        known = find_place(city)
        if not known:
            return None
        lat, lon, name = float(known.get("lat", 13.5137)), float(known.get("lon", 2.1098)), str(known.get("name"))  # type: ignore[arg-type]
    else:
        results = geo.get("results") or []
        if not results:
            return None
        lat = float(results[0]["latitude"])
        lon = float(results[0]["longitude"])
        name = str(results[0].get("name") or city)

    params = urllib.parse.urlencode(
        {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
            "daily": "temperature_2m_min,temperature_2m_max,weather_code",
            "forecast_days": "3",
            "timezone": "Africa/Niamey",
        }
    )
    payload = _fetch_json(f"{SETTINGS.open_meteo_url}?{params}", timeout=12)
    if not isinstance(payload, dict):
        return None

    current = payload.get("current") or {}
    daily = payload.get("daily") or {}
    forecast: List[Dict[str, object]] = []
    for index in range(min(3, len(daily.get("time") or []))):
        forecast.append(
            {
                "day": daily["time"][index],
                "minC": daily.get("temperature_2m_min", [None])[index],
                "maxC": daily.get("temperature_2m_max", [None])[index],
                "condition": WEATHER_CODES.get(int(daily.get("weather_code", [-1])[index]), "—"),
            }
        )

    result: Dict[str, object] = {
        "city": name,
        "temperatureC": current.get("temperature_2m"),
        "condition": WEATHER_CODES.get(int(current.get("weather_code", -1)), "—"),
        "humidity": current.get("relative_humidity_2m"),
        "windKmh": current.get("wind_speed_10m"),
        "forecast": forecast,
        "source": "open-meteo",
    }
    _cache_set(cache_key, result, ttl=900)
    return result


def route(from_lat: float, from_lon: float, to_lat: float, to_lon: float, mode: str = "driving") -> Optional[Dict[str, object]]:
    """Itinéraire OSRM (distance + durée réelles)."""
    if not SETTINGS.geo_enabled:
        return None
    profile = {"walking": "foot", "bicycling": "bike"}.get(mode, "driving")
    cache_key = f"route:{profile}:{round(from_lat, 4)},{round(from_lon, 4)}:{round(to_lat, 4)},{round(to_lon, 4)}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    url = (
        f"{SETTINGS.osrm_url.rstrip('/')}/route/v1/{profile}/"
        f"{from_lon},{from_lat};{to_lon},{to_lat}?overview=false&steps=true"
    )
    payload = _fetch_json(url, timeout=15)
    if not isinstance(payload, dict):
        return None
    routes = payload.get("routes") or []
    if not routes:
        return None
    first = routes[0]
    steps: List[str] = []
    legs = first.get("legs") or []
    if legs:
        for step in (legs[0].get("steps") or [])[:12]:
            maneuver = (step.get("maneuver") or {}).get("type", "")
            road = f" sur {step['name']}" if step.get("name") else ""
            distance_km = float(step.get("distance") or 0) / 1000
            steps.append(f"{str(maneuver).replace('-', ' ')}{road} ({distance_km:.1f} km)")

    result: Dict[str, object] = {
        "distanceMeters": float(first.get("distance") or 0),
        "durationSeconds": float(first.get("duration") or 0),
        "steps": steps,
        "source": "osrm",
    }
    _cache_set(cache_key, result, ttl=1800)
    return result
