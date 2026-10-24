"""SoilGrids satellite service: parsing, unit conversion, nulls, fallback (HTTP mocked)."""
import httpx
import pytest

from app.services import satellite_service

SAMPLE_RESPONSE = {
    "properties": {
        "layers": [
            {"name": "phh2o",
             "unit_measure": {"d_factor": 10, "mapped_units": "pH*10", "target_units": "-"},
             "depths": [{"label": "0-5cm", "values": {"mean": 65}},
                        {"label": "5-15cm", "values": {"mean": 68}}]},
            {"name": "soc",
             "unit_measure": {"d_factor": 10, "mapped_units": "dg/kg", "target_units": "g/kg"},
             "depths": [{"label": "0-5cm", "values": {"mean": 152}},
                        {"label": "5-15cm", "values": {"mean": None}}]},
            {"name": "nitrogen",
             "unit_measure": {"d_factor": 100, "mapped_units": "cg/kg", "target_units": "g/kg"},
             "depths": [{"label": "0-5cm", "values": {"mean": 120}}]},
        ]
    }
}

NULL_RESPONSE = {
    "properties": {
        "layers": [
            {"name": "phh2o",
             "unit_measure": {"d_factor": 10, "mapped_units": "pH*10", "target_units": "-"},
             "depths": [{"label": "0-5cm", "values": {"mean": None}}]},
        ]
    }
}


class FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


def _mock_get(payload=None, exc=None):
    def fake(*a, **k):
        if exc:
            raise exc
        return FakeResp(payload)
    return fake


def test_parses_and_converts_units(monkeypatch):
    monkeypatch.setattr(httpx, "get", _mock_get(SAMPLE_RESPONSE))
    out = satellite_service.fetch_soilgrids(31.0, 75.0)
    assert out["available"] is True
    assert out["resolution_m"] == 250
    by_param = {(p["parameter"], p["depth"]): p for p in out["properties"]}
    assert by_param[("pH", "0-5cm")]["value"] == pytest.approx(6.5)      # 65/10
    assert by_param[("pH", "0-5cm")]["provenance"] == "satellite_model"
    oc = by_param[("OC", "0-5cm")]
    assert oc["value"] == pytest.approx(1.52)                            # 152 dg/kg -> 15.2 g/kg -> 1.52%
    assert oc["unit"] == "%"
    n = by_param[("N", "0-5cm")]
    assert n["value"] == pytest.approx(1.2)                              # 120/100 g/kg
    assert "NOT kg/ha" in n["note"]
    assert any("NOT lab measurements" in d for d in out["disclaimers"])
    assert any("Phosphorus and potassium" in d for d in out["disclaimers"])


def test_nulls_mean_coverage_gap(monkeypatch):
    monkeypatch.setattr(httpx, "get", _mock_get(NULL_RESPONSE))
    out = satellite_service.fetch_soilgrids(17.68, 83.21)
    assert out["available"] is False
    assert "coverage gap" in out["reason"]


def test_http_failure_falls_back(monkeypatch):
    monkeypatch.setattr(httpx, "get", _mock_get(exc=httpx.ConnectError("down")))
    out = satellite_service.fetch_soilgrids(0, 0)
    assert out["available"] is False
    assert "unreachable" in out["reason"]
