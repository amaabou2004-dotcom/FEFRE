"""
ISA — Serveur vocal local (Niamey)
==================================
API FastAPI qui alimente l'assistant vocal du site `FEFRE` :

    GET  /health          capacités réelles de la machine (STT/TTS/LLM)
    POST /stt             audio (base64 ou fichier) → texte   [Whisper]
    POST /tts             texte → audio WAV base64            [Piper/MMS]
    GET  /tts.wav         texte → audio WAV directement lisible
    POST /think           texte → réponse + actions           [règles + LLM local]
    POST /translate       français ↔ zarma ↔ haoussa
    GET  /geo/search      géocodage Nominatim
    GET  /geo/nearby      proximité Overpass (pharmacies…)
    GET  /geo/route       itinéraire OSRM
    GET  /geo/weather     météo Open-Meteo
    GET  /                page d'état (lisible depuis un téléphone du réseau)

Démarrage :
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8787

Aucune dépendance n'est obligatoire : le serveur démarre toujours et annonce
honnêtement ce qu'il sait faire. Installez les briques voulues (Whisper, Piper,
MMS-TTS, Ollama) selon la puissance de la machine.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response

from . import geo, knowledge, llm, stt, tts
from .audio import any_audio_to_wav16k, base64_to_bytes, bytes_to_base64, float32_to_wav, wav_to_float32
from .config import SETTINGS, language_to_mms

app = FastAPI(
    title="ISA — Assistant vocal du Niger",
    version="1.0.0",
    description=(
        "Serveur IA 100 % local : reconnaissance vocale (Whisper), voix zarma/haoussa "
        "(MMS-TTS), français (Piper), cerveau (règles hors-ligne + Ollama), cartes et "
        "météo via OpenStreetMap/Open-Meteo. Créé pour Excellence Services SARL, Niamey."
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=SETTINGS.cors_origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-ISA-Engine"],
)

_STARTED_AT = time.time()


# ─────────────────────────────────────────────────────────────────────────────
# Sécurité minimale (clé partagée, optionnelle)
# ─────────────────────────────────────────────────────────────────────────────
@app.middleware("http")
async def check_api_key(request: Request, call_next):
    if SETTINGS.api_key and not request.url.path.startswith(("/health", "/", "/docs", "/openapi.json")):
        provided = request.headers.get("x-isa-key") or request.query_params.get("key")
        if provided != SETTINGS.api_key:
            return JSONResponse(status_code=401, content={"error": "Clé ISA invalide."})

    if request.method == "POST":
        length = request.headers.get("content-length")
        if length and int(length) > SETTINGS.max_body_bytes:
            return JSONResponse(status_code=413, content={"error": "Charge trop volumineuse."})

    return await call_next(request)


def _capabilities() -> Dict[str, Any]:
    return {
        "stt": stt.is_available(),
        "tts": tts.piper_available() or tts.mms_available() or tts.espeak_available(),
        "llm": llm.ollama_available() or llm.llamacpp_available(),
        "geo": SETTINGS.geo_enabled,
        "wake_word": SETTINGS.wake_enabled,
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    """État du serveur : ce qui fonctionne réellement sur cette machine."""
    return {
        "service": "ISA — assistant vocal du Niger",
        "version": "1.0.0",
        "status": "ok",
        "uptimeSeconds": round(time.time() - _STARTED_AT, 1),
        "capabilities": _capabilities(),
        # Alias plats, lus directement par le client web (localServer.ts).
        "stt": stt.is_available(),
        "tts": tts.piper_available() or tts.mms_available() or tts.espeak_available(),
        "llm": llm.ollama_available() or llm.llamacpp_available(),
        "models": {
            "stt": stt.model_info() if stt.is_available() else None,
            "tts": tts.capabilities(),
            "llm": llm.capabilities(),
        },
        "languages": {
            "fr": {"tts": "piper", "stt": "whisper"},
            "dje": {"tts": language_to_mms("dje"), "stt": "whisper (auto + lexique)"},
            "ha": {"tts": language_to_mms("ha"), "stt": "whisper"},
        },
        "offline_capable": True,
        "timezone": "Africa/Niamey",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. Reconnaissance vocale
# ─────────────────────────────────────────────────────────────────────────────
async def _read_audio(request: Request) -> tuple[bytes, str, Optional[str]]:
    """Accepte JSON base64, fichier multipart ou corps binaire brut."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        payload = await request.json()
        data = base64_to_bytes(str(payload.get("audioBase64") or ""))
        return data, str(payload.get("mimeType") or "audio/wav"), payload.get("language")

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("audio") or form.get("file")
        language = form.get("language")
        if isinstance(upload, UploadFile):
            data = await upload.read()
            return data, upload.content_type or "audio/wav", str(language) if language else None
        raise HTTPException(status_code=400, detail="Champ audio manquant.")

    data = await request.body()
    return data, content_type or "audio/wav", request.query_params.get("language")


