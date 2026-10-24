"""Soil analysis endpoint."""
from fastapi import APIRouter, HTTPException

from app.models.recommendation import SoilAnalysisRequest, SoilAnalysisResponse
from app.services import soil_analysis
from app.services.report_store import resolve_values

router = APIRouter()


@router.post("/soil-analysis", response_model=SoilAnalysisResponse)
def run_analysis(body: SoilAnalysisRequest):
    values, err = resolve_values(body.report_id, body.values)
    if err:
        raise HTTPException(status_code=400, detail=err)
    assert values is not None
    assessments, notes = soil_analysis.analyze(values)
    warnings = []
    if not any(v.get("value") is not None for v in values.values()):
        warnings.append("No measured values were supplied — every parameter reports insufficient_data.")
    return SoilAnalysisResponse(success=True, assessments=assessments,
                                overall_notes=notes, warnings=warnings)
