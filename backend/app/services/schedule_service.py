"""Prototype fertilizer application schedule.

Built ONLY from Team 1's Crop_Nutrient_Requirements values: N split
percentages (basal / tillering / panicle), crop duration window, and the N
dose. Exact days-after-sowing are NOT in the dataset and are never invented —
the schedule is stage-based and clearly labelled as prototype level.
"""
from __future__ import annotations

from typing import Optional

from app.services.data_loader import loader
from app.services.fertilizer_calculator import _crop_name_matches, PRODUCTS

STAGES = [
    ("N_Split_Basal_pct", "Basal (at sowing/transplanting)"),
    ("N_Split_Tillering_pct", "Tillering"),
    ("N_Split_Panicle_pct", "Panicle initiation"),
]

PROTOTYPE_LABEL = (
    "PROTOTYPE schedule: stage names, split percentages and the duration window "
    "come from Team 1's dataset. Exact days-after-sowing per split are NOT in the "
    "dataset and are intentionally left out — they will be added later, not invented."
)


def _crop_row(crop: str) -> Optional[dict]:
    df = loader.get("crop_nutrient_requirements")
    if df is None:
        return None
    cols = {str(c).strip().lower(): c for c in df.columns}
    name_c = cols.get("crop_name")
    if name_c is None:
        return None
    for _, row in df.iterrows():
        if _crop_name_matches(str(row[name_c]), crop):
            return {"row": row, "cols": cols, "crop_name": str(row[name_c])}
    return None


def _fnum(value) -> Optional[float]:
    try:
        f = float(value)
        return f if f == f else None  # filter NaN
    except (ValueError, TypeError):
        return None


def build_schedule(crop: str, n_kg_ha: float) -> dict:
    """Split an N dose (kg/ha) across the dataset's growth stages."""
    crop = crop.strip().lower()
    found = _crop_row(crop)
    if found is None:
        return {"available": False,
                "reason": f"No dataset row for crop '{crop}' (paddy, cotton, chilli supported)."}
    row, cols = found["row"], found["cols"]
    splits = []
    total_pct = 0.0
    for col_key, stage in STAGES:
        c = cols.get(col_key.lower())
        pct = _fnum(row[c]) if c is not None else None
        if pct is None:
            splits.append({"stage": stage, "n_pct": None, "n_kg_ha": None,
                           "urea_kg_ha": None, "note": "Split percentage not in dataset."})
            continue
        total_pct += pct
        n = round(n_kg_ha * pct / 100, 1)
        splits.append({"stage": stage, "n_pct": pct, "n_kg_ha": n,
                       "urea_kg_ha": round(n / PRODUCTS["Urea"]["N"], 1)})
    dur_min = _fnum(row[cols["duration_days_min"]]) if "duration_days_min" in cols else None
    dur_max = _fnum(row[cols["duration_days_max"]]) if "duration_days_max" in cols else None
    fym = _fnum(row[cols["fym_recommended_t_ha"]]) if "fym_recommended_t_ha" in cols else None
    return {
        "available": True,
        "prototype_label": PROTOTYPE_LABEL,
        "crop": crop,
        "dataset_row": found["crop_name"],
        "source_id": str(row[cols["source_id"]]) if "source_id" in cols else None,
        "n_dose_kg_ha": n_kg_ha,
        "splits": splits,
        "split_pct_total": round(total_pct, 1),
        "duration_days_min": dur_min,
        "duration_days_max": dur_max,
        "fym_recommended_t_ha": fym,
        "limitations": [
            "Stage timing in days-after-sowing is not in the dataset — apply splits at the named growth stages per local agronomic practice.",
            "Urea quantities use the standard 46% N composition.",
        ],
    }
