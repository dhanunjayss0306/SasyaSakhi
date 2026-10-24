"""End-to-end API tests via TestClient (no workbook -> degraded mode)."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ocr_service

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLE_PNG = DATA_DIR / "synthetic_sample_report.png"

TESS = ocr_service.tesseract_available()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_reports_workbook_loaded(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["dataset"]["workbook_found"] is True
    assert body["dataset"]["datasets"]["fertilizer_rules"]["available"] is True
    assert body["dataset"]["datasets"]["crop_nutrient_requirements"]["available"] is True
    assert body["ocr"]["available"] == TESS


def test_extract_and_confirm_flow(client):
    with open(SAMPLE_PNG, "rb") as f:
        r = client.post("/api/soil-reports/extract", files={"file": ("sample.png", f, "image/png")})
    assert r.status_code == 200
    body = r.json()
    report_id = body["report_id"]
    if TESS:
        assert body["success"] is True
        params = {f["parameter"]: f["value"] for f in body["fields"]}
        assert params.get("pH") == pytest.approx(6.8, abs=0.05)
        assert all(f["needs_review"] for f in body["fields"])
    else:
        assert body["success"] is False
        assert "manually" in body["message"]

    # Confirm with corrected values (simulating the farmer's review).
    r = client.post(f"/api/soil-reports/{report_id}/confirm", json={
        "values": [
            {"parameter": "pH", "value": 6.8},
            {"parameter": "EC", "value": 0.42, "unit": "dS/m"},
            {"parameter": "OC", "value": 0.62, "unit": "%"},
            {"parameter": "N", "value": 310, "unit": "kg/ha"},
            {"parameter": "P", "value": 28, "unit": "kg/ha", "form": "P2O5"},
            {"parameter": "K", "value": 190, "unit": "kg/ha", "form": "K2O"},
        ]})
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"

    # Analysis from the confirmed report.
    r = client.post("/api/soil-analysis", json={"report_id": report_id})
    assert r.status_code == 200
    cats = {a["parameter"]: a["category"] for a in r.json()["assessments"]}
    assert cats["pH"] == "neutral"
    assert cats["N"] == "medium"

    # Crop suitability.
    r = client.post("/api/recommendations/crops", json={"report_id": report_id})
    assert r.status_code == 200
    statuses = {s["crop"]: s["status"] for s in r.json()["results"]}
    assert statuses["paddy"] == "suitable"

    # Fertiliser (workbook STCR now applies -> calculated, workbook_rule).
    r = client.post("/api/recommendations/fertilizer",
                    json={"crop": "paddy", "report_id": report_id, "area": 1, "area_unit": "acre",
                          "target_yield_q_per_ha": 60})
    assert r.status_code == 200
    body = r.json()
    assert body["dose_basis"] == "workbook_rule"
    assert body["status"] == "calculated"
    assert "R-PADDY" in (body["rule_id"] or "")


def test_extract_rejects_bad_filetype(client):
    r = client.post("/api/soil-reports/extract",
                    files={"file": ("evil.exe", b"xxx", "application/octet-stream")})
    assert r.status_code == 400


def test_confirm_unknown_report_404(client):
    r = client.post("/api/soil-reports/nope/confirm", json={"values": []})
    assert r.status_code == 404


def test_analysis_requires_values_or_report(client):
    r = client.post("/api/soil-analysis", json={})
    assert r.status_code == 400


def test_assistant_template_mode(client):
    r = client.post("/api/assistant/chat",
                    json={"language": "en", "message": "What does my soil pH mean?",
                          "context": {"confirmed_values": {"pH": {"value": 5.4}}}})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "template"  # no AI key configured in tests
    assert "5.4" in body["answer"]
    assert "STD_PH_V1" in body["source_ids"]


def test_assistant_telugu(client):
    r = client.post("/api/assistant/chat",
                    json={"language": "te", "message": "pH అంటే ఏమిటి?",
                          "context": {"confirmed_values": {"pH": {"value": 6.8}}}})
    assert r.status_code == 200
    assert r.json()["language"] == "te"


def test_demo_sample_report(client):
    r = client.get("/api/demo/sample-report")
    assert r.status_code == 200
    body = r.json()
    assert body["is_demo"] is True
    assert "NOT" in body["demo_label"]  # labelled as not-from-OCR
    assert body["status"] == "confirmed"
    # Demo report is immediately usable downstream.
    r = client.post("/api/recommendations/crops", json={"report_id": body["report_id"]})
    assert r.status_code == 200


def test_weather_never_crashes(client):
    r = client.get("/api/weather", params={"lat": 17.68, "lon": 83.21})
    assert r.status_code == 200
    body = r.json()
    assert "available" in body
    if body["available"]:
        assert body["current"]["temperature_c"] is not None


def test_weather_validates_coords(client):
    r = client.get("/api/weather", params={"lat": 999, "lon": 0})
    assert r.status_code == 400
