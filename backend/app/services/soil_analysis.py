"""Deterministic soil analysis.

Compares confirmed values against reference ranges. Two rule sources:
1. Team 1's workbook (fertility_reference_ranges) when loaded — overrides below.
2. Built-in standard Indian soil-test fertility ratings, each labelled with a
   rule_id and source. A parameter with no applicable rule returns
   `insufficient_data` — never a guess.
"""
from __future__ import annotations

from typing import Optional

from app.models.recommendation import ParameterAssessment
from app.services.data_loader import loader

# Built-in standard ratings. Source: widely published Indian soil-test
# fertility ratings (ICAR / Muhr et al.). Workbook data overrides these.
STD_RULES: dict[str, dict] = {
    "pH": {
        "rule_id": "STD_PH_V1", "source": "standard agronomic pH classification",
        "bands": [(6.0, "acidic", "concern"), (7.5, "neutral", "ok"),
                  (8.5, "mildly alkaline", "concern"), (float("inf"), "alkaline / sodic risk", "concern")],
        "notes": {
            "acidic": "Acidic soil can lock up phosphorus and molybdenum; lime may help (confirm with a soil lab).",
            "neutral": "Good pH range for most crops; nutrients are generally available.",
            "mildly alkaline": "Slightly alkaline; watch micronutrient (zinc, iron) availability.",
            "alkaline / sodic risk": "High pH can cause nutrient lock-up and sodicity; get expert advice before sowing.",
        },
    },
    "EC": {
        "rule_id": "STD_EC_V1", "source": "standard soil salinity classification (dS/m)",
        "unit": "dS/m",
        "bands": [(0.8, "normal", "ok"), (1.6, "slightly saline", "concern"),
                  (2.5, "moderately saline", "concern"), (float("inf"), "highly saline", "concern")],
        "notes": {
            "normal": "Salinity is not a concern for most crops.",
            "slightly saline": "Sensitive crops may show stress; ensure good drainage.",
            "moderately saline": "Salinity may reduce yields; consider salt-tolerant varieties and leaching.",
            "highly saline": "High salinity is likely to hurt most crops; expert reclamation advice needed.",
        },
    },
    "OC": {
        "rule_id": "STD_OC_V1", "source": "standard Indian OC fertility rating (%)",
        "unit": "%",
        "bands": [(0.5, "low", "concern"), (0.75, "medium", "ok"), (float("inf"), "high", "ok")],
        "notes": {
            "low": "Low organic carbon: add farmyard manure / compost / green manure to build soil health.",
            "medium": "Moderate organic carbon; maintain with regular organic inputs.",
            "high": "Good organic carbon level; keep up current organic matter practices.",
        },
    },
    "N": {
        "rule_id": "STD_IN_FERTILITY_V1", "source": "standard Indian available-N rating (kg/ha)",
        "unit": "kg/ha",
        "bands": [(280, "low", "concern"), (560, "medium", "ok"), (float("inf"), "high", "ok")],
        "notes": {
            "low": "Nitrogen is low; the crop will likely need nitrogen fertiliser.",
            "medium": "Nitrogen is moderate; apply the recommended dose for your crop.",
            "high": "Nitrogen is high; avoid excess urea to prevent lodging and waste.",
        },
    },
    "P": {
        "rule_id": "STD_IN_FERTILITY_V1", "source": "standard Indian available-P rating (kg/ha)",
        "unit": "kg/ha",
        "bands": [(12.5, "low", "concern"), (25.0, "medium", "ok"), (float("inf"), "high", "ok")],
        "notes": {
            "low": "Phosphorus is low; phosphatic fertiliser is likely needed at sowing.",
            "medium": "Phosphorus is moderate; apply the maintenance dose.",
            "high": "Phosphorus is high; you can skip or reduce phosphatic fertiliser this season.",
        },
    },
    "K": {
        "rule_id": "STD_IN_FERTILITY_V1", "source": "standard Indian available-K rating (kg/ha)",
        "unit": "kg/ha",
        "bands": [(135, "low", "concern"), (335, "medium", "ok"), (float("inf"), "high", "ok")],
        "notes": {
            "low": "Potassium is low; potassic fertiliser will help grain filling and stalk strength.",
            "medium": "Potassium is moderate; apply the recommended dose.",
            "high": "Potassium is high; reduce potassic fertiliser this season.",
        },
    },
    "S": {
        "rule_id": "STD_MICRO_V1", "source": "standard available-S critical limit (ppm)",
        "unit": "ppm",
        "bands": [(10, "deficient", "concern"), (20, "medium", "ok"), (float("inf"), "sufficient", "ok")],
        "notes": {"deficient": "Sulphur is deficient; consider gypsum or sulphur-containing fertiliser.",
                  "medium": "Sulphur is adequate.", "sufficient": "Sulphur is sufficient."},
    },
    "Zn": {
        "rule_id": "STD_MICRO_V1", "source": "standard DTPA-Zn critical limit (ppm)",
        "unit": "ppm",
        "bands": [(0.6, "deficient", "concern"), (1.2, "medium", "ok"), (float("inf"), "sufficient", "ok")],
        "notes": {"deficient": "Zinc is deficient — common in paddy; zinc sulphate application is usually advised.",
                  "medium": "Zinc is adequate.", "sufficient": "Zinc is sufficient."},
    },
    "Fe": {
        "rule_id": "STD_MICRO_V1", "source": "standard DTPA-Fe critical limit (ppm)",
        "unit": "ppm",
        "bands": [(4.5, "deficient", "concern"), (float("inf"), "sufficient", "ok")],
        "notes": {"deficient": "Iron is deficient; foliar iron spray may help (confirm with lab).",
                  "sufficient": "Iron is sufficient."},
    },
    "Cu": {
        "rule_id": "STD_MICRO_V1", "source": "standard DTPA-Cu critical limit (ppm)",
        "unit": "ppm",
        "bands": [(0.2, "deficient", "concern"), (float("inf"), "sufficient", "ok")],
        "notes": {"deficient": "Copper is deficient; rarely limiting but worth noting.",
                  "sufficient": "Copper is sufficient."},
    },
    "Mn": {
        "rule_id": "STD_MICRO_V1", "source": "standard DTPA-Mn critical limit (ppm)",
        "unit": "ppm",
        "bands": [(2.0, "deficient", "concern"), (float("inf"), "sufficient", "ok")],
        "notes": {"deficient": "Manganese is deficient.", "sufficient": "Manganese is sufficient."},
    },
    "B": {
        "rule_id": "STD_MICRO_V1", "source": "standard hot-water-B critical limit (ppm)",
        "unit": "ppm",
        "bands": [(0.5, "deficient", "concern"), (1.0, "medium", "ok"), (float("inf"), "sufficient", "ok")],
        "notes": {"deficient": "Boron is deficient; borax application may be advised for flowering crops.",
                  "medium": "Boron is adequate.", "sufficient": "Boron is sufficient."},
    },
}

