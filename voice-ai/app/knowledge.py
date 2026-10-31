"""
ISA — Base de connaissances Niger (miroir Python, 100 % hors-ligne)
===================================================================
Même contenu que `src/lib/voice/nigerKnowledge.ts` côté site web : le serveur
local doit pouvoir répondre sans Internet ni modèle téléchargé.

Les deux fichiers doivent rester synchronisés. Le script
`scripts/sync-knowledge.py` vérifie la cohérence des numéros d'urgence et des
coordonnées de Niamey.
"""

from __future__ import annotations

from typing import Dict, List, Optional, TypedDict


class Trilingual(TypedDict):
    fr: str
    dje: str
    ha: str


EMERGENCY_CONTACTS: List[Dict[str, object]] = [
    {
        "id": "police",
        "number": "17",
        "dialable": "17",
        "label": {"fr": "Police de secours", "dje": "Polisi faaba", "ha": "‘Yan sanda na agaji"},
    },
    {
        "id": "fire",
        "number": "18",
        "dialable": "18",
        "label": {"fr": "Sapeurs-pompiers", "dje": "Danwasu tayey", "ha": "Sojojin wuta"},
    },
    {
        "id": "medical",
        "number": "15",
        "dialable": "15",
        "label": {"fr": "Assistance médicale (SAMU)", "dje": "Darzanka faaba", "ha": "Agajin gaggawa na asibiti"},
    },
]

# Coordonnées approximatives : utilisées uniquement hors-ligne. En ligne, le
# serveur interroge Nominatim (app/geo.py) et remplace ces valeurs.
NIAMEY_LANDMARKS: List[Dict[str, object]] = [
    {"name": "Grand Marché de Niamey", "aliases": ["grand marche", "grand marché", "marché central", "petit marché"], "lat": 13.517, "lon": 2.108},
    {"name": "Marché Katako", "aliases": ["katako"], "lat": 13.509, "lon": 2.123},
    {"name": "Aéroport International Diori Hamani", "aliases": ["aéroport", "aeroport", "diori hamani", "nim"], "lat": 13.4816, "lon": 2.1836},
    {"name": "Stade Général Seyni Kountché", "aliases": ["stade", "stade national"], "lat": 13.5277, "lon": 2.0986},
    {"name": "Musée National Boubou Hama", "aliases": ["musée", "musee", "musée national"], "lat": 13.5206, "lon": 2.1128},
    {"name": "Pont des Martyrs", "aliases": ["pont des martyrs", "pont kennedy", "pont"], "lat": 13.527, "lon": 2.096},
    {"name": "Hôpital National Lamordé", "aliases": ["lamorde", "hôpital lamorde"], "lat": 13.508, "lon": 2.12},
    {"name": "Université Abdou Moumouni", "aliases": ["université", "uam", "campus"], "lat": 13.495, "lon": 2.115},
    {"name": "Grande Mosquée de Niamey", "aliases": ["grande mosquée", "mosquée"], "lat": 13.5155, "lon": 2.111},
    {"name": "Corniche du fleuve Niger", "aliases": ["corniche", "fleuve", "fleuve niger"], "lat": 13.5205, "lon": 2.1},
]

NIGER_CITIES: List[Dict[str, object]] = [
    {"name": "Niamey", "lat": 13.5137, "lon": 2.1098, "distance_km": 0},
    {"name": "Dosso", "lat": 13.049, "lon": 3.1937, "distance_km": 155},
    {"name": "Tillabéri", "lat": 14.2117, "lon": 1.4531, "distance_km": 110},
    {"name": "Téra", "lat": 14.0078, "lon": 0.7531, "distance_km": 175},
    {"name": "Ouallam", "lat": 14.3167, "lon": 2.0833, "distance_km": 200},
    {"name": "Filingué", "lat": 14.3521, "lon": 3.3168, "distance_km": 185},
    {"name": "Gaya", "lat": 11.8833, "lon": 3.4333, "distance_km": 330},
    {"name": "Dogondoutchi", "lat": 13.64, "lon": 4.03, "distance_km": 380},
    {"name": "Birni N'Konni", "lat": 13.7969, "lon": 5.251, "distance_km": 400},
    {"name": "Tahoua", "lat": 14.8888, "lon": 5.2692, "distance_km": 550},
    {"name": "Madaoua", "lat": 14.0764, "lon": 5.9597, "distance_km": 430},
    {"name": "Maradi", "lat": 13.5, "lon": 7.1017, "distance_km": 640},
    {"name": "Zinder", "lat": 13.8069, "lon": 8.9881, "distance_km": 870},
    {"name": "Agadez", "lat": 16.9737, "lon": 7.9863, "distance_km": 930},
    {"name": "Arlit", "lat": 18.7369, "lon": 7.3853, "distance_km": 1200},
    {"name": "Diffa", "lat": 13.3154, "lon": 12.6089, "distance_km": 1400},
    {"name": "N'Guigmi", "lat": 14.2533, "lon": 13.1117, "distance_km": 1550},
]

