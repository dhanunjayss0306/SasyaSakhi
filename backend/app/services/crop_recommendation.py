"""Rule-based crop suitability.

Compares confirmed soil values against per-crop preference ranges.
Two rule sources:
1. Team 1's workbook (crop_nutrient_requirements) when loaded — overrides below.
2. Built-in agronomic preference ranges, labelled BUILTIN_*. Every result lists
   which factors were compared, what supports/limits the crop, and the
   limitations. No invented scores: status comes from explicit rules, and the
   "parameters in range" count is defined transparently.
"""
from __future__ import annotations

from typing import Optional

from app.models.crop import CropSuitability
from app.services.data_loader import loader
from app.services.soil_analysis import normalise_for_rating

# Built-in preference ranges. Source: standard agronomic references for these
# crops under South Indian conditions. Workbook data refines/overrides these.
BUILTIN_CROP_RULES: dict[str, dict] = {
    "paddy": {
        "rule_id": "BUILTIN_PADDY_V1",
        "preferred": {
            "pH": (5.5, 7.5), "EC": (0.0, 2.0), "OC": (0.5, 99.0),
            "N": (280, 1e9), "P": (12.5, 1e9), "K": (135, 1e9),
        },
        "hard_limits": {"pH": (4.5, 9.0), "EC": (0.0, 4.0)},
        "notes": "Paddy tolerates slightly acidic soils and moderate salinity, and responds strongly to nitrogen.",
    },
    "cotton": {
        "rule_id": "BUILTIN_COTTON_V1",
        "preferred": {
            "pH": (6.0, 8.0), "EC": (0.0, 1.5), "OC": (0.5, 99.0),
            "N": (280, 1e9), "P": (12.5, 1e9), "K": (135, 1e9),
        },
        "hard_limits": {"pH": (5.5, 8.5), "EC": (0.0, 3.0)},
        "notes": "Cotton needs good drainage and is sensitive to waterlogging and high salinity at germination.",
    },
    "chilli": {
        "rule_id": "BUILTIN_CHILLI_V1",
        "preferred": {
            "pH": (6.0, 7.0), "EC": (0.0, 1.0), "OC": (0.5, 99.0),
            "N": (280, 1e9), "P": (12.5, 1e9), "K": (135, 1e9),
        },
        "hard_limits": {"pH": (5.5, 7.5), "EC": (0.0, 2.0)},
        "notes": "Chilli prefers near-neutral pH and low salinity; it is sensitive to both acidic and saline soils.",
    },
}

SUPPORTED_CROPS = ["paddy", "cotton", "chilli"]


def _norm_crop(name: str) -> Optional[str]:
    n = name.strip().lower()
    if "paddy" in n or n.startswith("rice"):
        return "paddy"
    if "cotton" in n:
        return "cotton"
    if "chilli" in n or "chili" in n:
        return "chilli"
    return None


def _workbook_rules() -> Optional[dict]:
    """Build per-crop rules from Team 1's Crop_Nutrient_Requirements sheet."""
    df = loader.get("crop_nutrient_requirements")
    if df is None:
        return None
    cols = {str(c).strip().lower(): c for c in df.columns}
    if "crop_name" not in cols:
        return None

    def num(row, *names):
        for nm in names:
            c = cols.get(nm)
            if c is not None:
                try:
                    return float(row[c])
                except (ValueError, TypeError):
                    pass
        return None

    rules: dict[str, dict] = {}
    seen: set[str] = set()
    for _, row in df.iterrows():
        crop = _norm_crop(str(row[cols["crop_name"]]))
        if crop is None or crop in seen:
            continue  # first matching variety row wins; labelled below
        seen.add(crop)
        ph_min = num(row, "optimum_ph_min")
        ph_max = num(row, "optimum_ph_max")
        ec_max = num(row, "ec_tolerance_max_dsm")
        oc_min = num(row, "min_soil_oc_pct")
        n_crit = num(row, "critical_soil_n_kg_ha")
        p_crit = num(row, "critical_soil_p2o5_kg_ha")
        k_crit = num(row, "critical_soil_k2o_kg_ha")
        preferred: dict[str, tuple[float, float]] = {}
        if ph_min is not None and ph_max is not None:
            preferred["pH"] = (ph_min, ph_max)
        if ec_max is not None:
            preferred["EC"] = (0.0, ec_max)
        if oc_min is not None:
            preferred["OC"] = (oc_min, float("inf"))
        if n_crit is not None:
            preferred["N"] = (n_crit, float("inf"))
        if p_crit is not None:
            preferred["P"] = (p_crit, float("inf"))
        if k_crit is not None:
            preferred["K"] = (k_crit, float("inf"))
        if not preferred:
            continue
        hard = {"EC": (0.0, ec_max)} if ec_max is not None else {}
        rules[crop] = {
            "rule_id": "WB_CROP_REQ_V1",
            "preferred": preferred,
            "hard_limits": hard,
            "nutrient_basis": {"P": "P2O5", "K": "K2O"},
            "notes": (f"Ranges from Team 1's workbook row '{row[cols['crop_name']]}' "
                      f"(target yield {num(row, 'target_yield_q_ha')} q/ha)."),
            "source_row": str(row[cols["crop_name"]]),
        }
    return rules or None


