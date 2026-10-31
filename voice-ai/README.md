# ISA — Serveur IA vocal 100 % local (Niamey)

Serveur Python qui donne au site `FEFRE` une **voix**, une **compréhension des
langues nationales** et un **cerveau** qui fonctionne **sans Internet**.

| Ce que fait le serveur | Technologie | Sans Internet ? |
| --- | --- | --- |
| Comprendre la parole (français, haoussa, zarma) | `faster-whisper` | ✅ |
| Parler en **zarma** et en **haoussa** | Meta **MMS-TTS** | ✅ |
| Parler en français / anglais | **Piper** (voix neuronale) | ✅ |
| Répondre aux questions ouvertes | **Ollama** (llama3.2, qwen2.5) | ✅ |
| Heure, date, urgences, lieux, distances | règles déterministes | ✅ |
| Cartes, adresses, pharmacies proches | OpenStreetMap (Nominatim, Overpass) | ❌ (nécessite un réseau) |
| Itinéraires et durées réelles | OSRM | ❌ |
| Météo | Open-Meteo (sans clé) | ❌ |

Le site web détecte ce serveur tout seul et bascule dessus. S'il est absent,
l'assistant continue de fonctionner avec ses règles hors-ligne et, si
disponible, Gemini dans le cloud.

---

## 1. Installation rapide

### Linux / macOS

```bash
cd voice-ai
bash scripts/install.sh            # complet (voix + modèles, ~1,5 Go)
bash scripts/install.sh --light    # API + règles seulement (rapide, ~150 Mo)
```

### Windows

```bat
cd voice-ai
scripts\install.bat
:: puis autoriser le port dans le pare-feu (une seule fois, en admin) :
netsh advfirewall firewall add rule name="ISA voice 8787" dir=in action=allow protocol=TCP localport=8787
```

### Docker

```bash
docker compose -f voice-ai/docker-compose.yml up -d --build
```

---

## 2. Démarrage

```bash
cd voice-ai
source .venv/bin/activate          # Windows : .venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8787
```

Puis ouvrez **http://127.0.0.1:8787/** : une page d'état indique ce que la
machine sait réellement faire. Depuis un téléphone du même réseau, remplacez
`127.0.0.1` par l'adresse IP du poste (`ipconfig` / `ip addr`).

### Brancher le site web sur le serveur

Trois méthodes, de la plus simple à la plus pérenne :

1. **Dans l'URL** (idéal pour une démonstration) :
   `https://votre-site/assistant-vocal?isaServer=http://192.168.1.20:8787`
2. **Au build** : `VITE_ISA_LOCAL_SERVER=http://192.168.1.20:8787 npm run build`
3. **Côté serveur web** (Netlify / cPanel / Express) : `ISA_LOCAL_SERVER=http://127.0.0.1:8787`
   — le site relaie alors les requêtes, ce qui évite tout problème de CORS.

> ⚠️ Un site en **HTTPS** ne peut pas appeler un serveur **HTTP** distant
> (mixed content), sauf `localhost`. En HTTPS public, utilisez la méthode 3 :
> c'est votre serveur web (en HTTPS) qui parle au serveur ISA local.

---

## 3. Endpoints

| Méthode | Chemin | Rôle |
| --- | --- | --- |
| GET | `/health` | capacités réelles (STT/TTS/LLM), modèles chargés |
| GET | `/` | page d'état lisible depuis un téléphone |
| GET | `/docs` | documentation interactive (Swagger) |
| POST | `/stt` | audio (base64, fichier ou binaire) → texte |
| POST | `/tts` | texte → audio WAV base64 |
| GET | `/tts.wav?text=Fofo&lang=dje` | texte → WAV directement jouable |
| POST | `/think` | texte → réponse + actions (règles puis LLM) |
| POST | `/translate` | français ↔ zarma ↔ haoussa |
| GET | `/geo/search?q=` | géocodage (Nominatim) |
| GET | `/geo/nearby?category=pharmacy&lat=&lon=` | proximité (Overpass) |
| GET | `/geo/route?from=lat,lon&to=lat,lon` | itinéraire (OSRM) |
| GET | `/geo/weather?city=Niamey` | météo (Open-Meteo) |
| POST | `/gateway/sms` | envoi SMS via votre passerelle (optionnel) |
| POST | `/gateway/whatsapp` | envoi WhatsApp via webhook (optionnel) |

### Exemples

```bash
# Reconnaissance vocale (fichier audio)
curl -X POST http://127.0.0.1:8787/stt \
     -F "audio=@ma-phrase.wav" -F "language=ha"

# Voix zarma
curl "http://127.0.0.1:8787/tts.wav?text=Fofo%2C%20mate%20ni%20go%3F&lang=dje" -o fofo.wav

# Cerveau
curl -X POST http://127.0.0.1:8787/think \
     -H 'Content-Type: application/json' \
     -d '{"text":"Conduis-moi au Grand Marché","language":"fr"}'

# Pharmacies proches
curl "http://127.0.0.1:8787/geo/nearby?category=pharmacy&lat=13.5137&lon=2.1098&radius=4000"
```

