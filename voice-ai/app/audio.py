"""
ISA — Utilitaires audio (WAV, ré-échantillonnage, base64)
=========================================================
Pas de dépendance lourde : `wave` + `array` de la bibliothèque standard, et
`numpy` quand il est disponible (faster-whisper l'installe de toute façon).
"""

from __future__ import annotations

import base64
import io
import wave
from typing import Tuple

TARGET_RATE = 16000


def base64_to_bytes(value: str) -> bytes:
    """Décode du base64 tolérant (préfixe data: accepté)."""
    text = (value or "").strip()
    if not text:
        return b""
    if "," in text and text.lower().startswith("data:"):
        text = text.split(",", 1)[1]
    return base64.b64decode(text + "=" * (-len(text) % 4))


def bytes_to_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def read_wav(data: bytes) -> Tuple[bytes, int, int, int]:
    """Retourne (échantillons bruts, fréquence, canaux, largeur en octets)."""
    with wave.open(io.BytesIO(data), "rb") as handle:
        params = handle.getparams()
        frames = handle.readframes(params.nframes)
    return frames, params.framerate, params.nchannels, params.sampwidth


def wav_to_float32(data: bytes) -> "object":
    """
    Convertit un WAV (16 bits, mono ou stéréo) en tableau float32 mono.
    Retourne un `numpy.ndarray` si numpy est présent, sinon une liste Python.
    """
    frames, rate, channels, width = read_wav(data)

    try:
        import numpy as np
    except ImportError:  # pragma: no cover - numpy est quasi toujours présent
        if width != 2:
            raise ValueError("Seuls les WAV 16 bits sont pris en charge sans numpy.")
        import array

        pcm = array.array("h")
        pcm.frombytes(frames)
        if channels == 2:
            pcm = array.array("h", [pcm[i] for i in range(0, len(pcm), 2)])
        return [sample / 32768.0 for sample in pcm], rate

    import numpy as np

    if width == 2:
        pcm = np.frombuffer(frames, dtype=np.int16)
    elif width == 4:
        pcm = np.frombuffer(frames, dtype=np.int32) // 65536
    else:
        raise ValueError(f"Largeur d'échantillon non gérée : {width * 8} bits")

    audio = pcm.astype(np.float32) / 32768.0
    if channels == 2:
        audio = audio.reshape(-1, 2).mean(axis=1)
    if rate != TARGET_RATE:
        audio = resample(audio, rate, TARGET_RATE)
    return audio


def resample(samples, source_rate: int, target_rate: int):
    """Ré-échantillonnage linéaire simple, suffisant pour la voix."""
    try:
        import numpy as np
    except ImportError:  # pragma: no cover
        ratio = source_rate / target_rate
        out_len = int(len(samples) / ratio)
        return [samples[int(i * ratio)] for i in range(out_len)]

    import numpy as np

    data = np.asarray(samples, dtype=np.float32)
    if source_rate == target_rate or data.size == 0:
        return data
    ratio = source_rate / target_rate
    out_len = int(data.size / ratio)
    if out_len <= 0:
        return data
    positions = np.arange(out_len) * ratio
    left = positions.astype(np.int32)
    right = np.minimum(left + 1, data.size - 1)
    weights = positions - left
    return data[left] * (1 - weights) + data[right] * weights


def float32_to_wav(samples, sample_rate: int = TARGET_RATE, channels: int = 1) -> bytes:
    """Encode un signal float32 (−1..1) en WAV 16 bits."""
    try:
        import numpy as np

        data = np.asarray(samples, dtype=np.float32)
        data = np.clip(data, -1.0, 1.0)
        pcm = (data * 32767.0).astype("<i2").tobytes()
    except ImportError:  # pragma: no cover
        import array

        pcm_array = array.array("h", [int(max(-1.0, min(1.0, s)) * 32767) for s in samples])
        pcm = pcm_array.tobytes()

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as handle:
        handle.setnchannels(channels)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm)
    return buffer.getvalue()


def any_audio_to_wav16k(data: bytes, mime_hint: str = "") -> bytes:
    """
    Normalise n'importe quel audio reçu en WAV 16 kHz mono.

    Formats acceptés : WAV directement ; webm/ogg/mp4/mp3 via ffmpeg si présent
    (le navigateur Chrome enregistre en webm/opus). En l'absence de ffmpeg, les
    WAV passent quand même — c'est le format produit par le client ISA.
    """
    lowered = (mime_hint or "").lower()
    if "wav" in lowered or data[:4] == b"RIFF":
        try:
            samples = wav_to_float32(data)
            return float32_to_wav16k(samples, TARGET_RATE)
        except Exception:
            return data

    # Conversion ffmpeg (webm/opus, mp4/aac, mp3, ogg…)
    import shutil
    import subprocess
    import tempfile

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise ValueError(
            "Format audio non reconnu et ffmpeg absent. Installez ffmpeg "
            "(apt install ffmpeg) ou envoyez du WAV depuis le client ISA."
        )

    with tempfile.NamedTemporaryFile(suffix=".input", delete=False) as source:
        source.write(data)
        source_path = source.name

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as target:
        target_path = target.name

    try:
        subprocess.run(
            [ffmpeg, "-y", "-loglevel", "error", "-i", source_path, "-ac", "1", "-ar", str(TARGET_RATE), "-f", "wav", target_path],
            check=True,
            timeout=60,
        )
        with open(target_path, "rb") as handle:
            return handle.read()
    finally:
        for path in (source_path, target_path):
            try:
                import os

                os.unlink(path)
            except OSError:
                pass


def rms_level(data: bytes) -> float:
    """Niveau sonore moyen (0 → 1), pour la détection de silence."""
    try:
        import numpy as np

        samples = wav_to_float32(data)
        audio = np.asarray(samples, dtype=np.float32)
        if audio.size == 0:
            return 0.0
        return float(min(1.0, np.sqrt(np.mean(audio**2)) * 4))
    except Exception:
        return 0.0
