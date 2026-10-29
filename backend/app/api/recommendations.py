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


@router.get("/recommendations/fertilizer/general", response_model=FertilizerResponse)
def fertilizer_general(crop: str, area: float = 1.0, area_unit: str = "acre"):
    """General published RDF plan for a crop, with NO soil-test values.

    Powers the 'I Already Have a Crop' flow. Always dose_basis
    general_reference; never soil-test adjusted.
    """
    return fertilizer_calculator.general_reference_plan(crop, area, area_unit)


@router.post("/recommendations/fertilizer", response_model=FertilizerResponse)
def fertilizer(body: FertilizerRequest):
    values, err = resolve_values(body.report_id, body.values)
    if err:
        raise HTTPException(status_code=400, detail=err)
    assert values is not None
    return fertilizer_calculator.recommend(body, values)
