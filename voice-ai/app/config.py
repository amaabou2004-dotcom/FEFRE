"""
ISA — Configuration du serveur vocal local (Niamey)
==================================================
Tout se règle par variables d'environnement (fichier `.env` à la racine de
`voice-ai/`). Aucune variable n'est obligatoire : le serveur démarre toujours,
même sans modèle téléchargé, et annonce ses capacités réelles sur `/health`.

Ordre de priorité pour chaque brique :
  • STT  : faster-whisper (local) → vosk → aucun
  • TTS  : Piper (fr/en) + MMS-TTS (zarma/haoussa) → espeak-ng → aucun
  • LLM  : Ollama → llama.cpp (serveur HTTP) → règles hors-ligne

Le serveur écoute par défaut sur 0.0.0.0:8787 pour être joignable depuis les
téléphones du même réseau (bureau, kiosque, cybercafé).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List


def _load_dotenv(path: Path) -> None:
    """Charge un fichier `.env` minimaliste, sans dépendance externe."""
    if not path.exists():
        return
    try:
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    except OSError:
        pass


BASE_DIR = Path(__file__).resolve().parent.parent
_load_dotenv(BASE_DIR / ".env")


def _bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "oui", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _list(name: str, default: List[str]) -> List[str]:
    raw = os.getenv(name)
    if not raw:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass
class Settings:
    """Réglages du serveur ISA."""

    host: str = os.getenv("ISA_HOST", "0.0.0.0")
    port: int = _int("ISA_PORT", 8787)

    # Origines autorisées pour les appels depuis le site web (CORS).
    # « * » par défaut : le serveur est prévu pour un réseau local de confiance.
    cors_origins: List[str] = field(default_factory=lambda: _list("ISA_CORS_ORIGINS", ["*"]))

    # ── Reconnaissance vocale ───────────────────────────────────────────────
    stt_model: str = os.getenv("ISA_STT_MODEL", "small")
    stt_device: str = os.getenv("ISA_STT_DEVICE", "auto")  # auto | cpu | cuda
    stt_compute_type: str = os.getenv("ISA_STT_COMPUTE", "int8")
    stt_beam_size: int = _int("ISA_STT_BEAM", 5)
    stt_max_seconds: int = _int("ISA_STT_MAX_SECONDS", 60)
    stt_languages: List[str] = field(default_factory=lambda: _list("ISA_STT_LANGUAGES", ["fr", "ha", "dje", "en"]))

    # ── Synthèse vocale ─────────────────────────────────────────────────────
    tts_piper_voice_fr: str = os.getenv("ISA_TTS_FR", "fr_FR-siwis-medium")
    tts_piper_voice_en: str = os.getenv("ISA_TTS_EN", "en_US-lessac-medium")
    tts_piper_dir: Path = Path(os.getenv("ISA_TTS_PIPER_DIR", str(BASE_DIR / "models" / "piper")))
    tts_mms_models: Dict[str, str] = field(
        default_factory=lambda: {
            # Modèles Meta MMS-TTS : les seules voix zarma/haoussa disponibles.
            "dje": os.getenv("ISA_TTS_DJE", "facebook/mms-tts-dje"),
            "ha": os.getenv("ISA_TTS_HAU", "facebook/mms-tts-hau"),
            "fr": os.getenv("ISA_TTS_FRA", "facebook/mms-tts-fra"),
        }
    )
    tts_sample_rate: int = _int("ISA_TTS_RATE", 22050)
    tts_max_chars: int = _int("ISA_TTS_MAX_CHARS", 1200)
    # Si une voix locale manque (ex. zarma non téléchargé), on peut lire la
    # traduction française avec la voix Piper plutôt que rester muet.
    tts_bridge_fallback: bool = _bool("ISA_TTS_BRIDGE", True)

    # ── Modèle de langage ───────────────────────────────────────────────────
    ollama_url: str = os.getenv("ISA_OLLAMA_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("ISA_OLLAMA_MODEL", "llama3.2:3b")
    llamacpp_url: str = os.getenv("ISA_LLAMACPP_URL", "")
    llm_timeout: int = _int("ISA_LLM_TIMEOUT", 45)
    llm_max_tokens: int = _int("ISA_LLM_MAX_TOKENS", 320)
    llm_temperature: float = float(os.getenv("ISA_LLM_TEMPERATURE", "0.3"))

    # ── Géographie (services gratuits, sans clé) ────────────────────────────
    geo_enabled: bool = _bool("ISA_GEO", True)
    nominatim_url: str = os.getenv("ISA_NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    overpass_urls: List[str] = field(
        default_factory=lambda: _list(
            "ISA_OVERPASS_URLS",
            ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"],
        )
    )
    osrm_url: str = os.getenv("ISA_OSRM_URL", "https://router.project-osrm.org")
    open_meteo_url: str = os.getenv("ISA_OPEN_METEO_URL", "https://api.open-meteo.com/v1/forecast")
    open_meteo_geocode: str = os.getenv("ISA_OPEN_METEO_GEOCODE", "https://geocoding-api.open-meteo.com/v1/search")
    geo_user_agent: str = os.getenv(
        "ISA_GEO_UA",
        "ISA-Niger-VoiceAssistant/1.0 (excellence-services-sarl.com)",
    )
    geo_cache_seconds: int = _int("ISA_GEO_CACHE", 600)

    # ── Passerelles SMS / WhatsApp (phase 2, optionnel) ─────────────────────
    gateway_sms_url: str = os.getenv("ISA_SMS_URL", "")  # ex. passerelle GSM locale
    gateway_sms_token: str = os.getenv("ISA_SMS_TOKEN", "")
    whatsapp_webhook: str = os.getenv("ISA_WHATSAPP_WEBHOOK", "")

    # ── Mot de réveil ───────────────────────────────────────────────────────
    wake_words: List[str] = field(default_factory=lambda: _list("ISA_WAKE_WORDS", ["isa", "issa", "yisa", "isa isa", "ok isa"]))
    wake_listen_seconds: float = float(os.getenv("ISA_WAKE_LISTEN_SECONDS", "2.5"))
    wake_enabled: bool = _bool("ISA_WAKE", False)

    # ── Sécurité basique ────────────────────────────────────────────────────
    # Si défini, chaque requête doit porter l'en-tête `X-ISA-Key`.
    api_key: str = os.getenv("ISA_API_KEY", "")
    max_body_bytes: int = _int("ISA_MAX_BODY_BYTES", 12_000_000)
    log_level: str = os.getenv("ISA_LOG_LEVEL", "INFO")

    models_dir: Path = Path(os.getenv("ISA_MODELS_DIR", str(BASE_DIR / "models")))


SETTINGS = Settings()


def language_to_whisper(language: str | None) -> str | None:
    """
    Convertit un code ISA en code Whisper.

    Whisper connaît le haoussa (« ha ») mais pas le zarma : pour le zarma on
    laisse Whisper en détection automatique, ce qui donne une transcription
    phonétique exploitable (meilleure que rien, et améliorée par le lexique).
    """
    code = (language or "").lower().split("-")[0]
    mapping = {
        "fr": "fr",
        "en": "en",
        "ha": "ha",
        "hau": "ha",
        "dje": None,  # zarma : détection automatique
        "zar": None,
    }
    if code in mapping:
        return mapping[code]
    return code or None


def language_to_mms(language: str | None) -> str | None:
    """Code ISA → identifiant de modèle MMS-TTS."""
    code = (language or "").lower().split("-")[0]
    aliases = {"dje": "dje", "zar": "dje", "zarma": "dje", "ha": "ha", "hau": "ha", "hausa": "ha", "fr": "fr", "fra": "fr"}
    resolved = aliases.get(code, code)
    return SETTINGS.tts_mms_models.get(resolved)