NIGER_FACTS: List[Dict[str, object]] = [
    {
        "id": "capital",
        "keywords": ["capitale", "capital", "babban birni", "kwaara beeri"],
        "answer": {
            "fr": "La capitale du Niger est Niamey, au bord du fleuve Niger.",
            "dje": "Niger kwaara beeri ti Niamey, isa banda.",
            "ha": "Babban birnin Nijar shine Niamey, a gefen kogin Kwara.",
        },
    },
    {
        "id": "languages",
        "keywords": ["langue", "langues", "harshe", "harsuna", "sanni", "zarma", "haoussa"],
        "answer": {
            "fr": "Au Niger, le français est la langue officielle. Les langues nationales les plus parlées sont le haoussa, le zarma-songhay, le peul, le tamasheq, l'arabe, le kanuri et le gourmanchéma.",
            "dje": "Niger ra, faransi ti laabo sanni. Boro sanni beeriyaŋ ti hausa, zarma, fulan, tamaceq, arabe.",
            "ha": "A Nijar, Faransanci shine harshen hukuma. Manyan harsunan ƙasa sune Hausa, Zarma, Fulfulde, Tamasheq da Larabci.",
        },
    },
    {
        "id": "currency",
        "keywords": ["monnaie", "fcfa", "franc cfa", "kudi", "nooru"],
        "answer": {
            "fr": "La monnaie du Niger est le franc CFA (XOF).",
            "dje": "Niger nooru ti Franc CFA.",
            "ha": "Kuɗin Nijar shine Faran CFA (XOF).",
        },
    },
    {
        "id": "climate",
        "keywords": ["climat", "saison", "pluie", "yanayi", "damina"],
        "answer": {
            "fr": "Le Niger a un climat sahélien : saison des pluies de juin à septembre, puis longue saison sèche. Il fait très chaud de mars à mai.",
            "dje": "Niger handu ra hari ga ka zaari hinka june hinka september.",
            "ha": "Nijar tana da yanayin Sahel: damina daga Yuni zuwa Satumba, sannan lokacin rani mai zafi daga Maris zuwa Mayu.",
        },
    },
    {
        "id": "dialing",
        "keywords": ["indicatif", "+227", "227", "code pays", "lambar ƙasa"],
        "answer": {
            "fr": "L'indicatif téléphonique du Niger est +227.",
            "dje": "Niger telefon laabu lamba ti +227.",
            "ha": "Lambar wayar ƙasar Nijar ita ce +227.",
        },
    },
    {
        "id": "time_zone",
        "keywords": ["fuseau", "heure locale", "gmt", "utc"],
        "answer": {
            "fr": "Le Niger est à GMT+1 toute l'année (Africa/Niamey), sans changement d'heure.",
            "dje": "Niger waati ti GMT+1, hunkuna kulu.",
            "ha": "Nijar tana kan lokacin GMT+1 (Africa/Niamey).",
        },
    },
]

CATEGORY_TAGS: Dict[str, str] = {
    "pharmacy": "amenity=pharmacy",
    "hospital": "amenity=hospital",
    "clinic": "amenity=clinic",
    "fuel": "amenity=fuel",
    "market": "amenity=marketplace",
    "bank": "amenity=bank",
    "atm": "amenity=atm",
    "school": "amenity=school",
    "restaurant": "amenity=restaurant",
    "hotel": "tourism=hotel",
    "mosque": "amenity=place_of_worship",
    "police": "amenity=police",
    "bus": "amenity=bus_station",
    "water": "amenity=drinking_water",
}


# Repli des lettres africaines crochetées (haoussa, zarma, peul) vers l'alphabet
# latin de base : indispensable pour retrouver « karfe », « sanda », « yan »…
_AFRICAN_FOLD = str.maketrans(
    {
        "ɓ": "b", "ɗ": "d", "ƙ": "k", "ƴ": "y", "ɲ": "n", "ŋ": "n",
        "ɛ": "e", "ɔ": "o", "ə": "e", "ʒ": "j", "č": "c", "š": "s", "ž": "z",
        "ʼ": "'", "ʻ": "'", "’": "'", "‘": "'", "`": "'",
    }
)


def _normalize(value: str) -> str:
    import re
    import unicodedata

    text = str(value or "").lower().translate(_AFRICAN_FOLD)
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9' ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def find_fact(text: str) -> Optional[Trilingual]:
    """Cherche un fait pays (capitale, monnaie, climat…)."""
    haystack = _normalize(text)
    if not haystack:
        return None
    for fact in NIGER_FACTS:
        for keyword in fact["keywords"]:  # type: ignore[index]
            if _normalize(str(keyword)) in haystack:
                return fact["answer"]  # type: ignore[return-value]
    return None


def find_place(text: str) -> Optional[Dict[str, object]]:
    """Cherche un lieu connu (Niamey ou villes du Niger)."""
    haystack = _normalize(text)
    if not haystack:
        return None

    best: Optional[Dict[str, object]] = None
    best_score = 0
    for place in NIAMEY_LANDMARKS + NIGER_CITIES:
        candidates = [_normalize(str(place["name"]))] + [_normalize(str(alias)) for alias in place.get("aliases", [])]  # type: ignore[arg-type]
        for candidate in candidates:
            if len(candidate) >= 3 and candidate in haystack and len(candidate) > best_score:
                best_score = len(candidate)
                best = place
    return best


def trilingual(value: Trilingual, language: str) -> str:
    code = (language or "fr").lower().split("-")[0]
    if code in {"dje", "zar", "zarma"}:
        return value.get("dje") or value.get("fr", "")
    if code in {"ha", "hau", "hausa"}:
        return value.get("ha") or value.get("fr", "")
    return value.get("fr", "")
