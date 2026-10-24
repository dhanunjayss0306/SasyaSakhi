"""Weather endpoint (optional, never blocks the soil workflow)."""
from fastapi import APIRouter, HTTPException

from app.services import weather_service

router = APIRouter()


@router.get("/weather")
def weather(lat: float, lon: float):
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="lat must be -90..90 and lon -180..180.")
    return weather_service.get_weather(lat, lon)


@router.get("/weather/live")
def weather_live(lat: float, lon: float):
    """Rain-aware live weather: current + 48 h hourly rain + 3-day outlook
    with a fertilizer-timing advisory. Optional enrichment — never blocks
    the soil-analysis path."""
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="lat must be -90..90 and lon -180..180.")
    return weather_service.get_live_weather(lat, lon)
