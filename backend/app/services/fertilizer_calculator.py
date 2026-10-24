"""Fertilizer recommendation engine.

Two paths:
1. Workbook STCR rules (when Team 1's workbook provides a usable fertilizer_rules
   sheet): applies the rule exactly as defined and returns status "calculated".
2. Fallback: status "needs_review" with general published RDF (recommended dose
   of fertilisers) shown as a labelled general reference — explicitly NOT
   adjusted to this soil test. Never presented as a soil-test-based dose.

Unit discipline: kg/ha vs kg/acre and elemental vs oxide forms are tracked
explicitly. Product compositions are standard industry values, labelled.
"""
from __future__ import annotations

from typing import Optional

from app.models.recommendation import FertilizerItem, FertilizerRequest, FertilizerResponse
from app.services.data_loader import loader
from app.services.soil_analysis import PPM_TO_KG_HA

# Standard fertiliser product compositions (industry-standard nutrient content).
PRODUCTS: dict[str, dict[str, float]] = {
    "Urea": {"N": 0.46},
    "DAP": {"N": 0.18, "P2O5": 0.46},
    "MOP": {"K2O": 0.60},
    "SSP": {"P2O5": 0.16},
}

# General published RDF (N:P2O5:K2O kg/ha) for common South Indian conditions.
# GENERAL REFERENCE ONLY — not adjusted to any soil test.
GENERAL_RDF: dict[str, dict[str, float]] = {
    "paddy": {"N": 120, "P2O5": 60, "K2O": 40},
    "cotton": {"N": 150, "P2O5": 60, "K2O": 60},
    "chilli": {"N": 120, "P2O5": 60, "K2O": 60},
}

HA_PER_ACRE = 1 / 2.471


def _to_ha(area: float, unit: str) -> float:
    return area * HA_PER_ACRE if unit.strip().lower().startswith("acre") else area


def nutrient_to_products(n: float, p2o5: float, k2o: float) -> list[tuple[str, float]]:
    """Convert nutrient needs (kg/ha) to product quantities using DAP first
    (standard practice), then urea for remaining N, then MOP for K."""
    dap = p2o5 / PRODUCTS["DAP"]["P2O5"] if p2o5 > 0 else 0.0
    n_from_dap = dap * PRODUCTS["DAP"]["N"]
    urea = max(0.0, n - n_from_dap) / PRODUCTS["Urea"]["N"] if n > 0 else 0.0
    mop = k2o / PRODUCTS["MOP"]["K2O"] if k2o > 0 else 0.0
    out = []
    if dap > 0:
        out.append(("DAP", round(dap, 1)))
    if urea > 0:
        out.append(("Urea", round(urea, 1)))
    if mop > 0:
        out.append(("MOP", round(mop, 1)))
    return out


def _match_target_crop(df: "pd.DataFrame", target_col: str, crop: str) -> "pd.DataFrame":
    """Filter STCR rows to our canonical crop keys."""
    import pandas as pd  # local import for type-checker friendliness
    n = df[target_col].astype(str).str.lower()
    if crop == "paddy":
        mask = n.str.contains("paddy") | n.str.contains("rice")
    elif crop == "cotton":
        mask = n.str.contains("cotton")
    elif crop == "chilli":
        mask = n.str.contains("chilli") | n.str.contains("chili")
    else:
        mask = pd.Series(False, index=df.index)
    return df[mask]


def _nutrient_key(nutrient_label: str) -> Optional[str]:
    n = nutrient_label.strip().lower()
    if n.startswith("nitrogen"):
        return "N"
    if "p2o5" in n:
        return "P2O5"
    if "k2o" in n:
        return "K2O"
    return None


