"""ML suitability endpoint.

POST /api/ml/suitability with either {"values": [...]} or {"report_id": ...}
(the same contract as /api/recommendations/crops). Returns one ML score per
prototype crop (paddy, cotton, chilli) plus the gaps behind each score.
Fertilizer doses never come from here — see ml_service.py.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.crop import ConfirmedValueRef
from app.services import ml_service
from app.services.report_store import resolve_values

router = APIRouter()


class MLSuitabilityRequest(BaseModel):
    values: list[ConfirmedValueRef] = []
    report_id: str | None = None


@router.post("/ml/suitability")
def ml_suitability(body: MLSuitabilityRequest):
    values, error = resolve_values(body.report_id, body.values)
    if error:
        raise HTTPException(status_code=400, detail=error)
    try:
        results = ml_service.predict_all(values or {})
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {
        "success": True,
        "results": results,
        "note": (
            "ML scores compare your soil against each crop's ideal needs; "
            "they do not set fertilizer doses, which stay rules-based."),
    }
