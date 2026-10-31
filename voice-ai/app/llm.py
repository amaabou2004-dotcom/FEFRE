"""
ISA — Modèle de langage local (Ollama / llama.cpp)
==================================================
Le serveur n'exige AUCUN modèle : si Ollama n'est pas installé, ISA répond avec
ses règles déterministes (les mêmes que dans le site web). Quand Ollama tourne,
les questions ouvertes (« explique-moi… », « traduis… ») obtiennent une réponse
en zarma, haoussa ou français — sans qu'aucune donnée ne quitte le Niger.

Modèles conseillés selon la machine :
  • 4 Go de RAM   : `qwen2.5:1.5b`, `llama3.2:1b`
  • 8 Go de RAM   : `llama3.2:3b` (recommandé), `qwen2.5:3b`
  • 16 Go+ / GPU  : `qwen2.5:7b-instruct`, `llama3.1:8b`
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Dict, List, Optional

from .config import SETTINGS


def _post_json(url: str, payload: Dict[str, object], timeout: int) -> Dict[str, object]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _get_json(url: str, timeout: int = 5) -> Dict[str, object]:
    with urllib.request.urlopen(url, timeout=timeout) as response:  # noqa: S310 - URL locale de confiance
        return json.loads(response.read().decode("utf-8"))


def ollama_available() -> bool:
    if not SETTINGS.ollama_url:
        return False
    try:
        _get_json(f"{SETTINGS.ollama_url.rstrip('/')}/api/tags", timeout=3)
        return True
    except (urllib.error.URLError, OSError, ValueError):
        return False


def llamacpp_available() -> bool:
    if not SETTINGS.llamacpp_url:
        return False
    try:
        _get_json(f"{SETTINGS.llamacpp_url.rstrip('/')}/health", timeout=3)
        return True
    except (urllib.error.URLError, OSError, ValueError):
        return False


def available_models() -> List[str]:
    try:
        payload = _get_json(f"{SETTINGS.ollama_url.rstrip('/')}/api/tags", timeout=4)
        models = payload.get("models") or []
        return [str(item.get("name")) for item in models if item.get("name")]
    except Exception:
        return []


def capabilities() -> Dict[str, object]:
    ollama_ok = ollama_available()
    return {
        "ollama": ollama_ok,
        "llamacpp": llamacpp_available(),
        "model": SETTINGS.ollama_model if ollama_ok else None,
        "models_installed": available_models() if ollama_ok else [],
    }


def generate(
    prompt: str,
    system_prompt: str,
    history: Optional[List[Dict[str, str]]] = None,
    model: Optional[str] = None,
) -> Optional[Dict[str, object]]:
    """
    Génère une réponse avec le modèle local. Retourne None si aucun moteur
    n'est disponible : l'appelant retombe alors sur les règles hors-ligne.
    """
    messages: List[Dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for item in (history or [])[-6:]:
        role = "user" if str(item.get("role")) == "user" else "assistant"
        content = str(item.get("text") or "")[:1200]
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": prompt[:1200]})

    # 1) Ollama
    if ollama_available():
        try:
            payload = _post_json(
                f"{SETTINGS.ollama_url.rstrip('/')}/api/chat",
                {
                    "model": model or SETTINGS.ollama_model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": SETTINGS.llm_temperature,
                        "num_predict": SETTINGS.llm_max_tokens,
                        "top_p": 0.9,
                    },
                },
                SETTINGS.llm_timeout,
            )
            message = payload.get("message") or {}
            text = str(message.get("content") or "").strip()
            if text:
                return {"reply": text, "engine": "ollama", "model": str(payload.get("model") or SETTINGS.ollama_model)}
        except Exception as error:
            print(f"[ISA llm] Ollama en échec : {error}")

    # 2) llama.cpp (serveur HTTP compatible OpenAI)
    if llamacpp_available():
        try:
            payload = _post_json(
                f"{SETTINGS.llamacpp_url.rstrip('/')}/v1/chat/completions",
                {
                    "messages": messages,
                    "temperature": SETTINGS.llm_temperature,
                    "max_tokens": SETTINGS.llm_max_tokens,
                    "stream": False,
                },
                SETTINGS.llm_timeout,
            )
            choices = payload.get("choices") or []
            if choices:
                text = str((choices[0].get("message") or {}).get("content") or "").strip()
                if text:
                    return {"reply": text, "engine": "llama.cpp", "model": model or "local"}
        except Exception as error:
            print(f"[ISA llm] llama.cpp en échec : {error}")

    return None


def translate(text: str, target: str, source: str = "auto") -> Optional[str]:
    """Traduction locale fr ↔ zarma ↔ haoussa (si un modèle est installé)."""
    names = {"fr": "français", "dje": "zarma (Zarmaciine)", "ha": "haoussa (Hausa)", "en": "anglais"}
    target_name = names.get(target, target)
    source_name = names.get(source, "la langue d'origine") if source != "auto" else "la langue d'origine"

    system = (
        "Tu es un traducteur professionnel nigérien. Tu traduis entre le français, "
        "le zarma (Zarmaciine) et le haoussa. Tu utilises des mots simples et courants. "
        "Tu ne réponds qu'avec la traduction, sans commentaire ni guillemets."
    )
    result = generate(f"Traduis de {source_name} vers {target_name} :\n\n{text}", system)
    if not result:
        return None
    reply = str(result.get("reply") or "").strip()
    return reply or None
