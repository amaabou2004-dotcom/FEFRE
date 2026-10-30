"""
ISA — Reconnaissance vocale locale (faster-whisper)
===================================================
Whisper est le seul moteur gratuit qui transcrive correctement le haoussa. Le
zarma n'est pas dans sa liste de langues : on le traite en détection automatique
puis on corrige l'orthographe avec un lexique (`lexiques/zarma-fr.csv`), ce qui
donne un résultat exploitable pour la détection d'intention.

Toutes les dépendances sont optionnelles : si `faster-whisper` n'est pas
installé, le module signale simplement `available = False` et `/health`
l'annonce, sans faire tomber le serveur.
"""

from __future__ import annotations

import csv
import re
import threading
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from .config import SETTINGS, language_to_whisper

_MODEL = None
_LOCK = threading.Lock()
_LEXICON: Dict[str, str] = {}


def _load_lexicon() -> Dict[str, str]:
    """
    Charge les corrections orthographiques zarma/haoussa.

    Le fichier `lexiques/zarma-fr.csv` contient deux colonnes :
        variante_transcrite,forme_correcte
    Exemple : « zar ma, zarma » ou « djer ma, djerma ».
    Whisper écrit souvent les langues non couvertes phonétiquement, en coupant
    les mots : ce lexique répare ces coupures avant la détection d'intention.
    """
    global _LEXICON
    if _LEXICON:
        return _LEXICON

    base = Path(__file__).resolve().parent.parent / "lexiques"
    loaded: Dict[str, str] = {}
    for filename in ("zarma-fr.csv", "hausa-fr.csv", "corrections.csv"):
        path = base / filename
        if not path.exists():
            continue
        try:
            with path.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.reader(handle)
                for row in reader:
                    if not row or row[0].startswith("#") or len(row) < 2:
                        continue
                    source = row[0].strip().lower()
                    target = row[1].strip()
                    if source and target and source != target:
                        loaded[source] = target
        except OSError:
            continue
    _LEXICON = loaded
    return _LEXICON


def apply_lexicon(text: str) -> str:
    """Applique les corrections du lexique, mot à mot puis sur les bigrammes."""
    if not text:
        return text
    lexicon = _load_lexicon()
    if not lexicon:
        return text

    lowered = text.lower()
    # Bigrammes d'abord (« zar ma » → « zarma »), puis mots isolés.
    for source, target in sorted(lexicon.items(), key=lambda item: -len(item[0])):
        if " " in source:
            lowered = re.sub(rf"\b{re.escape(source)}\b", target, lowered)
    words = lowered.split()
    fixed = [lexicon.get(word, word) for word in words]
    return " ".join(fixed)


def is_available() -> bool:
    try:
        import faster_whisper  # noqa: F401

        return True
    except ImportError:
        return False


def model_info() -> Dict[str, str]:
    return {
        "engine": "faster-whisper",
        "model": SETTINGS.stt_model,
        "device": SETTINGS.stt_device,
        "compute_type": SETTINGS.stt_compute_type,
        "loaded": "yes" if _MODEL is not None else "no",
    }


def _ensure_model():
    """Charge le modèle une seule fois (thread-safe, paresseux)."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    if not is_available():
        raise RuntimeError("faster-whisper n'est pas installé. Voir voice-ai/README.md (installation).")

    with _LOCK:
        if _MODEL is not None:
            return _MODEL
        from faster_whisper import WhisperModel

        device = SETTINGS.stt_device
        compute_type = SETTINGS.stt_compute_type
        if device == "auto":
            try:
                import torch

                device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                device = "cpu"
            if device == "cpu":
                compute_type = "int8"

        _MODEL = WhisperModel(
            SETTINGS.stt_model,
            device=device,
            compute_type=compute_type,
            download_root=str(SETTINGS.models_dir / "whisper"),
        )
    return _MODEL


def transcribe(
    audio_bytes: bytes,
    language: Optional[str] = None,
    mime_hint: str = "",
) -> Tuple[str, Optional[str], float, List[Dict[str, object]]]:
    """
    Transcrit un audio et retourne (texte, langue détectée, confiance, langues candidates).

    Le texte passe par `apply_lexicon` pour réparer l'orthographe zarma/haoussa.
    """
    from .audio import any_audio_to_wav16k, wav_to_float32

    wav_bytes = any_audio_to_wav16k(audio_bytes, mime_hint)
    samples = wav_to_float32(wav_bytes)

    model = _ensure_model()
    whisper_lang = language_to_whisper(language)

    segments, info = model.transcribe(
        samples,
        language=whisper_lang,
        beam_size=SETTINGS.stt_beam_size,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 320},
        task="transcribe",
    )

    pieces: List[str] = []
    for segment in segments:
        text = (segment.text or "").strip()
        if text:
            pieces.append(text)

    raw_text = " ".join(pieces).strip()
    text = apply_lexicon(raw_text)

    detected = getattr(info, "language", None) or whisper_lang
    confidence = float(getattr(info, "language_probability", 0.0) or 0.0)

    candidates: List[Dict[str, object]] = []
    all_probs = getattr(info, "all_language_probs", None)
    if all_probs:
        for code, probability in list(all_probs)[:4]:
            candidates.append({"code": str(code), "score": round(float(probability), 3)})

    if not text:
        return "", detected, confidence, candidates

    # Zarma : Whisper renvoie souvent « fr » ou « ha » pour une phrase zarma.
    # On laisse le cerveau côté client trancher (il a le lexique complet).
    return text, detected, confidence, candidates