# ppm (mg/kg) -> kg/ha for a 0-15 cm soil layer (bulk density ~1.5 g/cc).
PPM_TO_KG_HA = 2.24

# ---------------------------------------------------------------------------
# Workbook fertility bands (Soil_Fertility_Rating_Chart). Built lazily from the
# loaded workbook; overrides the built-in ratings above for the parameters the
# chart covers (N, P, K, S, Zn, Fe, Cu, Mn, B). pH/EC/OC keep built-in rules.
# ---------------------------------------------------------------------------
_wb_rules_cache: dict | None = None
_wb_rules_df_id: int | None = None

# workbook parameter name -> (canonical param, form)
_WB_PARAM_MAP = {
    "available nitrogen (n)": ("N", None),
    "available phosphorus (p)": ("P", None),
    "available phosphorus (p2o5)": ("P", "P2O5"),
    "available potassium (k)": ("K", None),
    "available potassium (k2o)": ("K", "K2O"),
    "available sulphur (s)": ("S", None),
    "dtpa zinc (zn)": ("Zn", None),
    "dtpa iron (fe)": ("Fe", None),
    "dtpa copper (cu)": ("Cu", None),
    "dtpa manganese (mn)": ("Mn", None),
    "hot water boron (b)": ("B", None),
}


def _parse_band(text: str) -> tuple[float | None, float | None]:
    """'< 140' -> (None, 140); '> 700' -> (700, None); '140 - 280' -> (140, 280)."""
    import re
    t = str(text).strip().replace(",", "")
    m = re.match(r"<\s*([\d.]+)", t)
    if m:
        return None, float(m.group(1))
    m = re.match(r">\s*([\d.]+)", t)
    if m:
        return float(m.group(1)), None
    m = re.match(r"([\d.]+)\s*-\s*([\d.]+)", t)
    if m:
        return float(m.group(1)), float(m.group(2))
    raise ValueError(f"Unparseable band: {text!r}")


