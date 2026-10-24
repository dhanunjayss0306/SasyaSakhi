"""Season tracking: prototype fertilizer application schedule.

GET /api/tracking/fertilizer-schedule?crop=paddy&n_kg_ha=120&lat=..&lon=..

Stage-based schedule from the dataset's N split percentages — exact
days-after-sowing are NOT in the dataset and are never invented.
Optional lat/lon attaches a rain-aware timing advisory (best effort).
"""
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.services import schedule_service, weather_service

router = APIRouter()


@router.get("/tracking/fertilizer-schedule")
def fertilizer_schedule(crop: str, n_kg_ha: float,
                        lat: Optional[float] = None, lon: Optional[float] = None):
    if n_kg_ha <= 0 or n_kg_ha > 500:
        raise HTTPException(status_code=400, detail="n_kg_ha must be within 0-500.")
    result = schedule_service.build_schedule(crop, n_kg_ha)
    if not result.get("available"):
        raise HTTPException(status_code=404, detail=result.get("reason"))
    if lat is not None and lon is not None:
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise HTTPException(status_code=400, detail="lat must be -90..90 and lon -180..180.")
        # Best effort: weather must never break the schedule endpoint.
        try:
            live = weather_service.get_live_weather(lat, lon)
            result["rain_advisory"] = (live.get("fertilizer_timing_advisory")
                                       if live.get("available") else None)
            result["weather_note"] = ("Rain advisory unavailable — weather provider unreachable."
                                      if not live.get("available") else None)
        except Exception:
            result["rain_advisory"] = None
            result["weather_note"] = "Rain advisory unavailable."
    return result