def _target_yield(crop: str, req: FertilizerRequest) -> tuple[Optional[float], str]:
    """Resolve target yield (q/ha): request > crop sheet > STCR range midpoint."""
    if req.target_yield_q_per_ha:
        return req.target_yield_q_per_ha, "from request"
    df = loader.get("crop_nutrient_requirements")
    if df is not None:
        cols = {str(c).strip().lower(): c for c in df.columns}
        name_c = cols.get("crop_name")
        ty_c = cols.get("target_yield_q_ha")
        if name_c is not None and ty_c is not None:
            for _, row in df.iterrows():
                if _crop_name_matches(str(row[name_c]), crop):
                    try:
                        return float(row[ty_c]), f"workbook {row[name_c]} target yield"
                    except (ValueError, TypeError):
                        pass
    return None, "unresolved"


def _crop_name_matches(crop_name: str, crop: str) -> bool:
    n = crop_name.strip().lower()
    if crop == "paddy":
        return "paddy" in n or n.startswith("rice")
    if crop == "cotton":
        return "cotton" in n
    if crop == "chilli":
        return "chilli" in n or "chili" in n
    return False


def _range_midpoint(text: str) -> Optional[float]:
    """'50 – 70 q/ha' -> 60.0. Returns None if unparseable."""
    import re
    m = re.search(r"([\d.]+)\s*[–-]\s*([\d.]+)", str(text))
    if m:
        return (float(m.group(1)) + float(m.group(2))) / 2
    return None


def _validity_bounds(text: str) -> Optional[tuple[float, float]]:
    """'SN: 100 - 450 kg/ha' -> (100, 450)."""
    import re
    m = re.search(r"([\d.]+)\s*[–-]\s*([\d.]+)", str(text))
    if m:
        return float(m.group(1)), float(m.group(2))
    return None


def _apply_workbook_stcr(req: FertilizerRequest, values: dict) -> Optional[FertilizerResponse]:
    """Apply STCR equations from Team 1's workbook.

    Dose = (NR*T - (CS/100)*STV - (CFYM/100)*FYM) / (CF/100), with FYM = 0
    (assumption, stated). STV = soil-test value on the equation's basis.
    """
    df = loader.get("fertilizer_rules")
    if df is None:
        return None
    cols = {str(c).strip().lower(): c for c in df.columns}
    need = ["target_crop", "nutrient", "nutrient_requirement_nr_kg_q",
            "soil_efficiency_cs_pct", "fertilizer_efficiency_cf_pct"]
    if any(k not in cols for k in need):
        return None
    crop = req.crop.strip().lower()
    rows = _match_target_crop(df, cols["target_crop"], crop)
    if rows.empty:
        return None

    target_yield, ty_source = _target_yield(crop, req)
    if target_yield is None:
        # Last resort: midpoint of the STCR target-yield range.
        for _, row in rows.iterrows():
            mid = _range_midpoint(row.get(cols.get("target_yield_range_q_ha", ""), ""))
            if mid:
                target_yield, ty_source = mid, "midpoint of workbook STCR target-yield range"
                break
    if target_yield is None:
        return None

    nutrients: dict[str, float] = {}
    inputs_used: list[str] = []
    assumptions = [f"Target yield T={target_yield} q/ha ({ty_source}).",
                   "FYM = 0 t/ha assumed (no FYM input in this prototype)."]
    warnings: list[str] = []
    rule_ids: list[str] = []
    for _, row in rows.iterrows():
        nkey = _nutrient_key(str(row[cols["nutrient"]]))
        if nkey is None:
            continue
        try:
            nr = float(row[cols["nutrient_requirement_nr_kg_q"]])
            cs = float(row[cols["soil_efficiency_cs_pct"]]) / 100
            cf = float(row[cols["fertilizer_efficiency_cf_pct"]]) / 100
            cfym_c = cols.get("fym_efficiency_cfym_pct")
            cfym = float(row[cfym_c]) / 100 if cfym_c is not None else 0.0
        except (ValueError, TypeError):
            return None
        stv = _soil_test_value(nkey, values)
        if stv is None:
            return None  # missing input -> do not fabricate
        dose = (nr * target_yield - cs * stv - cfym * 0.0) / cf
        nutrients[nkey] = max(0.0, dose)
        inputs_used.append(f"{nkey}: STV={round(stv, 1)} kg/ha")
        rid = str(row[cols["rule_id"]]) if "rule_id" in cols else ""
        if rid:
            rule_ids.append(rid)
        eq = str(row[cols["stcr_equation"]]) if "stcr_equation" in cols else ""
        if eq:
            inputs_used.append(f"{nkey} equation: {eq}")
        vr_c = cols.get("validity_soil_test_range")
        if vr_c is not None:
            bounds = _validity_bounds(row[vr_c])
            if bounds and not (bounds[0] <= stv <= bounds[1]):
                warnings.append(
                    f"{nkey} soil-test value {round(stv, 1)} is outside the STCR validity range "
                    f"{bounds[0]}-{bounds[1]} kg/ha — treat this dose cautiously.")
    if not nutrients:
        return None
    resp = _build_response(req, nutrients, rule_id=";".join(rule_ids) or "WB_STCR_V1",
                           basis="workbook_rule", status="calculated",
                           inputs_used=inputs_used, assumptions=assumptions)
    if warnings:
        resp.limitations = warnings + resp.limitations
    return resp


