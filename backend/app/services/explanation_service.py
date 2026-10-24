"""AI explanation service.

The AI (or template fallback) EXPLAINS results — it never invents soil values,
sources, doses, or calculations. All numbers in an explanation come from the
supplied context. If no AI key is configured, deterministic templates answer in
English or Telugu.
"""
from __future__ import annotations

import logging
from typing import Optional

from app import config

log = logging.getLogger("soilsaathi.explanation")

SYSTEM_PROMPT = (
    "You explain soil-test results to Indian farmers in very simple language. "
    "RULES: Use ONLY the numbers and results given in the user message. Never invent "
    "soil values, fertiliser doses, sources, or calculations. If data is missing, say "
    "so plainly and suggest confirming with an agriculture officer. Keep answers short."
)

TE = {
    "ph": "మీ నేల pH {v}. {note}",
    "ph_acidic": "నేల ఆమ్లంగా ఉంది. భాస్వరం అందకపోవచ్చు.",
    "ph_neutral": "ఇది చాలా పంటలకు మంచి స్థాయి.",
    "ph_alkaline": "నేల క్షారంగా ఉంది. జింక్, ఇనుము అందకపోవచ్చు.",
    "missing": "ఈ విలువ అందుబాటులో లేదు.",
    "fallback": "మీ ప్రశ్నకు సంబంధించిన లెక్కించిన ఫలితం ఇంకా అందుబాటులో లేదు. వ్యవసాయ అధికారిని సంప్రదించండి.",
}


def template_answer(message: str, language: str, context: Optional[dict]) -> tuple[str, list[str]]:
    """Deterministic fallback. Answers from context only."""
    lang = "te" if language.lower().startswith("te") else "en"
    ctx = context or {}
    values = ctx.get("confirmed_values", ctx.get("values", {})) if isinstance(ctx, dict) else {}
    msg = message.lower()

    def val(param: str) -> Optional[float]:
        v = values.get(param) or values.get(param.lower())
        if isinstance(v, dict):
            return v.get("value")
        return v if isinstance(v, (int, float)) else None

    source_ids: list[str] = []
    if "ph" in msg or "పిహెచ్" in message:
        v = val("pH")
        if v is None:
            return (TE["missing"] if lang == "te" else "Soil pH was not measured in this report.", source_ids)
        if lang == "te":
            note = TE["ph_acidic"] if v < 6.0 else TE["ph_neutral"] if v <= 7.5 else TE["ph_alkaline"]
            return TE["ph"].format(v=v, note=note), ["STD_PH_V1"]
        note = ("acidic" if v < 6.0 else "neutral — good for most crops" if v <= 7.5 else "alkaline")
        return (f"Your soil pH is {v}, which is {note}. " +
                ("Acidic soil can lock up phosphorus; a lab can advise on lime." if v < 6.0 else
                 "Most nutrients stay available in this range." if v <= 7.5 else
                 "High pH can lock up zinc and iron; get expert advice before sowing."),
                ["STD_PH_V1"])
    if any(k in msg for k in ("nitrogen", "phosphorus", "potassium", "fertil", "ఎరువు")):
        fert = ctx.get("fertilizer") if isinstance(ctx, dict) else None
        if isinstance(fert, dict) and fert.get("items"):
            lines = [f"{i['product']}: {i['quantity']} {i['unit']}" for i in fert["items"]]
            basis = fert.get("dose_basis", "")
            warn = (" (general reference — not soil-test based)" if basis == "general_reference" else "")
            head = "సిఫార్సు చేసిన ఎరువులు:" if lang == "te" else "Recommended fertilisers:"
            return head + warn + " " + "; ".join(lines) + ".", [fert.get("rule_id") or "GENERAL_RDF"]
        return (TE["fallback"] if lang == "te"
                else "No fertiliser recommendation has been calculated for this report yet.", source_ids)
    if any(k in msg for k in ("crop", "పంట", "suitable")):
        suits = ctx.get("crop_suitability") if isinstance(ctx, dict) else None
        if isinstance(suits, list) and suits:
            best = suits[0]
            if lang == "te":
                return (f"{best.get('crop')}: {best.get('status')}. {best.get('explanation','')}", best.get("rule_ids", []))
            return (f"{best.get('crop')}: {best.get('status')}. {best.get('explanation','')}", best.get("rule_ids", []))
    # Generic: summarise what is known.
    known = [f"{p}={values[p]['value'] if isinstance(values[p], dict) else values[p]}"
             for p in ("pH", "EC", "OC", "N", "P", "K") if val(p) is not None]
    if lang == "te":
        base = "మీ నేల నివేదిక ప్రకారం: " + (", ".join(known) + "." if known else TE["missing"])
        return base + " మరిన్ని వివరాల కోసం 'pH అంటే ఏమిటి?' అని అడగండి.", source_ids
    base = "From your soil report: " + (", ".join(known) + "." if known else "no values confirmed yet.")
    return base + " Ask e.g. 'What does my soil pH mean?' for detail.", source_ids


def ai_answer(message: str, language: str, context: Optional[dict]) -> Optional[tuple[str, list[str]]]:
    """Call the configured OpenAI-compatible API. Returns None if unavailable."""
    if not config.AI_API_KEY:
        return None
    import httpx

    lang_name = "Telugu" if language.lower().startswith("te") else "English"
    user_msg = (f"Language: {lang_name}. Farmer's question: {message}\n"
                f"Context (use only these numbers/results): {context}")
    try:
        r = httpx.post(
            f"{config.AI_API_BASE.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {config.AI_API_KEY}"},
            json={"model": config.AI_MODEL,
                  "messages": [{"role": "system", "content": SYSTEM_PROMPT},
                               {"role": "user", "content": user_msg}],
                  "max_tokens": 400, "temperature": 0.2},
            timeout=30,
        )
        r.raise_for_status()
        text = r.json()["choices"][0]["message"]["content"].strip()
        return text, []
    except Exception as exc:
        log.warning("AI provider failed, falling back to templates: %s", exc)
        return None


def answer(message: str, language: str = "en", context: Optional[dict] = None) -> tuple[str, list[str], str]:
    """Returns (answer, source_ids, mode). Mode is 'ai' or 'template'."""
    ai = ai_answer(message, language, context)
    if ai is not None:
        return ai[0], ai[1], "ai"
    text, sources = template_answer(message, language, context)
    return text, sources, "template"
