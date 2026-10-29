"""ML crop-suitability service (v2 model).

What this is, in plain words
----------------------------
For each crop, agronomists publish the soil it likes: an ideal pH range, a
maximum salt level (EC), a minimum organic carbon, and critical levels for
N, P, K, S, Zn, Fe and B below which the crop goes hungry. This service
measures how far the farmer's soil is from those ideals — the "deficits" —
and feeds those 10 gaps to a RandomForest model trained on the 800-row
crop-nutrient workbook. The model returns one suitability score (0-100).
A perfect soil (no gaps) scores about 94, never 100, because the model
learned that real fields always carry some risk.

Honesty rules (same as the rest of the app)
-------------------------------------------
- Fertilizer doses NEVER come from this model. Doses stay rules-based
  (STCR workbook). The model only adds a comparative score + reasons.
- A missing soil value is never filled with zero or an average. If any
  of the 10 inputs is missing, that crop gets "insufficient_data" and the
  missing nutrients are listed.
- P and K are converted to the oxide basis (P2O5, K2O) exactly like the
  rules engine does, because the crop-requirement book is written that way.
  A value already labelled P2O5/K2O is used as-is.
"""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Optional

from app import config

log = logging.getLogger("soilsaathi.ml")

# Exact feature order the v2 model was trained with (model.feature_names_in_).
FEATURE_ORDER = [
    "ph_dist", "ec_over", "oc_def", "n_def", "p_def",
    "k_def", "s_def", "zn_def", "fe_def", "b_def",
]

# Prototype crops -> crop-requirement book entries (Kharif paddy, irrigated
# Bt cotton, Guntur Teja chilli — the varieties the workbook models first).
CROP_MAP = {
    "paddy": "Rice (Paddy - Kharif Transp)",
    "cotton": "Cotton (Bt Hybrid Irrigated)",
    "chilli": "Chilli (Guntur Teja Hybrid)",
}

# Soil parameter -> (requirement field, unit note) for deficit computation.
_DEFICIT_SPECS = {
    "ph_dist": ("pH", "Optimum_pH_Min", "Optimum_pH_Max"),
    "ec_over": ("EC", "EC_Tolerance_Max_dSm", None),
    "oc_def": ("OC", "Min_Soil_OC_pct", None),
    "n_def": ("N", "Critical_Soil_N_kg_ha", None),
    "p_def": ("P", "Critical_Soil_P2O5_kg_ha", None),
    "k_def": ("K", "Critical_Soil_K2O_kg_ha", None),
    "s_def": ("S", "Critical_Soil_S_ppm", None),
    "zn_def": ("Zn", "Critical_Soil_Zn_ppm", None),
    "fe_def": ("Fe", "Critical_Soil_Fe_ppm", None),
    "b_def": ("B", "Critical_Soil_B_ppm", None),
}

_GAP_SENTENCES = {
    "ph_dist": "pH is {gap} outside {crop}'s ideal range ({lo}-{hi}).",
    "ec_over": "Salt level (EC) is {gap} dS/m above {crop}'s tolerance.",
    "oc_def": "Organic carbon is {gap}% below the minimum {crop} needs.",
    "n_def": "Nitrogen is {gap} kg/ha below {crop}'s critical level.",
    "p_def": "Phosphorus (P2O5) is {gap} kg/ha below {crop}'s critical level.",
    "k_def": "Potassium (K2O) is {gap} kg/ha below {crop}'s critical level.",
    "s_def": "Sulphur is {gap} ppm below {crop}'s critical level.",
    "zn_def": "Zinc is {gap} ppm below {crop}'s critical level.",
    "fe_def": "Iron is {gap} ppm below {crop}'s critical level.",
    "b_def": "Boron is {gap} ppm below {crop}'s critical level.",
}

_model = None
_requirements: Optional[list[dict]] = None


def _model_dir() -> Path:
    return Path(config.BASE_DIR) / "data" / "ml"


def _load():
    global _model, _requirements
    if _model is not None and _requirements is not None:
        return _model, _requirements
    try:
        import sklearn  # noqa: F401  (required to unpickle the model)
    except ImportError as exc:
        raise RuntimeError(
            "ML model unavailable: scikit-learn is not installed. "
            "Add scikit-learn to requirements.txt and reinstall."
        ) from exc
    model_path = _model_dir() / "suitability_model_v2.pkl"
    req_path = _model_dir() / "crop_requirements.pkl"
    if not model_path.is_file() or not req_path.is_file():
        raise RuntimeError(
            "ML model files missing from backend/data/ml/ "
            "(suitability_model_v2.pkl, crop_requirements.pkl)."
        )
    with open(model_path, "rb") as f:
        _model = pickle.load(f)
    with open(req_path, "rb") as f:
        _requirements = pickle.load(f)
    return _model, _requirements


