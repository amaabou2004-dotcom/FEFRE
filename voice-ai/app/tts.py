"""
ISA — Synthèse vocale locale
============================
Trois moteurs, du plus naturel au plus rustique :

  1. **Piper** (`piper-tts`) : voix neuronales françaises/anglaises de très
     bonne qualité, rapides sur CPU. Idéal pour le français à Niamey.
  2. **MMS-TTS** (Meta, via `transformers` + `torch`) : les seules voix
     open-source pour le **haoussa** (`facebook/mms-tts-hau`) et le **zarma**
     (`facebook/mms-tts-dje`). Plus lourd (torch), mais indispensable pour
     parler les langues nationales.
  3. **espeak-ng** : repli système, qualité robotique, mais fonctionne partout
     et ne télécharge rien.

Si une voix manque (modèle non téléchargé), on peut prononcer la traduction
française avec Piper (`ISA_TTS_BRIDGE=1`) plutôt que rester muet.
"""

from __future__ import annotations

import shutil
import subprocess
import threading
from pathlib import Path
from typing import Dict, Optional, Tuple

from .audio import float32_to_wav
from .config import SETTINGS, language_to_mms

_PIPER_CACHE: Dict[str, object] = {}
_MMS_CACHE: Dict[str, object] = {}
_LOCK = threading.Lock()


def piper_available() -> bool:
    try:
        import piper  # noqa: F401

        return True
    except ImportError:
        return shutil.which("piper") is not None


def mms_available() -> bool:
    try:
        import torch  # noqa: F401
        import transformers  # noqa: F401

        return True
    except ImportError:
        return False


def espeak_available() -> bool:
    return shutil.which("espeak-ng") is not None or shutil.which("espeak") is not None


def capabilities() -> Dict[str, object]:
    return {
        "piper": piper_available(),
        "mms": mms_available(),
        "espeak": espeak_available(),
        "voices": {
            "fr": SETTINGS.tts_piper_voice_fr,
            "en": SETTINGS.tts_piper_voice_en,
            "dje": SETTINGS.tts_mms_models.get("dje"),
            "ha": SETTINGS.tts_mms_models.get("ha"),
        },
        "bridge_fallback": SETTINGS.tts_bridge_fallback,
    }


def _piper_voice_files(voice: str) -> Tuple[Optional[Path], Optional[Path]]:
    """Localise les fichiers `.onnx` / `.onnx.json` d'une voix Piper."""
    directory = SETTINGS.tts_piper_dir
    directory.mkdir(parents=True, exist_ok=True)
    onnx = directory / f"{voice}.onnx"
    config = directory / f"{voice}.onnx.json"
    return (onnx if onnx.exists() else None), (config if config.exists() else None)


def synthesize_piper(text: str, voice: str) -> Optional[bytes]:
    """Synthèse Piper (API Python ou binaire). Retourne du WAV 16 bits."""
    if not piper_available():
        return None

    onnx, config = _piper_voice_files(voice)

    # 1) API Python
    try:
        import wave

        from piper import PiperVoice

        key = str(onnx or voice)
        with _LOCK:
            model = _PIPER_CACHE.get(key)
            if model is None:
                model = PiperVoice.load(str(onnx), config_path=str(config) if config else None) if onnx else PiperVoice.load(voice)
                _PIPER_CACHE[key] = model

        import io

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as handle:
            model.synthesize_wav(text, handle)  # type: ignore[attr-defined]
        return buffer.getvalue()
    except Exception:
        pass

    # 2) Binaire `piper`
    binary = shutil.which("piper")
    if binary and onnx:
        try:
            command = [binary, "--model", str(onnx), "--output-raw"]
            if config:
                command += ["--config", str(config)]
            process = subprocess.run(
                command,
                input=text.encode("utf-8"),
                capture_output=True,
                timeout=60,
                check=False,
            )
            if process.returncode == 0 and process.stdout:
                import numpy as np

                pcm = np.frombuffer(process.stdout, dtype=np.int16)
                return float32_to_wav(pcm.astype(np.float32) / 32768.0, 22050)
        except Exception:
            pass
    return None


