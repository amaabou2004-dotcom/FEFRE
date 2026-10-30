#!/usr/bin/env python3
"""
ISA — Téléchargement des modèles vocaux
=======================================
À lancer UNE fois sur la machine de Niamey qui servira de serveur vocal,
pendant qu'elle dispose d'Internet. Ensuite, tout fonctionne hors-ligne.

    python scripts/download_models.py                # français + haoussa + zarma
    python scripts/download_models.py --lang fr      # français seulement
    python scripts/download_models.py --whisper small
    python scripts/download_models.py --skip-whisper # voix uniquement

Ordre de grandeur :
    voix Piper française          ≈  60 Mo
    voix MMS haoussa              ≈ 130 Mo
    voix MMS zarma                ≈ 130 Mo
    Whisper small                 ≈ 460 Mo
    torch (dépendance)            ≈ 800 Mo   ← le plus lourd, installé par pip

Sur une connexion 3G/4G nigérienne, comptez 20 à 60 minutes. Le script est
reprisable : relancez-le après une coupure, il ne retélécharge pas ce qui est
déjà complet.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
PIPER_DIR = MODELS_DIR / "piper"
WHISPER_DIR = MODELS_DIR / "whisper"
HF_CACHE = MODELS_DIR / "huggingface"

# Voix Piper : français (siwis) et anglais (lessac), qualité « medium ».
PIPER_VOICES = {
    "fr_FR-siwis-medium": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
    "fr_FR-siwis-medium.json": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json",
    "en_US-lessac-medium": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "en_US-lessac-medium.json": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
}

# Voix Meta MMS-TTS : les seules voix libres pour le zarma et le haoussa.
MMS_VOICES = {
    "ha": "facebook/mms-tts-hau",   # haoussa
    "dje": "facebook/mms-tts-dje",  # zarma (Djerma)
    "fra": "facebook/mms-tts-fra",  # français (alternative à Piper)
}


def human_size(num_bytes: float) -> str:
    for unit in ("o", "Ko", "Mo", "Go"):
        if num_bytes < 1024:
            return f"{num_bytes:.0f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} To"


def download(url: str, destination: Path) -> bool:
    """Téléchargement repris simple, avec progression lisible."""
    if destination.exists() and destination.stat().st_size > 1024:
        print(f"  ✓ déjà présent : {destination.name} ({human_size(destination.stat().st_size)})")
        return True

    try:
        import urllib.request

        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(destination.suffix + ".part")

        def progress(blocks: int, block_size: int, total: int) -> None:
            if total <= 0:
                return
            downloaded = blocks * block_size
            percent = min(100, int(downloaded * 100 / total))
            bar = "█" * (percent // 5) + "░" * (20 - percent // 5)
            print(f"\r  [{bar}] {percent:3d}% · {human_size(min(downloaded, total))}/{human_size(total)}", end="", flush=True)

        started = time.time()
        urllib.request.urlretrieve(url, temporary, reporthook=progress)  # noqa: S310
        temporary.rename(destination)
        print(f"\n  ✓ {destination.name} en {time.time() - started:.0f} s")
        return True
    except Exception as error:
        print(f"\n  ✗ échec : {error}")
        return False


def download_whisper(model_name: str) -> bool:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("  ! faster-whisper non installé → pip install -r requirements-voice.txt")
        return False

    print(f"  ↓ Whisper « {model_name} » (cela peut prendre plusieurs minutes)…")
    try:
        WhisperModel(model_name, device="cpu", compute_type="int8", download_root=str(WHISPER_DIR))
        print(f"  ✓ Whisper {model_name} prêt")
        return True
    except Exception as error:
        print(f"  ✗ Whisper en échec : {error}")
        return False


def download_mms(languages: list[str]) -> bool:
    try:
        from transformers import AutoTokenizer, VitsModel
    except ImportError:
        print("  ! transformers non installé → pip install -r requirements-voice.txt")
        return False

    ok = True
    for code in languages:
        model_id = MMS_VOICES.get(code)
        if not model_id:
            print(f"  ? code inconnu : {code}")
            continue
        print(f"  ↓ MMS-TTS {model_id}…")
        try:
            VitsModel.from_pretrained(model_id, cache_dir=str(HF_CACHE))
            AutoTokenizer.from_pretrained(model_id, cache_dir=str(HF_CACHE))
            print(f"  ✓ {model_id} prêt")
        except Exception as error:
            ok = False
            print(f"  ✗ {model_id} en échec : {error}")
            if code == "dje":
                print(
                    "    → Si le modèle zarma est indisponible, ISA utilise le pont français\n"
                    "      (ISA_TTS_BRIDGE=1) ou espeak-ng. Vérifiez votre connexion, puis\n"
                    "      relancez ce script."
                )
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="Télécharge les modèles vocaux ISA pour un usage hors-ligne.")
    parser.add_argument("--lang", default="fr,ha,dje", help="Langues à télécharger (fr, en, ha, dje)")
    parser.add_argument("--whisper", default="small", help="Taille du modèle Whisper (tiny, base, small, medium)")
    parser.add_argument("--skip-whisper", action="store_true", help="Ne pas télécharger Whisper")
    parser.add_argument("--skip-mms", action="store_true", help="Ne pas télécharger les voix MMS (zarma/haoussa)")
    parser.add_argument("--skip-piper", action="store_true", help="Ne pas télécharger les voix Piper (fr/en)")
    args = parser.parse_args()

    languages = [item.strip() for item in str(args.lang).split(",") if item.strip()]
    print("═" * 68)
    print("  ISA — téléchargement des modèles vocaux (Niger)")
    print("═" * 68)
    print(f"  Dossier : {MODELS_DIR}")
    print(f"  Langues : {', '.join(languages)}")
    print()

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    results: list[bool] = []

    if not args.skip_piper:
        print("[1/3] Voix Piper (français / anglais)")
        wanted = ["fr_FR-siwis-medium", "fr_FR-siwis-medium.json"]
        if "en" in languages:
            wanted += ["en_US-lessac-medium", "en_US-lessac-medium.json"]
        for name in wanted:
            results.append(download(PIPER_VOICES[name], PIPER_DIR / Path(name).name))
        print()

    if not args.skip_mms:
        print("[2/3] Voix MMS-TTS (langues nationales)")
        targets = [code for code in ("ha", "dje", "fra") if code in languages or (code == "ha" and "ha" in languages)]
        if not targets and languages:
            targets = ["ha", "dje"]
        results.append(download_mms(targets))
        print()

    if not args.skip_whisper:
        print("[3/3] Reconnaissance vocale (Whisper)")
        results.append(download_whisper(args.whisper))
        print()

    print("═" * 68)
    if all(results):
        print("  ✓ Tous les modèles sont prêts. Lancez :  ./scripts/install.sh  puis")
        print("    python -m uvicorn app.main:app --host 0.0.0.0 --port 8787")
    else:
        print("  ! Certains téléchargements ont échoué (connexion ?). Relancez ce script :")
        print("    il reprend là où il s'est arrêté, sans retélécharger le reste.")
        print("    ISA fonctionne déjà avec les briques présentes (voir http://IP:8787/).")
    print("═" * 68)
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