def _workbook_rules() -> dict:
    """Build rating rules from the workbook fertility chart (cached)."""
    global _wb_rules_cache, _wb_rules_df_id
    df = loader.get("fertility_reference_ranges")
    if df is None:
        return {}
    if _wb_rules_cache is not None and _wb_rules_df_id == id(df):
        return _wb_rules_cache
    rules: dict = {}
    for _, row in df.iterrows():
        key = _WB_PARAM_MAP.get(str(row.get("parameter", "")).strip().lower())
        if key is None:
            continue
        bands = []
        for cat in ("very_low", "low", "medium", "high", "very_high"):
            try:
                lo, hi = _parse_band(row[cat])
            except (ValueError, TypeError):
                continue
            status = "concern" if cat in ("very_low", "low", "very_high") else "ok"
            bands.append((cat, lo, hi, status))
        if not bands:
            continue
        notes = {cat: f"{cat.replace('_', ' ').title()}: {row.get('importance', '')}".strip()
                 for cat, _, _, _ in bands}
        rules[key] = {
            "rule_id": "WB_FERTILITY_V1",
            "source": f"Soil_Fertility_Rating_Chart workbook ({row.get('method', '')})".strip(),
            "unit": str(row.get("unit", "")),
            "bands": bands,
            "notes": notes,
        }
    _wb_rules_cache = rules
    _wb_rules_df_id = id(df)
    return rules


def normalise_for_rating(parameter: str, value: float, unit: Optional[str]) -> tuple[float, str, list[str]]:
    """Convert value to the rule's expected unit. Returns (value, unit, assumptions)."""
    rule = STD_RULES.get(parameter)
    assumptions: list[str] = []
    if rule is None or value is None:
        return value, unit or "", assumptions
    want = rule.get("unit", "")
    have = (unit or "").strip().lower()
    if parameter in ("N", "P", "K") and want == "kg/ha" and have in ("ppm", "mg/kg", "mg kg-1"):
        assumptions.append(f"Converted {value} {unit} to kg/ha using factor {PPM_TO_KG_HA} (0-15 cm layer assumption).")
        return value * PPM_TO_KG_HA, "kg/ha", assumptions
    if parameter == "EC" and have in ("ms/cm", "ms cm-1"):
        return value, "dS/m", assumptions  # 1 mS/cm == 1 dS/m
    return value, unit or want, assumptions


def assess(parameter: str, value: Optional[float], unit: Optional[str] = None,
           form: Optional[str] = None) -> ParameterAssessment:
    if value is None:
        return ParameterAssessment(
            parameter=parameter, value=None, unit=unit,
            status="insufficient_data",
            explanation=f"{parameter} was not measured or could not be read — left blank, never filled with zero.",
        )
    # Workbook chart takes precedence where it covers the parameter.
    wb = _workbook_rules()
    wb_key = (parameter, form) if (parameter, form) in wb else (parameter, None)
    if wb_key in wb:
        rule = wb[wb_key]
        norm_value, norm_unit, assumptions = normalise_for_rating(parameter, value, unit)
        category = status = "insufficient_data"
        for cat, lo, hi, st in rule["bands"]:
            if (lo is None or norm_value >= lo) and (hi is None or norm_value < hi):
                category, status = cat, st
                break
        explanation = rule["notes"].get(category, "")
        if assumptions:
            explanation += " Assumptions: " + " ".join(assumptions)
        return ParameterAssessment(
            parameter=parameter, value=value, unit=unit,
            category=category.replace("_", " "), status=status,
            explanation=explanation, rule_id=rule["rule_id"], source=rule["source"])
    rule = STD_RULES.get(parameter)
    if rule is None:
        return ParameterAssessment(
            parameter=parameter, value=value, unit=unit,
            status="insufficient_data",
            explanation=f"No interpretation rule available for {parameter}.",
        )
    norm_value, norm_unit, assumptions = normalise_for_rating(parameter, value, unit)
    category = status = "insufficient_data"
    for upper, cat, st in rule["bands"]:
        if norm_value < upper:
            category, status = cat, st
            break
    explanation = rule["notes"].get(category, "")
    if form in ("P2O5", "K2O") and parameter in ("P", "K"):
        explanation += f" (Reported as {form}; rating applied to the elemental-equivalent basis — confirm the lab's convention.)"
        assumptions.append(f"Value reported as {form}.")
    if assumptions:
        explanation += " Assumptions: " + " ".join(assumptions)
    return ParameterAssessment(
        parameter=parameter, value=value, unit=unit, category=category,
        status=status, explanation=explanation,
        rule_id=rule["rule_id"], source=rule["source"],
    )


def analyze(values: dict[str, dict]) -> tuple[list[ParameterAssessment], list[str]]:
    """values: {parameter: {'value': float|None, 'unit': str|None, 'form': str|None}}."""
    assessments = [assess(p, v.get("value"), v.get("unit"), v.get("form")) for p, v in values.items()]
    notes: list[str] = []
    if not loader.is_available("fertility_reference_ranges"):
        notes.append("Team 1's workbook is not loaded — using built-in standard ratings; workbook data will refine these when available.")
    concerns = [a.parameter for a in assessments if a.status == "concern"]
    if concerns:
        notes.append("Parameters needing attention: " + ", ".join(concerns) + ".")
    return assessments, notes
