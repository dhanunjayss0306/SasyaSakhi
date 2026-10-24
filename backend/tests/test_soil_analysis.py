"""Soil analysis rules."""
from app.services.soil_analysis import analyze, assess


def test_ph_bands():
    assert assess("pH", 5.2).category == "acidic"
    assert assess("pH", 6.8).category == "neutral"
    assert assess("pH", 6.8).status == "ok"
    assert assess("pH", 8.8).status == "concern"
    assert assess("pH", 6.8).rule_id == "STD_PH_V1"


def test_npk_bands():
    assert assess("N", 200, "kg/ha").category == "low"
    assert assess("N", 400, "kg/ha").category == "medium"
    assert assess("P", 30, "kg/ha").category == "high"
    assert assess("K", 100, "kg/ha").category == "low"


def test_ppm_to_kg_ha_conversion():
    a = assess("N", 100, "ppm")  # 100 ppm -> 224 kg/ha -> low
    assert a.category == "low"
    assert "2.24" in a.explanation


def test_insufficient_data_cases():
    assert assess("pH", None).status == "insufficient_data"
    assert assess("Unobtainium", 5.0).status == "insufficient_data"


def test_analyze_uses_workbook_bands():
    assessments, notes = analyze({"N": {"value": 200, "unit": "kg/ha", "form": None}})
    n = next(a for a in assessments if a.parameter == "N")
    assert n.rule_id == "WB_FERTILITY_V1"
    assert n.category == "low"  # workbook: 140-280 = low
    assert not any("not loaded" in x.lower() for x in notes)
