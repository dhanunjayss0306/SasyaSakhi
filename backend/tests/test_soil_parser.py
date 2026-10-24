"""Soil parser: labels, units, decimals, OCR confusions, form distinction."""
from app.services.soil_parser import clean_number, parse_soil_text


def by_param(result, name):
    return next((f for f in result.fields if f.parameter == name), None)


def test_basic_labels_and_units():
    text = "pH: 6.8\nEC: 0.42 dS/m\nOrganic Carbon: 0.62 %\nNitrogen: 310 kg/ha"
    r = parse_soil_text(text)
    assert by_param(r, "pH").value == 6.8
    assert by_param(r, "EC").value == 0.42
    assert by_param(r, "EC").unit == "dS/m"
    assert by_param(r, "OC").value == 0.62
    assert by_param(r, "OC").unit == "%"
    assert by_param(r, "N").value == 310
    assert "Zn" in r.missing  # not in text -> missing, never zero


def test_decimal_comma_and_ocr_confusions():
    assert clean_number("6,8") == 6.8
    assert clean_number("O.42") == 0.42   # O -> 0
    assert clean_number("l2") == 12       # l -> 1
    assert clean_number("5S") == 55       # S -> 5
    assert clean_number("abc") is None
    assert clean_number("") is None


def test_p_vs_p2o5_and_k_vs_k2o_forms():
    r = parse_soil_text("Phosphorus (P2O5): 28 kg/ha\nPotassium (K2O): 190 kg/ha")
    p = by_param(r, "P")
    k = by_param(r, "K")
    assert p.value == 28 and p.form == "P2O5"
    assert k.value == 190 and k.form == "K2O"


def test_micronutrients():
    r = parse_soil_text("Zinc (Zn): 0.8 ppm\nIron (Fe): 5.2 ppm\nBoron (B): 0.4 ppm")
    assert by_param(r, "Zn").value == 0.8
    assert by_param(r, "Fe").value == 5.2
    assert by_param(r, "B").value == 0.4


def test_empty_text_marks_everything_missing():
    r = parse_soil_text("   ")
    assert r.fields == []
    assert len(r.missing) == 12


def test_label_without_number_is_not_a_value():
    r = parse_soil_text("pH\nEC: not readable")
    assert by_param(r, "pH") is None
    assert "pH" in r.missing


def test_never_zero_fills():
    r = parse_soil_text("pH: 7.0")
    assert all(f.value != 0 or f.parameter == "pH" for f in r.fields)
    assert "N" in r.missing


def test_confidence_only_from_engine_words():
    words = [{"text": "6.8", "conf": 93.0}, {"text": "pH:", "conf": 95.0}]
    r = parse_soil_text("pH: 6.8", words=words)
    assert by_param(r, "pH").confidence == 93.0
    r2 = parse_soil_text("pH: 6.8")  # no word data -> None, never invented
    assert by_param(r2, "pH").confidence is None