def _soil_test_value(nutrient: str, values: dict) -> Optional[float]:
    """Soil-test value in kg/ha for the nutrient (P2O5<->P, K2O<->K handled)."""
    key = {"P2O5": "P", "K2O": "K"}.get(nutrient, nutrient)
    entry = values.get(key, {})
    v = entry.get("value")
    if v is None:
        return None
    unit = (entry.get("unit") or "").strip().lower()
    form = (entry.get("form") or "").strip().upper()
    # Convert to kg/ha elemental basis
    if unit in ("ppm", "mg/kg"):
        v = v * PPM_TO_KG_HA
    if nutrient == "P2O5" and form != "P2O5":
        v = v * 2.29  # P -> P2O5
    if nutrient == "K2O" and form != "K2O":
        v = v * 1.20  # K -> K2O
    return v


def _build_response(req: FertilizerRequest, nutrients: dict[str, float], rule_id: Optional[str],
                    basis: str, status: str, inputs_used: list[str],
                    assumptions: list[str]) -> FertilizerResponse:
    n = nutrients.get("N", 0.0)
    p = nutrients.get("P2O5", nutrients.get("P", 0.0) * 2.29 if "P" in nutrients else 0.0)
    k = nutrients.get("K2O", nutrients.get("K", 0.0) * 1.20 if "K" in nutrients else 0.0)
    area_ha = _to_ha(req.area, req.area_unit)
    items: list[FertilizerItem] = []
    total = 0.0
    price_missing: list[str] = []
    for product, qty_per_ha in nutrient_to_products(n, p, k):
        qty = round(qty_per_ha * area_ha, 1)
        unit_price = (req.prices or {}).get(product)
        cost = round(qty * unit_price, 2) if unit_price is not None else None
        if unit_price is None:
            price_missing.append(product)
        else:
            total += cost  # type: ignore[operator]
        nutrient = {"DAP": "P2O5 (+N)", "Urea": "N", "MOP": "K2O"}[product]
        items.append(FertilizerItem(product=product, nutrient=nutrient, quantity=qty,
                                    unit="kg", unit_price=unit_price, total_cost=cost))
    limitations = [
        "Doses are per the stated rule/basis only; confirm with your agriculture officer before buying.",
        "Product compositions used: Urea 46% N, DAP 18% N + 46% P2O5, MOP 60% K2O (industry standard).",
    ]
    final_status = status
    if price_missing and status == "calculated":
        limitations.append("Price not configured for: " + ", ".join(price_missing) + " — cost shown as partial.")
    return FertilizerResponse(
        success=True, crop=req.crop, status=final_status, dose_basis=basis,
        items=items, total_cost=round(total, 2) if total else None,
        area=req.area, area_unit=req.area_unit, rule_id=rule_id,
        inputs_used=inputs_used, assumptions=assumptions,
        explanation=_explain(req.crop, basis, n, p, k),
        limitations=limitations,
    )