---

## 4. Configuration

Copiez `.env.example` vers `.env`. Tout est optionnel ; les réglages qui
comptent vraiment :

| Variable | Défaut | À savoir |
| --- | --- | --- |
| `ISA_PORT` | `8787` | port écouté |
| `ISA_STT_MODEL` | `small` | `tiny`/`base` pour 2 Go de RAM, `medium` pour un meilleur haoussa |
| `ISA_STT_DEVICE` | `auto` | forcez `cpu` ou `cuda` |
| `ISA_TTS_DJE` | `facebook/mms-tts-dje` | voix zarma |
| `ISA_TTS_HAU` | `facebook/mms-tts-hau` | voix haoussa |
| `ISA_OLLAMA_MODEL` | `llama3.2:3b` | `qwen2.5:1.5b` si vous avez 4 Go de RAM |
| `ISA_CORS_ORIGINS` | `*` | restreignez en production publique |
| `ISA_API_KEY` | vide | si définie, chaque requête doit envoyer `X-ISA-Key` |
| `ISA_TTS_BRIDGE` | `1` | si la voix zarma manque, traduire puis parler français |

---

## 5. Matériel conseillé

| Configuration | Ce qui tourne | Budget indicatif |
| --- | --- | --- |
| PC d'occasion 8 Go RAM, SSD | Whisper `small` + Piper + MMS + `llama3.2:3b` | ~120 000 FCFA |
| Raspberry Pi 5 (8 Go) + SSD NVMe | Whisper `tiny` + Piper + MMS (LLM lent) | ~110 000 FCFA |
| Mini-PC 16 Go + GPU d'occasion | Whisper `medium` + tout + `qwen2.5:7b` | ~300 000 FCFA |
| Poste existant du bureau | socle + Piper (sans LLM) | 0 FCFA |

Un serveur unique peut équiper tout un bureau ou un kiosque : les téléphones
n'ont besoin que du navigateur, le calcul se fait sur le poste.

---

## 6. Démarrage automatique (poste dédié)

```bash
sudo cp deploy/isa-voice.service /etc/systemd/system/
sudo nano /etc/systemd/system/isa-voice.service    # ajustez User et chemins
sudo systemctl daemon-reload
sudo systemctl enable --now isa-voice
journalctl -u isa-voice -f
```

---

## 7. Veille « mains libres » (mot de réveil en zarma / haoussa)

Les navigateurs ne transcrivent pas le zarma : la veille « Isa ! » passe donc
par le serveur, avec un micro branché sur le poste.

```bash
pip install sounddevice numpy webrtcvad-wheels
python scripts/wake_word_daemon.py --lang dje --speak
python scripts/wake_word_daemon.py --list-devices
```

Le démon détecte la voix (VAD), transcrit 1,2 s d'audio, cherche le mot de
réveil, puis traite la phrase suivante et la prononce. Consommation ≈ 5 % de
CPU en veille avec Whisper `tiny`.

---

## 8. Tests

```bash
cd voice-ai
pip install -r requirements.txt httpx pytest
python -m pytest tests/ -q
```

Les tests vérifient surtout ce qui doit marcher **partout** : démarrage,
`/health` honnête, règles hors-ligne (heure, urgences 17/18/15, lieux de
Niamey, liens Google Maps), messages d'erreur explicites quand un modèle
manque, et cohérence des numéros d'urgence avec le site web.

---

## 9. Améliorer le zarma et le haoussa

Deux fichiers, aucune programmation nécessaire :

- `lexiques/zarma-fr.csv`, `lexiques/hausa-fr.csv` : corrections de
  transcription et vocabulaire (voir `lexiques/README.md`) ;
- `../src/lib/voice/languages.ts` : mots-clés d'intention et réponses prêtes à
  l'emploi côté site web.

Protocole conseillé : faites prononcer 20 commandes du quotidien à un
locuteur, notez ce que l'écran affiche, ajoutez une ligne par écart, relancez.
Trois à quatre séances suffisent pour un taux de réussite confortable sur les
commandes courantes.

---

## 10. Sécurité et données

- Par défaut le serveur n'écoute que sur votre réseau ; ne l'exposez jamais
  directement sur Internet sans `ISA_API_KEY` ni reverse-proxy HTTPS.
- Aucune donnée audio n'est envoyée à un tiers : la reconnaissance et la voix
  se font sur votre machine.
- Les services cartographiques (OSM) reçoivent uniquement le texte recherché et
  les coordonnées, avec un User-Agent identifiable, conformément à leur
  politique d'usage.
- Les réponses médicales, juridiques ou financières ne sont pas du ressort
  d'ISA : il oriente vers les numéros officiels (17, 18, 15) et vers un
  conseiller humain.
