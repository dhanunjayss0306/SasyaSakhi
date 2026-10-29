"""ML v2 service: perfect soil scores high, missing values refuse to guess."""

from app.services import ml_service


def _values(**overrides):
    base = {
        "pH": 6.8, "EC": 0.42, "OC": 0.62, "N": 310,
        "P": 28, "K": 190, "S": 12, "Zn": 0.8, "Fe": 5.2, "B": 0.6,
    }
    base.update(overrides)
    forms = {"P": "P2O5", "K": "K2O"}
    return {k: {"value": v, "unit": None, "form": forms.get(k)}
            for k, v in base.items()}


def test_perfect_soil_scores_high_for_paddy():
    results = {r["crop"]: r for r in ml_service.predict_all(_values())}
    paddy = results["paddy"]
    assert paddy["status"] == "high"
    assert paddy["score"] is not None and paddy["score"] >= 75
    assert paddy["gaps"] == []


def test_high_ph_creates_ph_gap_and_lowers_score():
    perfect = ml_service.predict_crop("paddy", _values())
    alkaline = ml_service.predict_crop("paddy", _values(pH=8.5))
    assert alkaline["score"] < perfect["score"]
    assert any("pH" in gap for gap in alkaline["gaps"])


def test_missing_boron_refuses_to_guess():
    values = _values()
    del values["B"]
    result = ml_service.predict_crop("paddy", values)
    assert result["status"] == "insufficient_data"
    assert result["score"] is None
    assert "B" in result["missing"]


def test_feature_order_matches_model():
    model, _ = ml_service._load()
    assert list(model.feature_names_in_) == ml_service.FEATURE_ORDER
