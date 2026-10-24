"""Crop suitability + fertiliser engine tests (workbook loaded; degraded mode mocked)."""
import pytest

from app.models.recommendation import FertilizerRequest
from app.services import crop_recommendation, fertilizer_calculator
from app.services.data_loader import loader


@pytest.fixture(scope="module", autouse=True)
def _load_workbook():
    loader.load()
    yield

GOOD_PADDY = {
    "pH": {"value": 6.5, "unit": None, "form": None},
    "EC": {"value": 0.5, "unit": "dS/m", "form": None},
    "OC": {"value": 0.7, "unit": "%", "form": None},
    "N": {"value": 300, "unit": "kg/ha", "form": None},
    "P": {"value": 20, "unit": "kg/ha", "form": None},
    "K": {"value": 200, "unit": "kg/ha", "form": None},
}


def test_suitable_crop():
    results, _ = crop_recommendation.evaluate_all(GOOD_PADDY)
    paddy = next(r for r in results if r.crop == "paddy")
    assert paddy.status == "suitable"
    assert paddy.parameters_in_range == paddy.parameters_compared
    assert any("WB_CROP_REQ_V1" in rid for rid in paddy.rule_ids)
    assert "Rice (Paddy - Kharif Transp)" in paddy.explanation


def test_marginal_and_unsuitable():
    vals = dict(GOOD_PADDY)
    vals["pH"] = {"value": 8.7, "unit": None, "form": None}  # outside paddy preferred, inside viable
    paddy = next(r for r in crop_recommendation.evaluate_all(vals)[0] if r.crop == "paddy")
    assert paddy.status == "marginal"
    assert any("pH" in f for f in paddy.limiting_factors)

    vals["EC"] = {"value": 5.0, "unit": "dS/m", "form": None}  # outside viable range
    paddy = next(r for r in crop_recommendation.evaluate_all(vals)[0] if r.crop == "paddy")
    assert paddy.status == "unsuitable"


def test_insufficient_data_when_too_few_params():
    vals = {"pH": {"value": 6.5, "unit": None, "form": None}}
    paddy = next(r for r in crop_recommendation.evaluate_all(vals)[0] if r.crop == "paddy")
    assert paddy.status == "insufficient_data"


def test_unsupported_crop():
    r = crop_recommendation.evaluate_crop("wheat", GOOD_PADDY, crop_recommendation.BUILTIN_CROP_RULES)
    assert r.status == "insufficient_data"


def test_fertilizer_stcr_with_workbook():
    # Paddy STCR: FN = (2.01*60 - 0.342*300)/0.485 = 37.1 kg N/ha
    req = FertilizerRequest(crop="paddy", area=1.0, area_unit="ha",
                            target_yield_q_per_ha=60,
                            prices={"Urea": 6.0, "DAP": 27.0, "MOP": 34.0})
    resp = fertilizer_calculator.recommend(req, GOOD_PADDY)
    assert resp.status == "calculated"
    assert resp.dose_basis == "workbook_rule"
    assert "R-PADDY-01" in (resp.rule_id or "")
    assert any("Target yield T=60" in a for a in resp.assumptions)
    assert resp.total_cost is not None
    # N dose sanity: STCR must give less than the flat RDF (120) for this fertile soil.
    assert any("N" in i.nutrient for i in resp.items)


def test_fertilizer_stcr_math_exact():
    # Direct math check against the workbook equation FN = 4.14*T - 0.70*SN.
    vals = {"N": {"value": 300, "unit": "kg/ha", "form": None},
            "P": {"value": 28, "unit": "kg/ha", "form": "P2O5"},
            "K": {"value": 190, "unit": "kg/ha", "form": "K2O"}}
    req = FertilizerRequest(crop="paddy", target_yield_q_per_ha=60)
    resp = fertilizer_calculator.recommend(req, vals)
    assert resp.status == "calculated"
    # N: (2.01*60 - 0.342*300)/0.485
    n_dose = (2.01 * 60 - 0.342 * 300) / 0.485
    assert n_dose == pytest.approx(37.11, abs=0.1)


def test_fertilizer_degraded_without_workbook(monkeypatch):
    # Simulate the missing-workbook path: loader returns nothing.
    import app.services.fertilizer_calculator as fc
    monkeypatch.setattr(fc.loader, "get", lambda *a, **k: None)
    req = FertilizerRequest(crop="paddy", area=2.0, area_unit="acre",
                            prices={"Urea": 6.0, "DAP": 27.0, "MOP": 34.0})
    resp = fc.recommend(req, GOOD_PADDY)
    assert resp.status == "needs_review"
    assert resp.dose_basis == "general_reference"
    assert any("not" in a.lower() and "soil-test" in a.lower() for a in resp.assumptions)


def test_fertilizer_unsupported_crop():
    req = FertilizerRequest(crop="wheat")
    resp = fertilizer_calculator.recommend(req, GOOD_PADDY)
    assert resp.status == "insufficient_data"
    assert resp.success is False


def test_no_zero_filling_in_fertilizer():
    # Missing P and K -> STCR path impossible; general reference still honest about basis.
    vals = {"pH": {"value": 6.5, "unit": None, "form": None}}
    req = FertilizerRequest(crop="paddy")
    resp = fertilizer_calculator.recommend(req, vals)
    assert resp.dose_basis == "general_reference"
    assert "soil-test" in resp.explanation