def _explain(crop: str, basis: str, n: float, p: float, k: float) -> str:
    if basis == "workbook_rule":
        return (f"For {crop}, the workbook STCR rule gives {n:.0f} kg N, {p:.0f} kg P2O5 and "
                f"{k:.0f} kg K2O per hectare, converted to fertiliser products above.")
    return (f"Team 1's workbook fertiliser rules are not loaded, so no soil-test-based dose can be "
            f"computed. As a GENERAL reference only (not adjusted to your soil test), the published "
            f"recommended dose for {crop} is {n:.0f}:{p:.0f}:{k:.0f} kg/ha N:P2O5:K2O. "
            f"Get the soil-test-based dose from your agriculture officer.")


def _workbook_rdf(crop: str) -> Optional[dict[str, float]]:
    """General RDF (N/P2O5/K2O kg/ha) from the workbook's Crop_Nutrient_Requirements."""
    df = loader.get("crop_nutrient_requirements")
    if df is None:
        return None
    cols = {str(c).strip().lower(): c for c in df.columns}
    name_c = cols.get("crop_name")
    if name_c is None:
        return None
    for _, row in df.iterrows():
        if _crop_name_matches(str(row[name_c]), crop):
            try:
                return {
                    "N": float(row[cols["rdf_n_kg_ha"]]),
                    "P2O5": float(row[cols["rdf_p2o5_kg_ha"]]),
                    "K2O": float(row[cols["rdf_k2o_kg_ha"]]),
                    "_row": str(row[name_c]),
                }
            except (ValueError, TypeError, KeyError):
                return None
    return None


def recommend(req: FertilizerRequest, values: dict) -> FertilizerResponse:
    crop = req.crop.strip().lower()
    if crop not in GENERAL_RDF and loader.get("fertilizer_rules") is None:
        return FertilizerResponse(
            success=False, crop=req.crop, status="insufficient_data", dose_basis="general_reference",
            area=req.area, area_unit=req.area_unit,
            explanation=f"'{req.crop}' is not supported in this prototype (paddy, cotton, chilli).",
            limitations=["Fertiliser recommendations cover paddy, cotton, and chilli only."],
        )
    wb_result = _apply_workbook_stcr(req, values)
    if wb_result is not None:
        return wb_result
    # Fallback: labelled general reference, never presented as soil-test-based.
    # Prefer the workbook's RDF row; only then the built-in table.
    rdf = _workbook_rdf(crop)
    rdf_source = f"workbook RDF row '{rdf.pop('_row')}'" if rdf else None
    if rdf is None:
        rdf = GENERAL_RDF.get(crop)
        rdf_source = "built-in general reference" if rdf else None
    if rdf is None:
        return FertilizerResponse(
            success=False, crop=req.crop, status="insufficient_data", dose_basis="general_reference",
            area=req.area, area_unit=req.area_unit,
            explanation="No fertiliser rule available for this crop.",
            limitations=["Workbook fertiliser rules are missing and no general reference exists for this crop."],
        )
    basis_note = (f"STCR could not be applied (missing soil-test inputs or rule); "
                  f"showing {rdf_source} instead — not soil-test adjusted.")
    return _build_response(
        req, {"N": rdf["N"], "P2O5": rdf["P2O5"], "K2O": rdf["K2O"]},
        rule_id=None, basis="general_reference", status="needs_review",
        inputs_used=[basis_note],
        assumptions=[
            "These doses are a general published reference, not computed from the uploaded soil-test.",
            "Costs are illustrative and only shown when demo prices are supplied in the request.",
        ],
    )
