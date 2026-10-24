"""Crop suitability + fertiliser recommendation endpoints."""
from fastapi import APIRouter, HTTPException

from app.models.crop import CropSuitabilityRequest, CropSuitabilityResponse
from app.models.recommendation import FertilizerRequest, FertilizerResponse
from app.services import crop_recommendation, fertilizer_calculator
from app.services.report_store import resolve_values

router = APIRouter()


@router.post("/recommendations/crops", response_model=CropSuitabilityResponse)
def crop_suitability(body: CropSuitabilityRequest):
    values, err = resolve_values(body.report_id, body.values)
    if err:
        raise HTTPException(status_code=400, detail=err)
    assert values is not None
    results, warnings = crop_recommendation.evaluate_all(values)
    return CropSuitabilityResponse(success=True, results=results, warnings=warnings)


@router.post("/recommendations/fertilizer", response_model=FertilizerResponse)
def fertilizer(body: FertilizerRequest):
    values, err = resolve_values(body.report_id, body.values)
    if err:
        raise HTTPException(status_code=400, detail=err)
    assert values is not None
    return fertilizer_calculator.recommend(body, values)
