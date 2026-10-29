"""Zone + water lookup endpoints (district -> agro-climatic zone)."""

from fastapi import APIRouter, HTTPException

from app.services import zone_service

router = APIRouter()


@router.get("/zones/districts")
def zone_districts():
    try:
        return {"success": True, "districts": zone_service.districts()}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/zones/lookup")
def zone_lookup(district: str):
    try:
        result = zone_service.lookup(district)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"success": True, **result}
