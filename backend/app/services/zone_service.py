"""Agro-climatic zone + water lookup.

Source: SoilSaathi_India_Hydro_AgroClimatic_Zone_Crop_Datasets.xlsx
(150 zones, IMD rainfall 2011-2025, CGWB groundwater, ICAR crop-water
tiers). This is zone survey data, NOT satellite imagery and NOT lab soil
measurements — every response says so. A farmer picks a district; the
service returns that district's zone, its seasonal water availability,
rainfall trend, groundwater stage, and water-tier crop suggestions.

Lookup is by district name (the file has no coordinates), matched
case-insensitively against Representative_Districts. Ambiguous or
unknown districts return the candidate list instead of a guessed zone.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from app import config

log = logging.getLogger("soilsaathi.zones")

_FILENAME = "SoilSaathi_India_Hydro_AgroClimatic_Zone_Crop_Datasets.xlsx"

_cache: Optional[pd.DataFrame] = None


def _load() -> pd.DataFrame:
    global _cache
    if _cache is not None:
        return _cache
    path = Path(config.BASE_DIR) / "data" / _FILENAME
    if not path.is_file():
        raise RuntimeError(f"Zone dataset missing from backend/data/: {_FILENAME}")
    df = pd.read_excel(path, sheet_name="India_150_Zones_Master")
    _cache = df
    return df


def districts() -> list[str]:
    """All district names in the file, for the picker's suggestions."""
    df = _load()
    out: set[str] = set()
    for cell in df["Representative_Districts"].dropna():
        for part in str(cell).split(","):
            name = part.strip()
            if name:
                out.add(name)
    return sorted(out)


def _zone_dict(row: pd.Series) -> dict:
    def num(col):
        v = row.get(col)
        return None if pd.isna(v) else float(v)

    return {
        "zone_id": str(row["Zone_ID"]),
        "state": str(row["State_UT"]),
        "zone_name": str(row["Agro_Climatic_Zone_Name"]),
        "districts": str(row["Representative_Districts"]),
        "dominant_soil": str(row["Dominant_Soil_Type"]),
        "soil_awc_mm_m": num("Soil_AWC_mm_m"),
        "avg_rainfall_mm": num("Avg_15Yr_Rainfall_2011_2025_mm"),
        "primary_rainy_months": str(row["Primary_Rainy_Months"]),
        "monsoon_onset": str(row["Monsoon_Onset_Window"]),
        "monsoon_withdrawal": str(row["Monsoon_Withdrawal_Window"]),
        "annual_rainy_days": num("Annual_Rainy_Days"),
        "groundwater_stage_pct": num("Stage_of_GW_Extraction_pct"),
        "groundwater_category": str(row["CGWB_Categorization"]),
        "overall_water_mm": num("Overall_Annual_Water_Availability_mm"),
        "kharif_water_mm": num("Kharif_Total_Water_Avail_mm"),
        "rabi_water_mm": num("Rabi_Total_Water_Avail_mm"),
        "summer_water_mm": num("Summer_Total_Water_Avail_mm"),
        "suggested_kharif_crops": str(row["Suggested_Kharif_Crops"]),
        "suggested_rabi_crops": str(row["Suggested_Rabi_Crops"]),
        "suggested_low_water_crops": str(row["Suggested_Low_Water_Contingency_Crops"]),
        "recommended_irrigation": str(row["Recommended_Irrigation_System"]),
        "source_note": (
            "Zone survey data (IMD rainfall 2011-2025, CGWB groundwater, "
            "ICAR crop-water tiers) — not satellite imagery, not lab soil values."),
    }


def lookup(district: str) -> dict:
    """Exact-ish district match; returns matches or candidates, never a guess."""
    df = _load()
    needle = district.strip().lower()
    if not needle:
        return {"found": False, "matches": [], "candidates": districts()}
    matches = []
    for _, row in df.iterrows():
        districts_cell = str(row["Representative_Districts"]).lower()
        if needle in districts_cell:
            # Prefer a match where the needle is a whole district token.
            tokens = [t.strip() for t in districts_cell.split(",")]
            exact = any(needle == t or needle in t for t in tokens)
            if exact:
                matches.append(_zone_dict(row))
    if len(matches) == 1:
        return {"found": True, "zone": matches[0], "matches": matches}
    if len(matches) > 1:
        return {"found": False, "matches": matches,
                "message": "More than one zone mentions this district — pick a zone."}
    # No match: offer districts that contain the typed text, else all.
    candidates = [d for d in districts() if needle in d.lower()]
    return {"found": False, "matches": [],
            "message": f"No zone found for district '{district}'.",
            "candidates": candidates or districts()}
