# ═══════════════════════════════════════════════════════════════════════════
#  ISA — Serveur vocal local (Docker)
#
#  Construction (image complète avec voix zarma/haoussa) :
#      docker build -t isa-voice -f voice-ai/Dockerfile voice-ai
#
#  Construction légère (API + règles hors-ligne + géographie, ~250 Mo) :
#      docker build --target base -t isa-voice-light -f voice-ai/Dockerfile voice-ai
#
#  Exécution :
#      docker run -d --name isa-voice -p 8787:8787 -v isa-models:/app/models isa-voice
#
#  Le volume `isa-models` conserve les modèles téléchargés entre deux
#  redémarrages : une fois rempli, le conteneur fonctionne sans Internet.
# ═══════════════════════════════════════════════════════════════════════════

# ── Étape 1 : socle (API, règles hors-ligne, géographie) ─────────────────────
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    ISA_HOST=0.0.0.0 \
    ISA_PORT=8787 \
    ISA_MODELS_DIR=/app/models

WORKDIR /app

# ffmpeg : décodage du webm/opus envoyé par les navigateurs.
# espeak-ng : voix de secours, aucun téléchargement nécessaire.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg espeak-ng ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY app ./app
COPY lexiques ./lexiques
COPY scripts ./scripts

RUN mkdir -p /app/models/piper /app/models/whisper /app/models/huggingface
VOLUME ["/app/models"]

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=8s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8787/health',timeout=5).status==200 else 1)"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8787"]

# ── Étape 2 : image complète (Whisper + Piper + MMS-TTS zarma/haoussa) ───────
FROM base AS full

# torch CPU : ~800 Mo, indispensable aux voix MMS (zarma, haoussa).
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu \
        torch --no-cache-dir

COPY requirements-voice.txt ./
RUN pip install -r requirements-voice.txt || pip install -r requirements-voice.txt --no-deps

# Téléchargement des modèles pendant la construction : l'image est ensuite
# 100 % autonome (idéal si la connexion du site est fragile).
# Retirez cette ligne si vous préférez télécharger au premier démarrage.
RUN python scripts/download_models.py --lang fr,ha,dje --skip-whisper || true
RUN python scripts/download_models.py --whisper small --skip-mms --skip-piper || true

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8787"]
