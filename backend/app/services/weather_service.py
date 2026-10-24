"""Weather service — Open-Meteo (no API key needed).

Returns real current conditions only when the provider responds. Any failure
degrades to {"available": false} — weather never blocks the soil workflow and
is never invented.
"""
from __future__ import annotations

import logging
from typing import Optional

import httpx

log = logging.getLogger("soilsaathi.weather")


def get_weather(lat: float, lon: float) -> dict:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lon, "current": "temperature_2m,relative_humidity_2m,"
        "precipitation,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "forecast_days": 3, "timezone": "auto",
    }
    try:
        r = httpx.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as exc:
        log.warning("weather provider failed: %s", exc)
        return {"available": False, "reason": f"Weather provider unreachable: {exc}"}
    cur = data.get("current", {})
    daily = data.get("daily", {})
    return {
        "available": True,
        "provider": "Open-Meteo",
        "latitude": lat, "longitude": lon,
        "timezone": data.get("timezone"),
        "current": {
            "temperature_c": cur.get("temperature_2m"),
            "humidity_pct": cur.get("relative_humidity_2m"),
            "precipitation_mm": cur.get("precipitation"),
            "wind_kmh": cur.get("wind_speed_10m"),
            "weather_code": cur.get("weather_code"),
            "time": cur.get("time"),
        },
        "forecast_3day": [
            {"date": d,
             "max_c": daily.get("temperature_2m_max", [None])[i] if i < len(daily.get("temperature_2m_max", [])) else None,
             "min_c": daily.get("temperature_2m_min", [None])[i] if i < len(daily.get("temperature_2m_min", [])) else None,
             "rain_prob_pct": daily.get("precipitation_probability_max", [None])[i] if i < len(daily.get("precipitation_probability_max", [])) else None}
            for i, d in enumerate(daily.get("time", []))
        ],
    }


def get_live_weather(lat: float, lon: float) -> dict:
    """Rain-aware live weather: current conditions + hourly rain for the next
    48 h + 3-day daily outlook, with a simple fertilizer-timing advisory.
    Never raises — failures become {"available": False}. Never blocks callers:
    use it as an optional enrichment only."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "hourly": "precipitation,precipitation_probability",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
        "forecast_days": 3, "timezone": "auto",
    }
    try:
        r = httpx.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
    except Exception as exc:
        log.warning("live weather failed: %s", exc)
        return {"available": False, "reason": f"Weather provider unreachable: {exc}"}

    cur = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})
    # Next 48 h of hourly rain.
    rain_48h = (hourly.get("precipitation") or [])[:48]
    prob_48h = (hourly.get("precipitation_probability") or [])[:48]
    max_rain_24h = max(rain_48h[:24] or [0])
    max_prob_48h = max(prob_48h or [0])
    rain_sum_48h = round(sum(x or 0 for x in rain_48h), 1)

    advisory = _rain_advisory(max_rain_24h, max_prob_48h, rain_sum_48h)
    days = []
    for i, d in enumerate(daily.get("time", [])):
        days.append({
            "date": d,
            "max_c": (daily.get("temperature_2m_max") or [None])[i],
            "min_c": (daily.get("temperature_2m_min") or [None])[i],
            "rain_mm": (daily.get("precipitation_sum") or [None])[i],
            "rain_prob_pct": (daily.get("precipitation_probability_max") or [None])[i],
        })
    return {
        "available": True,
        "provider": "Open-Meteo",
        "latitude": lat, "longitude": lon,
        "timezone": data.get("timezone"),
        "current": {
            "temperature_c": cur.get("temperature_2m"),
            "humidity_pct": cur.get("relative_humidity_2m"),
            "precipitation_mm": cur.get("precipitation"),
            "wind_kmh": cur.get("wind_speed_10m"),
            "weather_code": cur.get("weather_code"),
            "time": cur.get("time"),
        },
        "rain_next_48h": {
            "total_mm": rain_sum_48h,
            "max_hourly_mm": max_rain_24h,
            "max_probability_pct": max_prob_48h,
        },
        "forecast_3day": days,
        "fertilizer_timing_advisory": advisory,
    }


def _rain_advisory(max_rain_24h: float, max_prob_48h: float, rain_sum_48h: float) -> dict:
    """Simple heuristic advisory for fertilizer timing. Labelled as heuristic."""
    if max_rain_24h >= 10 or max_prob_48h >= 80:
        level, text = "postpone", (
            "Heavy rain likely within 24-48 h — consider postponing urea top-dressing "
            "to avoid nitrogen losses through runoff and leaching.")
    elif max_rain_24h >= 2 or max_prob_48h >= 50:
        level, text = "caution", (
            "Light to moderate rain possible — a scheduled split can go ahead, but avoid "
            "applying just before an expected downpour.")
    else:
        level, text = "favourable", (
            "No significant rain expected in the next 48 h — conditions are suitable "
            "for a scheduled fertilizer split.")
    return {"level": level, "text": text,
            "note": "Heuristic based on forecast rain only; confirm with local conditions."}