def synthesize_mms(text: str, model_id: str) -> Optional[bytes]:
    """
    Synthèse MMS-TTS (zarma, haoussa, français…).

    Le modèle est téléchargé au premier appel puis mis en cache dans
    `models/huggingface` — ensuite tout fonctionne hors-ligne.
    """
    if not mms_available() or not model_id:
        return None

    try:
        import torch
        from transformers import AutoTokenizer, VitsModel

        with _LOCK:
            entry = _MMS_CACHE.get(model_id)
            if entry is None:
                cache_dir = SETTINGS.models_dir / "huggingface"
                cache_dir.mkdir(parents=True, exist_ok=True)
                model = VitsModel.from_pretrained(model_id, cache_dir=str(cache_dir))
                tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir=str(cache_dir))
                model.eval()
                entry = (model, tokenizer)
                _MMS_CACHE[model_id] = entry

        model, tokenizer = entry  # type: ignore[misc]
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=SETTINGS.tts_max_chars)
        with torch.no_grad():
            waveform = model(**inputs).waveform  # shape (1, N)
        samples = waveform.squeeze().cpu().numpy().astype("float32")
        sample_rate = int(getattr(model.config, "sampling_rate", 16000) or 16000)
        return float32_to_wav(samples, sample_rate)
    except Exception as error:  # pragma: no cover - dépend du téléchargement
        print(f"[ISA tts] MMS {model_id} indisponible : {error}")
        return None


def synthesize_espeak(text: str, language: str) -> Optional[bytes]:
    """Repli espeak-ng (qualité robotique, zéro téléchargement)."""
    binary = shutil.which("espeak-ng") or shutil.which("espeak")
    if not binary:
        return None
    voice_map = {"fr": "fr", "en": "en", "ha": "ha", "dje": "fr"}
    voice = voice_map.get((language or "fr").split("-")[0], "fr")
    try:
        process = subprocess.run(
            [binary, "-v", voice, "-s", "155", "-w", "-", text],
            capture_output=True,
            timeout=30,
            check=False,
        )
        if process.returncode == 0 and process.stdout[:4] == b"RIFF":
            return process.stdout
    except Exception:
        pass
    return None


def synthesize(text: str, language: str = "fr", voice: Optional[str] = None) -> Tuple[Optional[bytes], str, str]:
    """
    Point d'entrée unique : retourne (audio_wav, moteur, voix).

    Stratégie par langue :
      • zarma / haoussa → MMS-TTS (seule option réaliste) → espeak-ng ;
      • français / anglais → Piper → MMS-TTS → espeak-ng.
    """
    clean_text = (text or "").strip()[: SETTINGS.tts_max_chars]
    if not clean_text:
        return None, "none", ""

    code = (language or "fr").lower().split("-")[0]
    if code in {"ha", "hau"}:
        code = "ha"
    if code in {"dje", "zar", "zarma"}:
        code = "dje"

    if code in {"dje", "ha"}:
        model_id = voice or language_to_mms(code)
        audio = synthesize_mms(clean_text, model_id) if model_id else None
        if audio:
            return audio, "mms-tts", model_id or ""
        fallback = synthesize_espeak(clean_text, code)
        if fallback:
            return fallback, "espeak-ng", code
        return None, "none", ""

    piper_voice = voice or (SETTINGS.tts_piper_voice_en if code == "en" else SETTINGS.tts_piper_voice_fr)
    audio = synthesize_piper(clean_text, piper_voice)
    if audio:
        return audio, "piper", piper_voice

    mms_id = language_to_mms(code)
    if mms_id:
        audio = synthesize_mms(clean_text, mms_id)
        if audio:
            return audio, "mms-tts", mms_id

    fallback = synthesize_espeak(clean_text, code)
    if fallback:
        return fallback, "espeak-ng", code

    return None, "none", ""
