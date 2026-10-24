"""Live weather: parsing, rain advisory levels, fallback (HTTP mocked)."""
import httpx

from app.services import weather_service

SAMPLE = {
    "timezone": "Asia/Kolkata",
    "current": {"time": "2026-10-24T01:00", "temperature_2m": 26.6,
                "relative_humidity_2m": 80, "precipitation": 0.0,
                "weather_code": 3, "wind_speed_10m": 12.0},
    "hourly": {"precipitation": [0.0] * 10 + [12.0] + [0.0] * 37,
               "precipitation_probability": [10] * 10 + [90] + [10] * 37},
    "daily": {"time": ["2026-10-24", "2026-10-25", "2026-10-26"],
              "temperature_2m_max": [31, 30, 30], "temperature_2m_min": [24, 24, 23],
              "precipitation_sum": [12.0, 0.0, 0.0],
              "precipitation_probability_max": [90, 10, 5]},
}


class FakeResp:
    def raise_for_status(self):
        pass

    def json(self):
        return SAMPLE


def test_live_weather_parses_and_advises(monkeypatch):
    monkeypatch.setattr(httpx, "get", lambda *a, **k: FakeResp())
    out = weather_service.get_live_weather(17.68, 83.21)
    assert out["available"] is True
    assert out["current"]["temperature_c"] == 26.6
    assert len(out["forecast_3day"]) == 3
    assert out["rain_next_48h"]["max_hourly_mm"] == 12.0
    adv = out["fertilizer_timing_advisory"]
    assert adv["level"] == "postpone"
    assert "postponing urea" in adv["text"]


def test_advisory_levels():
    assert weather_service._rain_advisory(0.5, 20, 1.0)["level"] == "favourable"
    assert weather_service._rain_advisory(3.0, 20, 5.0)["level"] == "caution"
    assert weather_service._rain_advisory(0.0, 85, 2.0)["level"] == "postpone"


def test_live_weather_fallback(monkeypatch):
    def boom(*a, **k):
        raise httpx.ConnectError("down")
    monkeypatch.setattr(httpx, "get", boom)
    out = weather_service.get_live_weather(0, 0)
    assert out["available"] is False
