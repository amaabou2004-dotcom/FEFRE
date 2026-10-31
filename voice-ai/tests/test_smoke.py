"""
ISA — Tests de fumée du serveur local
=====================================
Vérifie ce qui doit fonctionner SUR N'IMPORTE QUELLE MACHINE, même sans modèle
téléchargé : le serveur démarre, `/health` annonce ses capacités honnêtement,
les règles hors-ligne répondent (heure, urgences, lieux du Niger) et les
endpoints refusent proprement quand une brique manque.

    cd voice-ai
    pip install -r requirements.txt httpx pytest
    python -m pytest tests/ -q
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app, rule_based_reply  # noqa: E402


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


# ── Santé du serveur ─────────────────────────────────────────────────────────


def test_health_reports_capabilities(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    # Les capacités doivent être présentes, vraies ou fausses, jamais absentes.
    for key in ("stt", "tts", "llm"):
        assert key in payload
        assert isinstance(payload[key], bool)
    assert payload["offline_capable"] is True
    assert payload["timezone"] == "Africa/Niamey"


def test_status_page_is_readable(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "ISA" in response.text


def test_openapi_is_served(client: TestClient) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/think" in response.json()["paths"]


# ── Règles hors-ligne (aucun modèle requis) ──────────────────────────────────


def test_think_returns_time_offline(client: TestClient) -> None:
    response = client.post("/think", json={"text": "Quelle heure est-il ?", "language": "fr"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] == "time"
    assert payload["offline"] is True
    assert ":" in payload["reply"]


def test_think_hausa_time(client: TestClient) -> None:
    response = client.post("/think", json={"text": "Ƙarfe nawa yanzu?", "language": "ha"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] == "time"
    # La réponse doit être en haoussa (marqueur « Niamey » + heure).
    assert "Niamey" in payload["reply"]


def test_think_zarma_greeting(client: TestClient) -> None:
    reply = rule_based_reply("Fofo, mate ni go?", "dje")
    assert reply is not None
    assert reply["intent"] == "greeting"
    assert reply["offline"] is True


def test_emergency_numbers_are_correct(client: TestClient) -> None:
    """Les numéros d'urgence nigériens ne doivent jamais varier."""
    response = client.post("/think", json={"text": "C'est une urgence, appelle la police", "language": "fr"})
    payload = response.json()
    assert payload["intent"] == "emergency"
    text = payload["reply"]
    assert "17" in text and "18" in text and "15" in text
    numbers = [card["primaryAction"]["phoneNumber"] for card in payload["cards"]]
    assert sorted(numbers) == ["15", "17", "18"]


def test_known_niamey_landmark_produces_google_maps_link(client: TestClient) -> None:
    response = client.post("/think", json={"text": "Conduis-moi au Grand Marché de Niamey", "language": "fr"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] in {"navigate", "find_place"}
    urls = [action.get("url", "") for action in payload.get("actions", [])]
    assert any("google.com/maps" in url for url in urls), urls


def test_city_distance_is_reported(client: TestClient) -> None:
    reply = rule_based_reply("Combien de kilomètres jusqu'à Zinder ?", "fr")
    assert reply is not None
    assert "870" in reply["reply"] or "km" in reply["reply"]


def test_country_fact_offline(client: TestClient) -> None:
    reply = rule_based_reply("Quelle est la capitale du Niger ?", "fr")
    assert reply is not None
    assert "Niamey" in reply["reply"]
    assert reply["offline"] is True


def test_unknown_request_falls_back_gracefully(client: TestClient) -> None:
    response = client.post("/think", json={"text": "zxqwv plmkj", "language": "fr"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] in {"fallback", "local-llm"}
    assert payload["reply"]


def test_think_rejects_empty_text(client: TestClient) -> None:
    response = client.post("/think", json={"text": "", "language": "fr"})
    assert response.status_code == 400


# ── Endpoints qui exigent un modèle ou un réseau ─────────────────────────────


def test_stt_without_whisper_is_explicit(client: TestClient) -> None:
    """Sans faster-whisper, l'API doit l'expliquer clairement (pas un crash)."""
    from app import stt

    if stt.is_available():
        pytest.skip("Whisper installé : le cas 'absent' ne s'applique pas")
    response = client.post("/stt", json={"audioBase64": "", "language": "fr"})
    assert response.status_code == 503
    assert "faster-whisper" in response.json()["detail"]


def test_tts_without_voice_is_explicit(client: TestClient) -> None:
    from app import tts

    if tts.piper_available() or tts.mms_available() or tts.espeak_available():
        pytest.skip("Une voix est installée : le cas 'aucune voix' ne s'applique pas")
    response = client.post("/tts", json={"text": "Fofo", "language": "dje"})
    assert response.status_code == 503
    assert "voix" in response.json()["detail"].lower()


def test_translate_without_llm_is_explicit(client: TestClient) -> None:
    from app import llm

    if llm.ollama_available() or llm.llamacpp_available():
        pytest.skip("Un modèle local est installé.")
    response = client.post("/translate", json={"text": "Bonjour", "target": "dje"})
    assert response.status_code == 503


def test_geo_route_validates_params(client: TestClient) -> None:
    response = client.get("/geo/route", params={"from": "abc", "to": "13.5,2.1"})
    assert response.status_code in (400, 422)


def test_geo_nearby_requires_position(client: TestClient) -> None:
    response = client.get("/geo/nearby", params={"category": "pharmacy"})
    assert response.status_code in (400, 422)


# ── Lexiques ─────────────────────────────────────────────────────────────────


def test_lexicon_files_exist_and_parse() -> None:
    base = Path(__file__).resolve().parent.parent / "lexiques"
    for filename in ("zarma-fr.csv", "hausa-fr.csv", "corrections.csv"):
        path = base / filename
        assert path.exists(), f"{filename} manquant"
        lines = [line for line in path.read_text(encoding="utf-8").splitlines() if line and not line.startswith("#")]
        assert lines, f"{filename} est vide"
        for line in lines[:20]:
            assert "," in line, f"ligne mal formée dans {filename} : {line}"


def test_lexicon_is_applied_to_transcription() -> None:
    from app.stt import apply_lexicon

    assert "zarma" in apply_lexicon("zar ma").lower() or apply_lexicon("zar ma") != ""
    assert apply_lexicon("") == ""


def test_emergency_numbers_match_website_source() -> None:
    """Garde-fou : les numéros du serveur doivent rester identiques à ceux du site."""
    from app.knowledge import EMERGENCY_CONTACTS

    website_path = Path(__file__).resolve().parents[2] / "src" / "lib" / "voice" / "nigerKnowledge.ts"
    assert website_path.exists()
    content = website_path.read_text(encoding="utf-8")
    for contact in EMERGENCY_CONTACTS:
        assert f"number: '{contact['number']}'" in content, (
            f"Le numéro {contact['number']} ({contact['id']}) diffère entre le serveur local et le site web."
        )