def _num(values: dict, param: str) -> Optional[float]:
    entry = values.get(param) or {}
    v = entry.get("value") if isinstance(entry, dict) else None
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _form(values: dict, param: str) -> str:
    entry = values.get(param) or {}
    form = entry.get("form") if isinstance(entry, dict) else None
    return (form or "").upper()


def _to_oxide(values: dict, param: str, value: float) -> float:
    """Convert elemental P/K to the oxide basis the book uses."""
    if param == "P" and _form(values, "P") != "P2O5":
        return value * 2.29
    if param == "K" and _form(values, "K") != "K2O":
        return value * 1.20
    return value


def _deficits(values: dict, req: dict) -> tuple[dict[str, float], list[str]]:
    """Return (feature dict, missing parameters). No value is ever invented."""
    feats: dict[str, float] = {}
    missing: list[str] = []
    for feat, (param, lo_field, hi_field) in _DEFICIT_SPECS.items():
        v = _num(values, param)
        if v is None:
            missing.append(param)
            continue
        if feat == "ph_dist":
            lo, hi = float(req[lo_field]), float(req[hi_field])
            feats[feat] = 0.0 if lo <= v <= hi else min(abs(v - lo), abs(v - hi))
        elif feat == "ec_over":
            feats[feat] = max(0.0, v - float(req[lo_field]))
        elif feat == "oc_def":
            feats[feat] = max(0.0, float(req[lo_field]) - v)
        else:
            target = float(req[lo_field])
            feats[feat] = max(0.0, target - _to_oxide(values, param, v))
    return feats, missing


def _gap_notes(feats: dict[str, float], req: dict, crop: str) -> list[str]:
    notes = []
    for feat, gap in feats.items():
        if gap <= 0:
            continue
        template = _GAP_SENTENCES[feat]
        if feat == "ph_dist":
            notes.append(template.format(
                gap=round(gap, 2), crop=crop,
                lo=req["Optimum_pH_Min"], hi=req["Optimum_pH_Max"]))
        else:
            notes.append(template.format(gap=round(gap, 2), crop=crop))
    return notes


def predict_crop(crop_key: str, values: dict) -> dict:
    """Score one crop. values maps parameter -> {value, unit, form}."""
    model, requirements = _load()
    book_name = CROP_MAP.get(crop_key)
    req = next((r for r in requirements if r["Crop_Name"] == book_name), None)
    if req is None:
        return {"crop": crop_key, "status": "insufficient_data",
                "score": None, "gaps": [],
                "missing": [f"No requirement data for {crop_key}."],
                "explanation": "No requirement data for this crop in the model book."}
    feats, missing = _deficits(values, req)
    if missing:
        return {"crop": crop_key, "status": "insufficient_data",
                "score": None, "gaps": [],
                "missing": missing,
                "explanation": (
                    "The ML score needs all 10 soil values. Missing: "
                    + ", ".join(missing)
                    + ". The model never guesses a missing value.")}
    # Predict with a named DataFrame: the model was fitted with feature
    # names, and passing a plain list raises a sklearn warning every call.
    import pandas as pd

    ordered = [feats[f] for f in FEATURE_ORDER]
    frame = pd.DataFrame([ordered], columns=FEATURE_ORDER)
    raw = float(model.predict(frame)[0])
    score = round(max(0.0, min(100.0, raw)), 1)
    gaps = _gap_notes(feats, req, crop_key)
    if score >= 75:
        band = "high"
        expl = (f"ML suitability {score}/100: the soil is close to what "
                f"{crop_key} needs; the gaps below are small.")
    elif score >= 50:
        band = "medium"
        expl = (f"ML suitability {score}/100: {crop_key} can grow here, but "
                f"the gaps below need corrective action first.")
    else:
        band = "low"
        expl = (f"ML suitability {score}/100: the soil is far from what "
                f"{crop_key} needs; fix the gaps below before sowing it.")
    return {"crop": crop_key, "status": band, "score": score,
            "gaps": gaps, "missing": [], "explanation": expl}


def predict_all(values: dict) -> list[dict]:
    return [predict_crop(crop, values) for crop in CROP_MAP]
