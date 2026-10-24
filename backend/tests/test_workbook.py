"""Workbook integration: loader finds the real file, schedule uses dataset values only."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import schedule_service
from app.services.data_loader import loader


def test_loader_finds_real_workbook():
    status = loader.load()
    assert status.workbook_found is True
    assert status.datasets["crop_nutrient_requirements"]["available"] is True
    assert status.datasets["fertilizer_rules"]["available"] is True
    assert status.datasets["fertility_reference_ranges"]["available"] is True
    assert status.datasets["soil_records"]["available"] is True
    assert status.datasets["ocr_test_cases"]["available"] is True


def test_schedule_uses_dataset_splits():
    out = schedule_service.build_schedule("paddy", 120.0)
    assert out["available"] is True
    assert "PROTOTYPE" in out["prototype_label"]
    assert out["dataset_row"] == "Rice (Paddy - Kharif Transp)"
    pcts = [s["n_pct"] for s in out["splits"] if s["n_pct"] is not None]
    assert pcts == [33.0, 33.0, 34.0]
    assert out["split_pct_total"] == pytest.approx(100.0)
    # Urea per split from the N dose, standard 46% composition.
    basal = out["splits"][0]
    assert basal["n_kg_ha"] == pytest.approx(39.6)
    assert basal["urea_kg_ha"] == pytest.approx(39.6 / 0.46, abs=0.1)
    # Durations from the dataset...
    assert out["duration_days_min"] == 120
    assert out["duration_days_max"] == 145
    # ...but NO invented day numbers anywhere in the payload.
    blob = str(out)
    assert "days_after_sowing" not in blob and "day " not in blob.replace("duration_days", "")


def test_schedule_cotton_and_chilli():
    for crop in ("cotton", "chilli"):
        out = schedule_service.build_schedule(crop, 100.0)
        assert out["available"] is True, crop
        assert out["split_pct_total"] == pytest.approx(100.0)


def test_schedule_unknown_crop():
    out = schedule_service.build_schedule("wheat", 100.0)
    assert out["available"] is False


def test_schedule_endpoint_with_rain_optional():
    with TestClient(app) as client:
        r = client.get("/api/tracking/fertilizer-schedule",
                       params={"crop": "paddy", "n_kg_ha": 120})
        assert r.status_code == 200
        body = r.json()
        assert body["available"] is True
        assert len(body["splits"]) == 3
        # Bad dose rejected.
        r = client.get("/api/tracking/fertilizer-schedule",
                       params={"crop": "paddy", "n_kg_ha": -5})
        assert r.status_code == 400
