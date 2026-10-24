"""Satellite/modelled soil data endpoint (ISRIC SoilGrids v2.0).

GET /api/soil/satellite?lat=..&lon=..

Returns MODELLED estimates (~250 m), never lab measurements. Honest about
coverage gaps: some locations return no data.
"""
from fastapi import APIRouter, HTTPException

from app.services import satellite_service

router = APIRouter()


@router.get("/soil/satellite")
def satellite(lat: float, lon: float):
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="lat must be -90..90 and lon -180..180.")
    return satellite_service.fetch_soilgrids(lat, lon)
