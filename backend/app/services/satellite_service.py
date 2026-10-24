"""Satellite/modelled soil data via ISRIC SoilGrids v2.0 (free, no key).

https://rest.isric.org/soilgrids/v2.0/

HONESTY: SoilGrids values are satellite + machine-learning MODELLED estimates
at ~250 m resolution — they are NOT lab measurements and must never be
presented as a soil test. Coverage is not universal: the API returns null for
some locations (observed for parts of coastal/southern India during testing).
Phosphorus and potassium are NOT available from SoilGrids v2.0 at all.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

log = logging.getLogger("soilsaathi.satellite")

BASE_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
RESOLUTION_M = 250

# property -> (canonical parameter, unit note)
PROPERTIES = {
    "phh2o": ("pH", "pH units"),
    "soc": ("OC", "percent, converted from g/kg"),
    "nitrogen": ("N", "g/kg — NOT kg/ha; do not compare with lab kg/ha directly"),
    "clay": ("clay", "%"),
    "sand": ("sand", "%"),
    "cec": ("CEC", "cmol(c)/kg"),
}
DEPTHS = ["0-5cm", "5-15cm"]

DISCLAIMERS = [
    "Modeled estimates from ISRIC SoilGrids v2.0 (satellite + ML), ~250 m resolution — NOT lab measurements.",
    "Phosphorus and potassium are not provided by SoilGrids v2.0.",
    "Nitrogen is reported in g/kg and cannot be directly compared with lab kg/ha values.",
    "Use only as a rough background where no soil test exists; confirm with a lab test before fertiliser decisions.",
]


def fetch_soilgrids(lat: float, lon: float, timeout: int = 25) -> dict:
    """Fetch modelled soil properties. Never raises — failures become available=False."""
    params = {
        "lat": lat, "lon": lon,
        "property": list(PROPERTIES),
        "depth": DEPTHS,
        "value": "mean",
    }
    try:
        r = httpx.get(BASE_URL, params=params, timeout=timeout)
        r.raise_for_status()
        data = r.json()
    except Exception as exc:
        log.warning("SoilGrids unreachable: %s", exc)
        return {"available": False, "reason": f"SoilGrids API unreachable: {exc}",
                "disclaimers": DISCLAIMERS}

    properties: list[dict] = []
    for layer in data.get("properties", {}).get("layers", []):
        name = layer.get("name")
        mapping = PROPERTIES.get(name)
        if not mapping:
            continue
        param, unit_note = mapping
        unit = layer.get("unit_measure", {})
        d_factor = unit.get("d_factor") or 1
        for dep in layer.get("depths", []):
            raw = (dep.get("values") or {}).get("mean")
            if raw is None:
                continue
            value = raw / d_factor
            out_unit = unit.get("target_units", "")
            # soc arrives as g/kg (dg/kg / 10); present OC as % too.
            if name == "soc":
                properties.append({"parameter": "OC", "value": round(value / 10, 3),
                                   "unit": "%", "depth": dep.get("label"),
                                   "provenance": "satellite_model",
                                   "note": "Converted from SoilGrids soc (g/kg)."})
                continue
            properties.append({"parameter": param, "value": round(value, 3),
                               "unit": out_unit, "depth": dep.get("label"),
                               "provenance": "satellite_model", "note": unit_note})
    if not properties:
        return {"available": False,
                "reason": "SoilGrids returned no modelled data for this location (coverage gap).",
                "disclaimers": DISCLAIMERS}
    return {
        "available": True,
        "source": "ISRIC SoilGrids v2.0",
        "resolution_m": RESOLUTION_M,
        "latitude": lat, "longitude": lon,
        "depths_cm": DEPTHS,
        "properties": properties,
        "disclaimers": DISCLAIMERS,
    }