def evaluate_crop(crop: str, values: dict[str, dict], rules: dict) -> CropSuitability:
    crop = crop.lower()
    if crop not in rules:
        return CropSuitability(
            crop=crop, status="insufficient_data",
            missing_information=["No requirement data for this crop."],
            explanation=f"'{crop}' is not in the supported crop list (paddy, cotton, chilli).",
            limitations=["Suitability is only computed for paddy, cotton, and chilli in this prototype."],
        )
    rule = rules[crop]
    preferred: dict = rule["preferred"]
    hard: dict = rule.get("hard_limits", {})
    supporting, limiting, missing = [], [], []
    compared = in_range = 0

    for param, (lo, hi) in preferred.items():
        v = values.get(param, {}).get("value")
        if v is None:
            missing.append(param)
            continue
        norm_v, norm_unit, _ = normalise_for_rating(param, v, values[param].get("unit"))
        # Workbook critical limits for P/K are on the oxide basis (P2O5/K2O).
        basis = rule.get("nutrient_basis", {}).get(param)
        form = (values[param].get("form") or "").upper()
        if basis == "P2O5" and form != "P2O5":
            norm_v = norm_v * 2.29
        elif basis == "K2O" and form != "K2O":
            norm_v = norm_v * 1.20
        compared += 1
        h = hard.get(param)
        if h and not (h[0] <= norm_v <= h[1]):
            limiting.append(f"{param}={v} is outside the viable range for {crop} ({h[0]}-{h[1]}).")
            continue
        if lo <= norm_v <= hi:
            in_range += 1
            supporting.append(f"{param}={v} is in the preferred range for {crop}.")
        else:
            limiting.append(f"{param}={v} is outside the preferred range for {crop} ({lo}-{hi}).")

    if compared == 0:
        status = "insufficient_data"
    elif any("outside the viable range" in f for f in limiting):
        status = "unsuitable"
    elif limiting:
        status = "marginal"
    else:
        status = "suitable"

    if compared < 3 and status != "insufficient_data":
        status = "insufficient_data"
        limiting.append("Fewer than 3 soil parameters were available — not enough for a suitability call.")

    explanation = rule["notes"] + " "
    if status == "suitable":
        explanation += f"Soil conditions look suitable for {crop} based on the compared parameters."
    elif status == "marginal":
        explanation += f"{crop} can be grown but the limiting factors above need corrective action."
    elif status == "unsuitable":
        explanation += f"Soil conditions are outside the viable range for {crop}."
    else:
        explanation += "Not enough measured values to judge suitability — test the missing parameters."

    return CropSuitability(
        crop=crop, status=status,
        parameters_in_range=in_range, parameters_compared=compared,
        supporting_factors=supporting, limiting_factors=limiting,
        missing_information=missing,
        rule_ids=[rule["rule_id"]],
        explanation=explanation,
        limitations=[
            "Suitability is a soil-chemistry screen only — it does not consider water availability, "
            "season, variety, pests, or market prices, and it never guarantees yield.",
            "Built-in ranges are agronomic defaults; Team 1's workbook refines them when loaded.",
        ],
    )


def evaluate_all(values: dict[str, dict]) -> tuple[list[CropSuitability], list[str]]:
    rules = _workbook_rules() or BUILTIN_CROP_RULES
    warnings: list[str] = []
    if _workbook_rules() is None:
        warnings.append("Workbook crop requirements not loaded — using built-in agronomic defaults.")
    results = [evaluate_crop(c, values, rules) for c in SUPPORTED_CROPS]
    # Best-first ordering: suitable > marginal > unsuitable > insufficient_data
    order = {"suitable": 0, "marginal": 1, "unsuitable": 2, "insufficient_data": 3}
    results.sort(key=lambda r: order[r.status])
    return results, warnings
