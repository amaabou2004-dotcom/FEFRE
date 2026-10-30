#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  ISA — Installation du serveur vocal local (Linux / macOS)
#  Usage :  bash scripts/install.sh            (installation complète)
#           bash scripts/install.sh --light    (API + règles, sans modèles)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
MODE="${1:-full}"
VENV="${ROOT}/.venv"

say() { printf '\n\033[1;33m▶ %s\033[0m\n' "$1"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$1"; }
warn(){ printf '  \033[1;31m✗\033[0m %s\n' "$1"; }

echo "══════════════════════════════════════════════════════════════════════"
echo "  ISA — Assistant vocal du Niger (serveur local)"
echo "  Excellence Services SARL · Niamey"
echo "══════════════════════════════════════════════════════════════════════"

# ── 1. Python 3.10+ ──────────────────────────────────────────────────────────
say "Vérification de Python"
if ! command -v python3 >/dev/null 2>&1; then
  warn "python3 introuvable. Installez-le :  sudo apt install python3 python3-venv python3-pip"
  exit 1
fi
PY_VERSION="$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
ok "Python ${PY_VERSION}"
if [[ "$(python3 -c 'import sys; print(sys.version_info[0]*100 + sys.version_info[1])')" -lt 310 ]]; then
  warn "Python 3.10 ou plus récent est requis."
  exit 1
fi

# ── 2. Environnement virtuel ─────────────────────────────────────────────────
say "Création de l'environnement virtuel (.venv)"
if [[ ! -d "${VENV}" ]]; then
  python3 -m venv "${VENV}" 2>/dev/null || {
    warn "python3-venv manquant. Installez-le :  sudo apt install python3-venv"
    exit 1
  }
fi
# shellcheck disable=SC1091
source "${VENV}/bin/activate"
python -m pip install --upgrade pip wheel setuptools >/dev/null
ok "pip à jour"

# ── 3. Dépendances ───────────────────────────────────────────────────────────
say "Installation du socle (API + géographie + règles hors-ligne)"
pip install -r requirements.txt
ok "Socle installé — ISA peut déjà démarrer"

if [[ "${MODE}" == "--light" ]]; then
  echo
  ok "Installation légère terminée."
  echo "  Démarrage :  source .venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8787"
  echo "  Ajoutez ensuite la voix :  bash scripts/install.sh"
  exit 0
fi

say "Installation de la voix (Whisper + Piper + MMS zarma/haoussa)"
echo "  ⚠ Téléchargement d'environ 1,5 Go (torch). Sur 3G/4G : 20 à 60 min."
echo "    Pour reporter cette étape, relancez plus tard : bash scripts/install.sh"
pip install -r requirements-voice.txt || warn "Installation voix incomplète (voir messages ci-dessus)"
ok "Briques vocales installées"

# ── 4. ffmpeg (décodage webm/opus du navigateur) ─────────────────────────────
say "Vérification de ffmpeg"
if command -v ffmpeg >/dev/null 2>&1; then
  ok "ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3)"
else
  warn "ffmpeg absent (nécessaire si l'audio arrive en webm/opus)."
  echo "    Debian/Ubuntu : sudo apt install ffmpeg"
  echo "    Fedora        : sudo dnf install ffmpeg"
  echo "    macOS         : brew install ffmpeg"
fi

# ── 5. espeak-ng (voix de secours, aucun téléchargement) ─────────────────────
say "Vérification d'espeak-ng (voix de secours)"
if command -v espeak-ng >/dev/null 2>&1 || command -v espeak >/dev/null 2>&1; then
  ok "espeak-ng présent"
else
  echo "    Optionnel : sudo apt install espeak-ng"
fi

# ── 6. Modèles ───────────────────────────────────────────────────────────────
say "Téléchargement des modèles vocaux"
python scripts/download_models.py --lang fr,ha,dje || warn "Certains modèles n'ont pas pu être téléchargés"

# ── 7. Ollama (cerveau local, optionnel) ─────────────────────────────────────
say "Cerveau local (Ollama) — optionnel mais recommandé"
if command -v ollama >/dev/null 2>&1; then
  ok "Ollama déjà installé"
  echo "    Modèles disponibles : $(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | paste -sd' ' - || echo 'aucun')"
  echo "    Pour ajouter llama3.2:3b :  ollama pull llama3.2:3b"
else
  echo "    Non installé. Pour l'installer :"
  echo "      curl -fsSL https://ollama.com/install.sh | sh"
  echo "      ollama pull llama3.2:3b"
  echo "    Sans Ollama, ISA répond avec ses règles hors-ligne (heure, lieux,"
  echo "    urgences, itinéraires, météo, appels) — ce qui couvre l'essentiel."
fi

# ── 8. Configuration ─────────────────────────────────────────────────────────
say "Configuration"
if [[ ! -f "${ROOT}/.env" ]]; then
  cp "${ROOT}/.env.example" "${ROOT}/.env"
  ok ".env créé (à ajuster si besoin)"
else
  ok ".env déjà présent"
fi

echo
echo "══════════════════════════════════════════════════════════════════════"
echo "  ✓ Installation terminée"
echo "══════════════════════════════════════════════════════════════════════"
echo
echo "  Démarrer le serveur :"
echo "    cd ${ROOT}"
echo "    source .venv/bin/activate"
echo "    python -m uvicorn app.main:app --host 0.0.0.0 --port 8787"
echo
echo "  Vérifier depuis un téléphone du même réseau :"
echo "    http://ADRESSE_IP_DU_POSTE:8787/"
echo
echo "  Brancher le site web sur ce serveur :"
echo "    https://votre-site/assistant-vocal?isaServer=http://ADRESSE_IP:8787"
echo
echo "  Service au démarrage (Linux) :"
echo "    sudo cp deploy/isa-voice.service /etc/systemd/system/"
echo "    sudo systemctl enable --now isa-voice"
echo
