#!/usr/bin/env python3
"""
ISA — Veille « mains libres » (mot de réveil) côté serveur
==========================================================
Les navigateurs ne transcrivent ni le zarma ni (fiablement) le haoussa : la
veille vocale « Isa ! » ne peut donc pas reposer sur le Web Speech API pour ces
langues. Ce petit démon comble ce manque : il écoute le microphone du poste de
Niamey, détecte le mot de réveil avec Whisper, puis envoie la suite de la phrase
au cerveau ISA et fait parler la réponse.

Usage (poste dédié, kiosque, bureau) :
    pip install sounddevice webrtcvad-wheels
    python scripts/wake_word_daemon.py --lang dje
    python scripts/wake_word_daemon.py --lang ha --speak
    python scripts/wake_word_daemon.py --list-devices

Fonctionnement :
    1. détection de voix (VAD) pour ne pas faire tourner Whisper en continu ;
    2. dès qu'une voix est détectée, 2,5 s d'audio sont transcrites ;
    3. si un mot de réveil est présent → la phrase suivante est capturée,
       envoyée à `/think`, puis prononcée via `/tts`.

Consommation : Whisper `tiny` + VAD ≈ 5 % de CPU sur un poste modeste, ce qui
permet de laisser un kiosque en veille toute la journée.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import queue
import sys
import time
import urllib.request
import wave
from typing import Optional

from app.config import SETTINGS

DEFAULT_SERVER = f"http://127.0.0.1:{SETTINGS.port}"
SAMPLE_RATE = 16000
FRAME_MS = 30


def load_audio_stack():
    try:
        import numpy as np
        import sounddevice as sd
    except ImportError:
        print(
            "Dépendances audio manquantes. Installez-les :\n"
            "    pip install sounddevice numpy webrtcvad-wheels\n"
            "(sous Linux : sudo apt install libportaudio2)",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        import webrtcvad

        vad = webrtcvad.Vad(2)
    except ImportError:
        print("VAD indisponible (pip install webrtcvad-wheels) : veille moins économe.", file=sys.stderr)
        vad = None

    return np, sd, vad


def call_api(server: str, path: str, payload: dict, timeout: int = 60) -> Optional[dict]:
    request = urllib.request.Request(
        f"{server.rstrip('/')}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
            return json.loads(response.read().decode("utf-8"))
    except Exception as error:
        print(f"  ! API {path} : {error}", file=sys.stderr)
        return None


def pcm_to_wav_base64(samples, sample_rate: int = SAMPLE_RATE) -> str:
    import numpy as np

    data = np.clip(np.asarray(samples, dtype=np.float32), -1.0, 1.0)
    pcm = (data * 32767).astype("<i2").tobytes()
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm)
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def contains_wake_word(text: str, wake_words: list[str]) -> bool:
    normalized = f" {text.lower().strip()} "
    return any(f" {word.lower().strip()} " in normalized or word.lower().strip() in normalized for word in wake_words)


def main() -> int:
    parser = argparse.ArgumentParser(description="Veille vocale ISA (mot de réveil) pour le zarma et le haoussa.")
    parser.add_argument("--lang", default="dje", choices=["dje", "ha", "fr", "en"], help="Langue attendue")
    parser.add_argument("--server", default=DEFAULT_SERVER, help="Adresse du serveur ISA")
    parser.add_argument("--speak", action="store_true", help="Prononcer les réponses via /tts")
    parser.add_argument("--device", type=int, default=None, help="Index du périphérique audio")
    parser.add_argument("--list-devices", action="store_true", help="Lister les micros et quitter")
    parser.add_argument("--listen-seconds", type=float, default=SETTINGS.wake_listen_seconds, help="Durée capturée après le réveil")
    args = parser.parse_args()

    np, sd, vad = load_audio_stack()

    if args.list_devices:
        print(sd.query_devices())
        return 0

    print("═" * 68)
    print(f"  ISA — veille vocale ({args.lang}) sur {args.server}")
    print("═" * 68)

    health = call_api(args.server, "/health", {}) if False else None
    try:
        with urllib.request.urlopen(f"{args.server.rstrip('/')}/health", timeout=5) as response:  # noqa: S310
            health = json.loads(response.read().decode("utf-8"))
        print(f"  Serveur : {health.get('service')} — STT={health.get('stt')} TTS={health.get('tts')} LLM={health.get('llm')}")
    except Exception as error:
        print(f"  ! Serveur injoignable : {error}")
        print("    Démarrez-le : python -m uvicorn app.main:app --host 0.0.0.0 --port 8787")
        return 1

    audio_queue: "queue.Queue[np.ndarray]" = queue.Queue()

    def callback(indata, frames, time_info, status) -> None:
        if status:
            print(f"  (audio : {status})", file=sys.stderr)
        audio_queue.put(indata.copy())

    wake_words = SETTINGS.wake_words
    print(f"  Mots de réveil : {', '.join(wake_words)}")
    print("  En écoute… (Ctrl+C pour arrêter)\n")

    armed = False
    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32",
        blocksize=int(SAMPLE_RATE * FRAME_MS / 1000),
        device=args.device,
        callback=callback,
    ):
        while True:
            try:
                block = audio_queue.get()
                samples = block[:, 0]

                # VAD : on ignore les silences pour économiser le CPU.
                if vad is not None:
                    pcm16 = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
                    voiced = vad.is_speech(pcm16, SAMPLE_RATE)
                    if not voiced and not armed:
                        continue

                window_seconds = args.listen_seconds if armed else 1.2
                window = collect_window(audio_queue, samples, window_seconds)
                audio_b64 = pcm_to_wav_base64(window)

                result = call_api(args.server, "/stt", {"audioBase64": audio_b64, "language": args.lang, "mimeType": "audio/wav"})
                text = (result or {}).get("text", "").strip()
                if not text:
                    continue

                if not armed:
                    if contains_wake_word(text, wake_words):
                        armed = True
                        print(f"  ◆ Réveil détecté : « {text} » — je vous écoute…")
                        if args.speak:
                            speak_text(args.server, "Oui ?", args.lang)
                        time.sleep(0.4)
                    continue

                # Phrase après le réveil : on la traite, puis on se réarme.
                print(f"  ● {text}")
                answer = call_api(args.server, "/think", {"text": text, "language": args.lang, "context": {}})
                reply = (answer or {}).get("reply") or "Je n'ai pas compris."
                print(f"  ○ {reply}")
                if args.speak:
                    speak_text(args.server, reply, (answer or {}).get("language") or args.lang)
                armed = False

            except KeyboardInterrupt:
                print("\n  Arrêt de la veille.")
                return 0
            except Exception as error:
                print(f"  ! {error}", file=sys.stderr)
                armed = False
                time.sleep(0.5)


def collect_window(audio_queue, first_block, seconds: float):
    """Accumule `seconds` d'audio à partir du bloc courant."""
    import numpy as np

    needed = int(SAMPLE_RATE * seconds)
    collected = [first_block]
    total = first_block.size
    deadline = time.time() + seconds + 0.6
    while total < needed and time.time() < deadline:
        try:
            block = audio_queue.get(timeout=0.2)
        except queue.Empty:
            break
        collected.append(block[:, 0])
        total += block.shape[0]
    return np.concatenate(collected)[:needed]


def speak_text(server: str, text: str, language: str) -> None:
    """Lit une réponse via /tts (nécessite un haut-parleur sur le poste)."""
    try:
        import numpy as np
        import sounddevice as sd

        response = call_api(server, "/tts", {"text": text, "language": language})
        audio_b64 = (response or {}).get("audioBase64")
        if not audio_b64:
            return
        raw = base64.b64decode(audio_b64)
        with wave.open(io.BytesIO(raw), "rb") as handle:
            rate = handle.getframerate()
            frames = handle.readframes(handle.getnframes())
        pcm = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
        sd.play(pcm, samplerate=rate)
        sd.wait()
    except Exception as error:
        print(f"  (voix indisponible : {error})", file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