@app.post("/stt")
async def speech_to_text(request: Request) -> Dict[str, Any]:
    """Audio → texte. Whisper local : rien ne quitte le Niger."""
    if not stt.is_available():
        raise HTTPException(
            status_code=503,
            detail=(
                "Reconnaissance vocale non installée sur ce serveur. "
                "Exécutez : pip install faster-whisper (voir voice-ai/README.md)."
            ),
        )

    data, mime, language = await _read_audio(request)
    if not data:
        raise HTTPException(status_code=400, detail="Audio vide.")

    started = time.time()
    try:
        text, detected, confidence, candidates = stt.transcribe(data, language=language, mime_hint=mime)
    except Exception as error:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Transcription impossible : {error}") from error

    return {
        "text": text,
        "language": detected or language or "fr",
        "confidence": round(confidence, 3),
        "languages": candidates,
        "engine": "faster-whisper",
        "model": SETTINGS.stt_model,
        "durationMs": round((time.time() - started) * 1000),
        "offline": True,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthèse vocale
# ─────────────────────────────────────────────────────────────────────────────
def _synthesize_or_fail(text: str, language: str, voice: Optional[str] = None) -> tuple[bytes, str, str]:
    audio, engine, used_voice = tts.synthesize(text, language=language, voice=voice)
    if audio and engine != "none":
        return audio, engine, used_voice

    # Pont de secours : on traduit vers le français (si un modèle local existe)
    # puis on parle avec la voix Piper française.
    if SETTINGS.tts_bridge_fallback and (language or "").split("-")[0] in {"dje", "ha", "zar"}:
        translated = llm.translate(text, "fr")
        if translated:
            audio, engine, used_voice = tts.synthesize(translated, language="fr")
            if audio and engine != "none":
                return audio, f"{engine}+bridge-fr", used_voice

    raise HTTPException(
        status_code=503,
        detail=(
            f"Aucune voix disponible pour « {language} ». Installez une voix : "
            "pip install piper-tts (français) ou pip install torch transformers "
            "(MMS-TTS zarma/haoussa). Voir voice-ai/README.md."
        ),
    )


@app.post("/tts")
async def text_to_speech(request: Request) -> Dict[str, Any]:
    """Texte → audio WAV encodé en base64 (jouable directement par le navigateur)."""
    payload = await request.json()
    text = str(payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Texte manquant.")
    language = str(payload.get("language") or payload.get("lang") or "fr")
    voice = payload.get("voice") or None

    started = time.time()
    audio, engine, used_voice = _synthesize_or_fail(text[: SETTINGS.tts_max_chars], language, voice)
    return {
        "audioBase64": bytes_to_base64(audio),
        "mimeType": "audio/wav",
        "engine": engine,
        "voice": used_voice,
        "language": language,
        "bytes": len(audio),
        "durationMs": round((time.time() - started) * 1000),
        "offline": True,
    }


@app.get("/tts.wav")
def text_to_speech_wav(text: str, lang: str = "fr", voice: Optional[str] = None) -> Response:
    """Raccourci pratique : `<audio src="http://IP:8787/tts.wav?text=Fofo&lang=dje">`."""
    audio, engine, _ = _synthesize_or_fail(text[: SETTINGS.tts_max_chars], lang, voice)
    return Response(content=audio, media_type="audio/wav", headers={"X-ISA-Engine": engine, "Cache-Control": "public, max-age=300"})


# ─────────────────────────────────────────────────────────────────────────────
# 3. Cerveau : règles hors-ligne + modèle local
# ─────────────────────────────────────────────────────────────────────────────
# Lettres africaines crochetées (haoussa ɓ ɗ ƙ ʼ, zarma ŋ ʒ, peul ƴ…) :
# sans ce repli, « Ƙarfe nawa » devenait « arfe nawa » et n'était plus reconnu.
_AFRICAN_FOLD = str.maketrans(
    {
        "ɓ": "b", "ɗ": "d", "ƙ": "k", "ƴ": "y", "ɲ": "n", "ŋ": "n",
        "ɛ": "e", "ɔ": "o", "ə": "e", "ʒ": "j", "č": "c", "š": "s", "ž": "z",
        "ʼ": "'", "ʻ": "'", "’": "'", "‘": "'", "`": "'",
        "ł": "l", "ħ": "h", "ŧ": "t", "ß": "ss",
    }
)


def _normalize(value: str) -> str:
    import unicodedata

    text = str(value or "").lower().translate(_AFRICAN_FOLD)
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9' ]+", " ", text)).strip()


def _niamey_now() -> dt.datetime:
    try:
        from zoneinfo import ZoneInfo

        return dt.datetime.now(ZoneInfo("Africa/Niamey"))
    except Exception:
        return dt.datetime.utcnow() + dt.timedelta(hours=1)


def rule_based_reply(text: str, language: str, context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Noyau de règles côté serveur (miroir réduit du cerveau TypeScript).

    Il couvre les intentions les plus fréquentes pour qu'un kiosque, un
    téléphone ou un script Python obtienne une réponse même sans navigateur ni
    modèle : heure, date, urgences, salutations, lieux, météo, distances.
    """
    normalized = _normalize(text)
    if not normalized:
        return None
    lang = (language or "fr").split("-")[0]
    now = _niamey_now()

    def pick(fr: str, dje: str, ha: str, en: str = "") -> str:
        if lang == "dje":
            return dje or fr
        if lang == "ha":
            return ha or fr
        if lang == "en":
            return en or fr
        return fr

    # Salutations
    greetings = {"fr": ["bonjour", "salut", "bonsoir"], "dje": ["fofo", "mate ni go"], "ha": ["sannu", "yaya kake"], "en": ["hello", "hi"]}
    if any(word in normalized for word in greetings.get(lang, []) + greetings["fr"]):
        return {
            "reply": pick("Bonjour, je suis ISA. Que puis-je faire ?", "Fofo, ay ti ISA. Ay ma tee may?", "Sannu, ni ne ISA. Me kake so?", "Hello, I am ISA. How can I help?"),
            "intent": "greeting",
            "source": "local-rule",
            "offline": True,
        }

    # Heure / date
    if any(word in normalized for word in ["quelle heure", "waati cendi", "karfe nawa", "ƙarfe nawa", "what time"]):
        return {
            "reply": pick(f"Il est {now:%H:%M} à Niamey.", f"Waati ti {now:%H:%M} Niamey ra.", f"Yanzu ƙarfe {now:%H:%M} a Niamey.", f"It is {now:%H:%M} in Niamey."),
            "intent": "time",
            "source": "local-rule",
            "offline": True,
        }
    if any(word in normalized for word in ["quel jour", "la date", "zaari cendi", "wane rana", "what day"]):
        return {
            "reply": pick(f"Nous sommes le {now:%A %d %B %Y}.", f"Hunkuna ti {now:%d/%m/%Y}.", f"Yau ranar {now:%d/%m/%Y} ce.", f"Today is {now:%A %d %B %Y}."),
            "intent": "date",
            "source": "local-rule",
            "offline": True,
        }

    # Urgences
    if any(word in normalized for word in ["urgence", "au secours", "police", "pompier", "ambulance", "gaggawa", "faaba kayantey", "accident"]):
        return {
            "reply": pick(
                "Urgence au Niger : police 17, sapeurs-pompiers 18, assistance médicale 15.",
                "Niger faaba lambayaŋ: polisi 17, danwasu 18, darzanka 15.",
                "Lambobin agaji a Nijar: ‘yan sanda 17, sojojin wuta 18, agajin asibiti 15.",
                "Niger emergencies: police 17, fire 18, medical 15.",
            ),
            "intent": "emergency",
            "source": "local-knowledge",
            "offline": True,
            "cards": [
                {
                    "kind": "contact",
                    "title": f"{knowledge.trilingual(contact['label'], lang)} · {contact['number']}",  # type: ignore[arg-type]
                    "primaryAction": {"type": "call", "phoneNumber": contact["dialable"]},
                }
                for contact in knowledge.EMERGENCY_CONTACTS
            ],
        }

    # Météo (en ligne seulement)
    if any(word in normalized for word in ["météo", "meteo", "yanayi", "handu", "weather", "zafi", "pluie"]):
        city = "Niamey"
        for known_city in knowledge.NIGER_CITIES:
            if _normalize(str(known_city["name"])) in normalized:
                city = str(known_city["name"])
                break
        data = geo.weather(city)
        if data:
            temperature = round(float(data.get("temperatureC") or 0))
            condition = str(data.get("condition") or "")
            return {
                "reply": pick(
                    f"Météo à {city} : {condition.lower()}, {temperature} °C.",
                    f"{city} handu: {condition.lower()}, {temperature}°C.",
                    f"Yanayin {city}: {condition.lower()}, {temperature}°C.",
                    f"Weather in {city}: {condition.lower()}, {temperature}°C.",
                ),
                "intent": "weather",
                "source": "local-knowledge",
                "offline": False,
                "cards": [{"kind": "weather", "title": f"{temperature} °C · {city}", "subtitle": condition}],
            }

    # Lieux connus (hors-ligne) + recherche de proximité (en ligne)
    place = knowledge.find_place(text)
    is_navigation = any(word in normalized for word in ["amene moi", "conduis moi", "kai ni", "take me to", "aller a", "itineraire", "ma ay ne koy", "fondo"])
    is_search = any(word in normalized for word in ["ou est", "ou se trouve", "cherche", "ina", "mar no", "man hare", "where is", "find", "plus proche", "mafi kusa"])

    category = None
    for key, label in [("pharmacy", "pharmacie"), ("hospital", "hôpital"), ("fuel", "essence"), ("market", "marché"), ("bank", "banque"), ("school", "école"), ("mosque", "mosquée"), ("police", "police"), ("hotel", "hôtel"), ("restaurant", "restaurant")]:
        if label in normalized or key in normalized:
            category = key
            break

    position = (context or {}).get("position") or {}
    lat = position.get("lat")
    lon = position.get("lon")

    if category and isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        results = geo.nearby(category, float(lat), float(lon), radius=int(position.get("radius") or 5000), limit=6)
        if results:
            first = results[0]
            return {
                "reply": pick(
                    f"J'ai trouvé {len(results)} lieux. Le plus proche : {first['name']}.",
                    f"Ay du nangu {len(results)}. Kayantey ti {first['name']}.",
                    f"Na sami wurare {len(results)}. Mafi kusa: {first['name']}.",
                    f"Found {len(results)} places. Closest: {first['name']}.",
                ),
                "intent": "find_place",
                "source": "local-knowledge",
                "offline": False,
                "cards": [
                    {
                        "kind": "place",
                        "title": str(first["name"]),
                        "subtitle": str(first.get("displayName") or "Niger"),
                        "primaryAction": {
                            "type": "navigate_to",
                            "destination": f"{first['lat']},{first['lon']}",
                            "mode": "driving",
                            "url": f"https://www.google.com/maps/dir/?api=1&origin={lat},{lon}&destination={first['lat']},{first['lon']}&travelmode=driving",
                        },
                    }
                ]
                + [
                    {"kind": "place", "title": str(item["name"]), "subtitle": str(item.get("displayName") or "Niger")}
                    for item in results[1:4]
                ],
            }

    if place:
        name = str(place["name"])
        place_lat = float(place.get("lat") or 0)  # type: ignore[arg-type]
        place_lon = float(place.get("lon") or 0)  # type: ignore[arg-type]
        origin = f"{lat},{lon}" if isinstance(lat, (int, float)) and isinstance(lon, (int, float)) else ""
        directions = f"https://www.google.com/maps/dir/?api=1&destination={place_lat},{place_lon}&travelmode=driving"
        if origin:
            directions = f"https://www.google.com/maps/dir/?api=1&origin={origin}&destination={place_lat},{place_lon}&travelmode=driving"

        distance_note = ""
        route_data = None
        if origin:
            route_data = geo.route(float(lat), float(lon), place_lat, place_lon)  # type: ignore[arg-type]
            if route_data:
                km = round(float(route_data["distanceMeters"]) / 1000)
                minutes = round(float(route_data["durationSeconds"]) / 60)
                distance_note = pick(f" Distance : {km} km, environ {minutes} minutes.", f" A ga moora km {km}.", f" Nisa: kilomita {km}, kimanin mintuna {minutes}.", f" Distance: {km} km, about {minutes} minutes.")
        elif place.get("distance_km"):
            distance_note = pick(
                f" Depuis Niamey, comptez environ {place['distance_km']} km.",
                f" Niamey ra, a ga moora km {place['distance_km']} ra.",
                f" Daga Niamey, kimanin kilomita {place['distance_km']}.",
                f" From Niamey, about {place['distance_km']} km.",
            )

        if is_navigation:
            reply = pick(f"Je lance la navigation vers {name}.{distance_note}", f"Ay ga fondo tun {name} se.{distance_note}", f"Na fara jagora zuwa {name}.{distance_note}", f"Starting navigation to {name}.{distance_note}")
            intent = "navigate"
        elif is_search:
            reply = pick(f"{name} se trouve ici.{distance_note}", f"{name} ga ne wo.{distance_note}", f"Ga {name} a nan.{distance_note}", f"Here is {name}.{distance_note}")
            intent = "find_place"
        else:
            reply = pick(f"Voici {name} sur la carte.{distance_note}", f"{name} ga kart ra.{distance_note}", f"Ga {name} a taswira.{distance_note}", f"Here is {name} on the map.{distance_note}")
            intent = "find_place"

        return {
            "reply": reply,
            "intent": intent,
            "source": "local-rule",
            "offline": route_data is None,
            "actions": [
                {"type": "navigate_to", "destination": name, "mode": "driving", "url": directions},
                {"type": "open_map", "url": f"https://www.google.com/maps/search/?api=1&query={name.replace(' ', '+')}%2C+Niger", "label": name},
            ],
            "cards": [{"kind": "route" if origin else "place", "title": name, "subtitle": "Niger"}],
        }

    # Faits pays
    fact = knowledge.find_fact(text)
    if fact:
        return {
            "reply": knowledge.trilingual(fact, lang),  # type: ignore[arg-type]
            "intent": "find_place",
            "source": "local-knowledge",
            "offline": True,
        }

    return None


@app.post("/think")
async def think(request: Request) -> Dict[str, Any]:
    """Texte → réponse ISA. Règles locales d'abord, modèle local ensuite."""
    payload = await request.json()
    text = str(payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Texte manquant.")

    language = str(payload.get("language") or "fr")
    context = payload.get("context") or {}
    system_prompt = str(
        payload.get("systemPrompt")
        or (
            "Tu es ISA, l'assistant vocal du Niger créé par Excellence Services SARL à Niamey. "
            "Réponds en phrases courtes destinées à être lues à voix haute, sans formatage Markdown. "
            "Tu parles français, zarma et haoussa. N'invente jamais un numéro, une adresse ou un prix."
        )
    )
    history = payload.get("history") or []

    # 1) Règles déterministes (instantané, hors-ligne)
    rule_reply = rule_based_reply(text, language, context)
    if rule_reply:
        rule_reply.setdefault("language", language)
        rule_reply.setdefault("slots", {})
        rule_reply.setdefault("actions", [])
        rule_reply.setdefault("cards", [])
        rule_reply.setdefault("suggestions", [])
        rule_reply["speak"] = rule_reply.get("reply")
        return rule_reply

    # 2) Modèle local (Ollama / llama.cpp)
    result = llm.generate(text, system_prompt, history)
    if result:
        reply = str(result.get("reply") or "").strip()
        return {
            "reply": reply,
            "speak": reply,
            "language": language,
            "intent": "unknown",
            "slots": {"query": text},
            "actions": [],
            "cards": [],
            "suggestions": [],
            "source": "local-llm",
            "offline": True,
            "engine": result.get("engine"),
            "modelUsed": result.get("model"),
        }

    # 3) Aucun moteur : on explique quoi faire, dans la langue demandée
    lang = language.split("-")[0]
    fallback = {
        "fr": "Je n'ai pas compris. Essayez « Conduis-moi au Grand Marché », « Quelle heure est-il ? » ou « Appelle le 17 ».",
        "dje": "Ay si faham. Ma ne: « Ma ay ne koy Grand Marché », « Waati cendi? » wala « Polisi telefon 17 ».",
        "ha": "Ban gane ba. Gwada: « Kai ni Babbar Kasuwa », « Ƙarfe nawa yanzu? » ko « Kira 17 ».",
        "en": "I did not understand. Try “Take me to the Grand Marché”, “What time is it?” or “Call 17”.",
    }.get(lang, "Je n'ai pas compris. Reformulez, s'il vous plaît.")

    return {
        "reply": fallback,
        "speak": fallback,
        "language": language,
        "intent": "unknown",
        "slots": {"query": text},
        "actions": [],
        "cards": [],
        "suggestions": [],
        "source": "fallback",
        "offline": True,
        "hint": "Installez Ollama (voir voice-ai/README.md) pour les questions ouvertes.",
    }


@app.post("/translate")
async def translate(request: Request) -> Dict[str, Any]:
    """Traduction français ↔ zarma ↔ haoussa (modèle local requis)."""
    payload = await request.json()
    text = str(payload.get("text") or "").strip()
    target = str(payload.get("target") or "fr")
    source = str(payload.get("source") or "auto")
    if not text:
        raise HTTPException(status_code=400, detail="Texte manquant.")

    translation = llm.translate(text, target, source)
    if not translation:
        raise HTTPException(
            status_code=503,
            detail="Traduction indisponible : aucun modèle local installé (Ollama).",
        )
    return {"translation": translation, "target": target, "source": source, "engine": "ollama", "offline": True}


# ─────────────────────────────────────────────────────────────────────────────
# 4. Géographie (OpenStreetMap / OSRM / Open-Meteo — gratuits, sans clé)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/geo/search")
def geo_search(q: str, lat: Optional[float] = None, lon: Optional[float] = None, limit: int = 5) -> Dict[str, Any]:
    results = geo.search(q, lat=lat, lon=lon, limit=limit)
    return {"query": q, "results": results, "source": "nominatim/osm"}


@app.get("/geo/nearby")
def geo_nearby(category: str, lat: Optional[float] = None, lon: Optional[float] = None, radius: int = 4000, limit: int = 6) -> Dict[str, Any]:
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="lat et lon sont obligatoires pour la recherche de proximité.")
    results = geo.nearby(category, lat, lon, radius=radius, limit=limit)
    return {"category": category, "results": results, "source": "overpass/osm"}


@app.get("/geo/route")
def geo_route(
    origin: Optional[str] = None,
    from_: Optional[str] = None,
    to: Optional[str] = None,
    mode: str = "driving",
    request: Request = None,
) -> Dict[str, Any]:
    source = from_ or (request.query_params.get("from") if request else None) or origin
    if not source or not to:
        raise HTTPException(status_code=400, detail="Paramètres from=lat,lon et to=lat,lon obligatoires.")
    try:
        from_lat, from_lon = [float(part) for part in str(source).split(",")]
        to_lat, to_lon = [float(part) for part in str(to).split(",")]
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Format attendu : lat,lon") from error

    result = geo.route(from_lat, from_lon, to_lat, to_lon, mode)
    if not result:
        raise HTTPException(status_code=502, detail="Itinéraire indisponible pour le moment.")
    return result


@app.get("/geo/weather")
def geo_weather(city: str = "Niamey") -> Dict[str, Any]:
    result = geo.weather(city)
    if not result:
        raise HTTPException(status_code=502, detail="Météo indisponible pour le moment.")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 5. Passerelles SMS / WhatsApp (phase 2, désactivées par défaut)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/gateway/sms")
async def gateway_sms(request: Request) -> Dict[str, Any]:
    """
    Envoie un SMS via une passerelle locale (modem GSM, Android ADB, API opérateur).

    Aucun fournisseur n'est imposé : définissez `ISA_SMS_URL` (et `ISA_SMS_TOKEN`
    si nécessaire). Sans configuration, l'API répond 501 et l'assistant continue
    d'ouvrir l'app SMS du téléphone via `sms:` — ce qui fonctionne déjà partout.
    """
    if not SETTINGS.gateway_sms_url:
        raise HTTPException(
            status_code=501,
            detail="Passerelle SMS non configurée (ISA_SMS_URL). L'assistant ouvre l'app SMS du téléphone à la place.",
        )
    payload = await request.json()
    to = str(payload.get("to") or "")
    body = str(payload.get("body") or "")
    if not to or not body:
        raise HTTPException(status_code=400, detail="Champs to et body obligatoires.")

    import urllib.parse
    import urllib.request

    request_obj = urllib.request.Request(
        SETTINGS.gateway_sms_url,
        data=json.dumps({"to": to, "body": body}).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {SETTINGS.gateway_sms_token}"} if SETTINGS.gateway_sms_token else {}),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=20) as response:  # noqa: S310
            return {"status": "sent", "to": to, "response": response.status}
    except Exception as error:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Passerelle SMS en échec : {error}") from error


@app.post("/gateway/whatsapp")
async def gateway_whatsapp(request: Request) -> Dict[str, Any]:
    """Webhook WhatsApp Business (Meta) ou bridge local type Baileys/whatsmeow."""
    payload = await request.json()
    to = str(payload.get("to") or "").replace("+", "")
    body = str(payload.get("body") or "")
    link = f"https://wa.me/{to}{'?text=' + __import__('urllib.parse', fromlist=['quote']).quote(body) if body else ''}"

    if not SETTINGS.whatsapp_webhook:
        return {"status": "link", "url": link, "hint": "Définissez ISA_WHATSAPP_WEBHOOK pour un envoi automatique."}

    import urllib.request

    request_obj = urllib.request.Request(
        SETTINGS.whatsapp_webhook,
        data=json.dumps({"to": to, "body": body}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=20) as response:  # noqa: S310
            return {"status": "sent", "response": response.status, "url": link}
    except Exception as error:  # pragma: no cover
        return {"status": "link", "url": link, "error": str(error)}


# ─────────────────────────────────────────────────────────────────────────────
# 6. Page d'état (lisible depuis un téléphone du même réseau)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def status_page() -> str:
    caps = _capabilities()
    rows = "".join(
        f"<tr><td>{label}</td><td class='{'ok' if value else 'ko'}'>{'oui' if value else 'non'}</td></tr>"
        for label, value in [
            ("Reconnaissance vocale (Whisper)", caps["stt"]),
            ("Voix zarma / haoussa (MMS-TTS / Piper)", caps["tts"]),
            ("Modèle de langage (Ollama)", caps["llm"]),
            ("Cartes & météo (OSM/Open-Meteo)", caps["geo"]),
        ]
    )
    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ISA — serveur vocal local</title>
<style>
  body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#030F26;color:#fff;margin:0;padding:24px}}
  .card{{max-width:640px;margin:0 auto;background:#0A1F4B;border:1px solid #183B7A;border-radius:20px;padding:24px}}
  h1{{font-size:22px;margin:0 0 4px}} p.sub{{color:#D4AF37;margin:0 0 20px;font-size:13px;letter-spacing:.08em;text-transform:uppercase}}
  table{{width:100%;border-collapse:collapse;font-size:14px}} td{{padding:10px 6px;border-bottom:1px solid #132C5E}}
  .ok{{color:#4ade80;font-weight:700;text-align:right}} .ko{{color:#fbbf24;font-weight:700;text-align:right}}
  code{{background:#030F26;padding:2px 6px;border-radius:6px;font-size:12px}}
  .foot{{margin-top:18px;font-size:12px;color:#94a3b8}}
</style></head>
<body><div class="card">
  <h1>ISA — serveur vocal local</h1>
  <p class="sub">Assistant vocal du Niger · Niamey</p>
  <table>{rows}</table>
  <p class="foot">
    Endpoints : <code>/health</code> <code>/stt</code> <code>/tts</code> <code>/think</code>
    <code>/translate</code> <code>/geo/search</code> <code>/geo/nearby</code> <code>/geo/route</code> <code>/geo/weather</code><br>
    Documentation interactive : <code>/docs</code> · Uptime : {round(time.time() - _STARTED_AT)} s
  </p>
</div></body></html>"""


@app.get("/api/health")
def api_health_alias() -> Dict[str, Any]:
    """Alias pratique : le site web sonde aussi `/api/health`."""
    return health()


def run() -> None:
    """`python -m app.main` → démarre le serveur."""
    import uvicorn

    uvicorn.run(app, host=SETTINGS.host, port=SETTINGS.port, log_level=SETTINGS.log_level.lower())


if __name__ == "__main__":  # pragma: no cover
    run()
