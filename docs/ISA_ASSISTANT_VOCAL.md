# ISA — Assistant vocal IA du Niger

**ISA** (*Intelligence Sahélienne d'Assistance*) est l'assistant vocal du site
`FEFRE` : il écoute, comprend, **parle français, zarma et haoussa**, ouvre
Google Maps, lance la navigation, appelle, envoie des SMS et des WhatsApp, règle
des minuteurs et des alarmes, donne la météo — et il continue de fonctionner
**sans Internet** grâce à un serveur IA local installé à Niamey.

> Objectif assumé : un comportement « façon Siri », mais pour le Niger, dans les
> langues du Niger, sur du matériel modeste et avec une connexion irrégulière.

- **Page plein écran** : `/assistant-vocal` (alias `/vocal`, `/isa`)
- **Bouton flottant** : orbe micro en bas à droite, sur toutes les pages du site
- **Serveur local** : [`voice-ai/`](../voice-ai/README.md)

---

## 1. Architecture

```
┌──────────────────────────── Navigateur / téléphone ────────────────────────────┐
│  Micro (WAV 16 kHz)   Orbe Siri   Cartes Google Maps   Appels / SMS / WhatsApp │
│                                                                                       │
│  src/lib/voice/                                                                       │
│   ├─ intents.ts        détection d'intention + emplacements (fr/zarma/haoussa)        │
│   ├─ brain.ts          règles déterministes → réponse + actions (hors-ligne)          │
│   ├─ nigerKnowledge.ts lieux, villes, distances, urgences 17/18/15, faits pays        │
│   ├─ mapsLinks.ts      liens Google Maps SANS clé + Nominatim/OSRM                     │
│   ├─ audioRecorder.ts  enregistrement WAV 16 kHz mono                                  │
│   ├─ speechRecognition.ts  Web Speech API (fr/en)                                      │
│   ├─ speechSynthesis.ts    voix navigateur + lecteur audio serveur                     │
│   ├─ wakeWord.ts       veille « Isa ! »                                                │
│   ├─ scheduler.ts      minuteurs, alarmes, rappels + notifications                     │
│   └─ voiceClient.ts    arbitre entre navigateur, serveur local et cloud                │
└───────────────┬──────────────────────────────────────────┬────────────────────────────┘
                │ 1. serveur local présent ?                │ 2. sinon
                ▼                                           ▼
┌──────── voice-ai/ (poste de Niamey) ────────┐   ┌──── API du site (Node / Netlify) ───┐
│  /stt    faster-whisper (fr, ha, zarma)      │   │  /api/voice/stt    Gemini audio     │
│  /tts    MMS-TTS zarma+haoussa, Piper fr     │   │  /api/voice/think  Gemini texte     │
│  /think  règles + Ollama (llama3.2, qwen)    │   │  /api/voice/tts    Gemini TTS       │
│  /geo/*  Nominatim, Overpass, OSRM, Météo    │   │  /api/geo/*        mêmes services   │
│  100 % hors-ligne · données restent au Niger │   │  clé API jamais exposée             │
└──────────────────────────────────────────────┘   └─────────────────────────────────────┘
```

**Principe directeur : règles locales d'abord, modèles ensuite.** Les demandes
courantes (heure, lieux, urgences, appels, minuteurs) sont traitées
instantanément et hors-ligne par du code déterministe ; le modèle de langage ne
sert que pour les questions ouvertes. C'est ce qui rend l'assistant utilisable
avec une connexion 3G instable, et c'est aussi ce qui le rend gratuit à l'usage.

---

## 2. Ce que sait faire ISA aujourd'hui

### Voix
- Écoute au toucher (gros bouton) ou **mains libres** avec le mot de réveil « Isa ! »
- Transcription en direct à l'écran, orbe qui réagit au niveau sonore
- Réponse **parlée** : voix du navigateur en français, voix MMS-TTS en zarma et
  haoussa via le serveur local
- Commande « tais-toi » / « shiru » pour couper la voix

### Cartes et déplacements (sans clé API Google)
- « Conduis-moi au Grand Marché » → carte intégrée + bouton **Lancer la navigation**
- « Où est la pharmacie la plus proche ? » → recherche de proximité (Overpass)
- « Combien de kilomètres jusqu'à Zinder ? » → OSRM en ligne, distances
  indicatives hors-ligne
- Ouverture de l'app Google Maps du téléphone en un geste

### Téléphone et messages
- Appels (`tel:`), SMS pré-remplis (`sms:`), WhatsApp (`wa.me`), e-mail
- Contacts de l'entreprise reconnus (« appelle Excellence Services »)
- **Urgences nigériennes intégrées** : police 17, sapeurs-pompiers 18, SAMU 15

### Vie quotidienne
- Heure et date (fuseau `Africa/Niamey`), minuteurs, alarmes, rappels avec
  notifications et son
- Météo Open-Meteo (aucune clé, aucun compte)
- Traduction français ↔ zarma ↔ haoussa
- Base de connaissances Niger hors-ligne : capitale, langues, monnaie, climat,
  régions, fleuve, indicatif +227

### Entreprise
- Services, devis, horaires, coordonnées, localisation des bureaux
- Navigation vocale dans le site (« ouvre la page services »)

---

## 3. Langues

| Langue | Code | Reconnaissance | Voix | État |
| --- | --- | --- | --- | --- |
| Français | `fr` | navigateur **ou** Whisper | Piper / MMS | opérationnel |
| Haoussa | `ha` / `hau` | Whisper (bien couvert) | MMS-TTS `mms-tts-hau` | opérationnel avec le serveur local |
| Zarma | `dje` | Whisper + **lexique de correction** | MMS-TTS `mms-tts-dje` | opérationnel avec le serveur local, à affiner avec des locuteurs |
| Anglais | `en` | navigateur ou Whisper | Piper | bonus |

Le zarma n'est pas une langue d'entraînement de Whisper : il transcrit
phonétiquement, souvent en coupant les mots. ISA compense avec un lexique de
corrections (`voice-ai/lexiques/zarma-fr.csv`) appliqué **avant** la détection
d'intention, et avec un lexique de mots-clés côté navigateur
(`src/lib/voice/languages.ts`).

**Les lexiques livrés sont un socle de démarrage, pas une grammaire validée.**
Leur relecture par des locuteurs natifs est la première tâche d'amélioration,
et elle ne demande aucune compétence technique : voir
[`voice-ai/lexiques/README.md`](../voice-ai/lexiques/README.md).

ISA détecte automatiquement la langue parlée et bascule : un utilisateur peut
commencer en zarma et continuer en français sans rien régler.

---

## 4. Google Maps sans clé API

Le choix « aucune clé, aucune carte bancaire » repose sur quatre services
gratuits, relayés par un proxy serveur (CORS, cache, respect des quotas) :

| Besoin | Service | Endpoint |
| --- | --- | --- |
| Carte affichée, navigation, ouverture de l'app | liens profonds Google Maps (`api=1`) | côté navigateur |
| Adresse → coordonnées | Nominatim (OpenStreetMap) | `/api/geo/search` |
| « Le plus proche de moi » | Overpass API | `/api/geo/nearby` |
| Distance et durée réelles | OSRM | `/api/geo/route` |
| Météo | Open-Meteo | `/api/geo/weather` |
| Repli sans réseau | base `nigerKnowledge.ts` | — |

Règles d'usage respectées : User-Agent identifiable, 1 requête/seconde pour
Nominatim, cache local de 10 à 30 minutes (la data coûte cher au Niger).

Si vous obtenez un jour une clé **Google Maps Platform**, il suffira d'ajouter
`GOOGLE_MAPS_API_KEY` dans `.env` : les mêmes endpoints basculeront sur
Geocoding / Places / Directions, plus précis en zone rurale. Rien d'autre ne
change dans l'interface.

---

## 5. Mode 100 % local

```bash
cd voice-ai
bash scripts/install.sh        # Windows : scripts\install.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8787
```

Puis ouvrez le site avec `?isaServer=http://ADRESSE_IP:8787`. Le badge en haut
de la page passe à **« Serveur local Niamey »** et chaque réponse affiche
**« Hors-ligne »** quand aucune donnée n'a quitté le pays.

Détails, matériel conseillé, systemd, Docker et veille mains libres :
[`voice-ai/README.md`](../voice-ai/README.md).

> En HTTPS public, un navigateur refuse d'appeler un serveur HTTP distant.
> Réglez alors `ISA_LOCAL_SERVER` côté serveur web : c'est lui qui relaie.

---

## 6. Tests

```bash
# Règles de l'assistant (Node/tsx) : intentions, langues, cartes, actions
npm run test:voice

# Types et build du site
npm run lint && npm run build

# Serveur local
cd voice-ai && python -m pytest tests/ -q
```

`scripts/test-voice-brain.mts` vérifie notamment : la détection de langue sur
des phrases réelles, les numéros d'urgence 17/18/15, la production d'un lien
Google Maps valide pour « Conduis-moi au Grand Marché », les minuteurs et
alarmes, et la cohérence des réponses en zarma et en haoussa.

---

## 7. Feuille de route

### Phase 1 — livrée ici
Assistant vocal trilingue, cartes gratuites, actions téléphone/messages,
minuteurs/alarmes, météo, base Niger hors-ligne, serveur IA local complet,
veille « Isa ! », documentation et tests.

### Phase 2 — à faire avec le terrain
1. **Validation linguistique** : 3 à 4 ateliers avec des locuteurs zarma et
   haoussa pour enrichir les lexiques (le gain de qualité est immédiat).
2. **PWA installable + cache** : `manifest.json`, service worker, page
   d'accueil sur le téléphone, réponses hors-ligne mises en cache.
3. **Données locales enrichies** : pharmacies de garde, horaires de prière,
   marchés hebdomadaires, prix des transports interurbains — un simple fichier
   JSON mis à jour par l'équipe suffit.
4. **Passerelle SMS/WhatsApp réelle** : les endpoints `/gateway/*` existent
   déjà côté serveur ; il reste à brancher un modem GSM ou l'API WhatsApp
   Business pour que l'envoi soit automatique plutôt que délégué au téléphone.

### Phase 3 — industrialisation
1. **App Android** (Capacitor ou Kotlin) : réveil matériel, écran verrouillé,
   appels directs, fonctionnement en kiosque.
2. **Serveur dédié + supervision** : systemd, sauvegarde des lexiques,
   métriques de réussite par langue, tableau de bord des requêtes.
3. **Voix clonée ou fine-tunée** : enregistrer une voix nigérienne naturelle
   (avec consentement) et l'entraîner sur Piper/Coqui pour remplacer la voix
   MMS, plus robotique.
4. **Extension peul, tamasheq, arabe** : même architecture, deux fichiers de
   lexique en plus par langue.

---

## 8. Fichiers ajoutés

```
src/lib/voice/            types, langues, intentions, cerveau, connaissances Niger,
                          liens Maps, audio, reconnaissance, synthèse, veille,
                          minuteurs, client, contexte React
src/components/voice/     VoiceOrb (orbe animé), VoiceActionCards (boutons/cartes)
src/pages/VoiceAssistantPage.tsx
src/components/voice/VoiceAssistantFloatingButton.tsx
server/voiceService.ts    /api/voice/{stt,think,tts,translate}
server/geoService.ts      /api/geo/{search,nearby,route,weather}
netlify/functions/        voice-stt, voice-think, voice-tts, voice-translate, geo
voice-ai/                 serveur Python local (FastAPI + Whisper + MMS-TTS + Ollama)
scripts/test-voice-brain.mts
docs/ISA_ASSISTANT_VOCAL.md
```

Routes ajoutées : `/assistant-vocal`, `/vocal`, `/isa`.
Bouton « Assistant vocal » ajouté à la barre de navigation, orbe flottant sur
toutes les pages publiques.
