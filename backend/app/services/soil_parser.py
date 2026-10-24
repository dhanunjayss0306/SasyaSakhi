"""Parse OCR text into soil parameters.

- Matches parameter labels (with common OCR variants), numeric values, units,
  and nutrient forms (P vs P2O5, K vs K2O).
- Repairs common OCR digit confusions (O->0, l/I->1, S->5) inside numeric tokens.
- Never invents a value: unreadable -> value=None, needs_review=True.
- Confidence is attached only when the OCR engine supplied word-level data.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from app.models.soil import FieldProvenance, SoilField

# Canonical parameters in the order they are searched (specific first so
# "organic carbon" wins over shorter labels, "P2O5" forms win over bare "P").
# Includes Team 1's SOIL_X canonical codes and common Telugu labels.
PARAMETERS: list[dict] = [
    {"name": "pH", "labels": [r"p\s*H", r"soil_ph\b", r"పీహెచ్"]},
    {"name": "EC", "labels": [r"electrical\s*conductivity", r"\bEC\b", r"soil_ec\b", r"ఈసీ"]},
    {"name": "OC", "labels": [r"organic\s*carbon", r"org\.?\s*carbon", r"\bOC\b",
                              r"soil_oc\b", r"సేంద్రీయ\s*కర్బనం"]},
    {"name": "N", "labels": [r"nitrogen", r"avail(?:able)?\.?\s*N\b", r"\bN\b",
                             r"soil_n\b", r"నత్రజని"]},
    {"name": "P", "labels": [r"phosphorus", r"భాస్వరం",
                             r"avail(?:able)?\.?\s*P(?:2\s*[O0]+\s*5)?\b",
                             r"\bP\s*2\s*[O0]+\s*5\b", r"soil_p2o5\b", r"\bP\b"],
     "forms": [r"P\s*2\s*[O0]+\s*5", r"P2O5", r"P205", r"P2005", r"soil_p2o5"]},
    {"name": "K", "labels": [r"potassium", r"పొటాషియం", r"పొటాష్",
                             r"avail(?:able)?\.?\s*K(?:2\s*[O0]+)?\b",
                             r"\bK\s*2\s*[O0]+\b", r"soil_k2o\b", r"\bK\b"],
     "forms": [r"K\s*2\s*[O0]+", r"K2O", r"K20", r"soil_k2o"]},
    {"name": "S", "labels": [r"sulphur", r"sulfur", r"గంధకం",
                             r"avail(?:able)?\.?\s*S\b", r"\bS\b", r"soil_s\b"]},
    {"name": "Zn", "labels": [r"zinc", r"జింక్", r"\bZn\b", r"soil_zn\b"]},
    {"name": "Fe", "labels": [r"iron", r"[Il1]ron", r"ఇనుము", r"\bFe\b", r"soil_fe\b"]},
    {"name": "Cu", "labels": [r"copper", r"\bCu\b"]},
    {"name": "Mn", "labels": [r"manganese", r"\bMn\b"]},
    {"name": "B", "labels": [r"boron", r"\bB\b"]},
]

# Canonical unit per parameter, used when the report prints no unit and as the
# comparison basis for Team 1's ground-truth convention.
CANONICAL_UNITS: dict[str, Optional[str]] = {
    "pH": None, "EC": "dS/m", "OC": "%",
    "N": "kg/ha", "P": "kg/ha", "K": "kg/ha",
    "S": "ppm", "Zn": "ppm", "Fe": "ppm", "Cu": "ppm", "Mn": "ppm", "B": "ppm",
}

UNIT_PATTERNS: list[tuple[str, str]] = [
    (r"dS\s*/\s*m", "dS/m"),
    (r"mS\s*/\s*cm", "mS/cm"),
    (r"kg\s*/\s*ha", "kg/ha"),
    (r"కి\.?\s*గ్రా\s*/\s*హె", "kg/ha"),  # Telugu script kg/ha
    (r"mg\s*/\s*kg", "mg/kg"),
    (r"ppm", "ppm"),
    (r"%", "%"),
]

# OCR digit confusions, applied ONLY inside numeric tokens.
DIGIT_FIX = str.maketrans({"O": "0", "o": "0", "l": "1", "I": "1", "i": "1", "S": "5", "s": "5"})

VALUE_RE = r"(?P<qsign>[<>]?)\s*(?P<num>[0-9][0-9OoIlIS.,]*)"
# Separator between a label and its value: optional closing paren (for labels
# like "(P2O5)"), then ':', '=', '-', or plain whitespace.
SEPARATOR_RE = r"\)?\s*[:=\-–—]?\s*"


def clean_number(token: str) -> Optional[float]:
    """Turn an OCR numeric token into a float. Returns None if not parseable."""
    t = token.strip().translate(DIGIT_FIX).replace(" ", "")
    if not t:
        return None
    # Decimal comma: "6,8" -> 6.8 ; thousands: "1,200.5" -> 1200.5
    if "," in t and "." not in t:
        if re.fullmatch(r"\d+,\d{1,2}", t):
            t = t.replace(",", ".")
        else:
            t = t.replace(",", "")
    else:
        t = t.replace(",", "")
    # Collapse accidental double dots from speckles: keep first dot.
    if t.count(".") > 1:
        first, rest = t.split(".", 1)
        t = first + "." + rest.replace(".", "")
    try:
        return float(t)
    except ValueError:
        return None


def detect_unit(text_after: str) -> Optional[str]:
    for pattern, canonical in UNIT_PATTERNS:
        if re.match(pattern, text_after.strip(), re.IGNORECASE):
            return canonical
    return None


def detect_form(label_text: str, spec: dict) -> Optional[str]:
    for fpat in spec.get("forms", []):
        if re.search(fpat, label_text, re.IGNORECASE):
            return "P2O5" if spec["name"] == "P" else "K2O"
    # Bare elemental label
    if re.search(rf"\b{spec['name']}\b", label_text):
        return spec["name"]
    return None


@dataclass
class ParseResult:
    fields: list[SoilField] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)


def parse_soil_text(text: str, words: Optional[list[dict]] = None) -> ParseResult:
    """Extract soil fields from OCR text. `words` is optional Tesseract word data
    [{'text':..., 'conf':...}] used only to attach real confidence values."""
    result = ParseResult()
    if not text or not text.strip():
        result.missing = [p["name"] for p in PARAMETERS]
        return result

    used_spans: list[tuple[int, int]] = []

    def overlaps(start: int, end: int) -> bool:
        return any(s < end and start < e for s, e in used_spans)

    for spec in PARAMETERS:
        name = spec["name"]
        label_pat = "|".join(f"(?:{lbl})" for lbl in spec["labels"])
        pattern = re.compile(
            rf"(?P<label>{label_pat})(?P<sep>{SEPARATOR_RE})?(?P<qual>{VALUE_RE})?",
            re.IGNORECASE,
        )
        found: Optional[SoilField] = None
        for m in pattern.finditer(text):
            start, end = m.span()
            if overlaps(start, end):
                continue
            raw_value = m.group("num") or ""
            if not raw_value:
                continue  # label without a readable number -> keep looking
            value = clean_number(raw_value)
            after = text[m.end(): m.end() + 12]
            unit = detect_unit(after) or CANONICAL_UNITS.get(name)
            form = detect_form(m.group("label"), spec)
            conf = _word_confidence(words, raw_value) if words else None
            found = SoilField(
                parameter=name,
                label=m.group("label").strip(),
                value=value,
                unit=unit,
                canonical_unit=CANONICAL_UNITS.get(name),
                form=form,
                confidence=conf,
                needs_review=True,  # OCR output is never trusted without review
                provenance=FieldProvenance.EXTRACTED,
                original_text=text[max(0, start - 10): m.end() + 12].strip(),
            )
            used_spans.append((start, m.end()))
            break
        if found:
            result.fields.append(found)
        else:
            result.missing.append(name)
    return result


def _word_confidence(words: list[dict], raw_value: str) -> Optional[float]:
    """Attach Tesseract's own confidence for the matched numeric token, if the
    engine provided word data. Never guessed."""
    target = raw_value.strip().translate(DIGIT_FIX).replace(" ", "")
    for w in words:
        wt = (w.get("text") or "").strip().translate(DIGIT_FIX).replace(" ", "")
        if wt and (wt == target or target in wt):
            c = w.get("conf")
            return float(c) if isinstance(c, (int, float)) and c >= 0 else None
    return None
